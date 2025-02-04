import { BattleResolver } from "@/agent/BattleResolver";
import { prisma } from "@/config/prisma";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { TerrainType, BattleType, BattleStatus } from "@prisma/client";
import { createNextGame } from "@/config/setup";
import { PublicKey } from "@solana/web3.js";
import { jest } from "@jest/globals";

describe("BattleResolver", () => {
  let battleResolver: BattleResolver;
  let program: any;
  let gameId: string;
  let profileId: string;
  let gameOnchainId: number;

  beforeAll(async () => {
    // Initialize Solana program
    program = await getProgramWithWallet();

    // Create a new game with actual on-chain state
    const { agents, gameAccount } = await createNextGame();
    const firstAgent = agents[0];

    // Get the game from database to access onchainId
    const game = await prisma.game.findUnique({
      where: { id: firstAgent.agent.gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    gameId = firstAgent.agent.gameId;
    profileId = firstAgent.agent.profileId;
    gameOnchainId = Number(game.onchainId);

    // Initialize BattleResolver with real program instance
    battleResolver = new BattleResolver(gameOnchainId, program, prisma);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$transaction([
      prisma.coolDown.deleteMany(),
      prisma.battle.deleteMany(),
      prisma.alliance.deleteMany(),
      prisma.agent.deleteMany(),
      prisma.game.deleteMany(),
      prisma.mapTile.deleteMany(),
    ]);
    await prisma.$disconnect();
  });

  describe("Battle Resolution Service", () => {
    it("should start and stop battle resolution interval", async () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval");
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      await battleResolver.start();
      expect(setIntervalSpy).toHaveBeenCalled();

      // Start again to test clearing previous interval
      await battleResolver.start();
      expect(clearIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe("Simple Battle Resolution (1v1)", () => {
    let attacker: any;
    let defender: any;
    let battle: any;

    beforeEach(async () => {
      // Create attacker
      attacker = await prisma.agent.create({
        data: {
          onchainId: 2,
          authority: "attacker-authority",
          gameId,
          health: 100,
          profileId,
          isAlive: true,
          mapTiles: {
            create: {
              x: 1,
              y: 1,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });

      // Create defender
      defender = await prisma.agent.create({
        data: {
          onchainId: 3,
          authority: "defender-authority",
          gameId,
          health: 100,
          profileId,
          isAlive: true,
          mapTiles: {
            create: {
              x: 2,
              y: 2,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });

      // Create battle that started 1 hour ago
      battle = await prisma.battle.create({
        data: {
          type: BattleType.Simple,
          status: BattleStatus.Active,
          tokensStaked: 100,
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          gameId,
          attackerId: attacker.id,
          defenderId: defender.id,
        },
      });
    });

    it("should resolve simple battle and apply health penalties", async () => {
      await battleResolver["checkAndResolveBattles"]();

      // Verify battle resolution
      const resolvedBattle = await prisma.battle.findUnique({
        where: { id: battle.id },
      });
      expect(resolvedBattle?.status).toBe(BattleStatus.Resolved);
      expect(resolvedBattle?.endTime).toBeDefined();

      // Verify health penalties
      const [updatedAttacker, updatedDefender] = await Promise.all([
        prisma.agent.findUnique({ where: { id: attacker.id } }),
        prisma.agent.findUnique({ where: { id: defender.id } }),
      ]);

      expect(updatedAttacker).not.toBeNull();
      expect(updatedDefender).not.toBeNull();

      if (!updatedAttacker || !updatedDefender) {
        throw new Error("Failed to fetch updated agents");
      }

      // One of them should have reduced health
      expect(
        updatedAttacker.health === 100 || updatedDefender.health === 100
      ).toBeTruthy();
      expect(
        updatedAttacker.health < 100 || updatedDefender.health < 100
      ).toBeTruthy();
    });

    it("should handle agent death when health drops to zero", async () => {
      // Set defender's health low
      await prisma.agent.update({
        where: { id: defender.id },
        data: { health: 5 }, // Will die after 5% health penalty
      });

      await battleResolver["checkAndResolveBattles"]();

      const deadAgent = await prisma.agent.findUnique({
        where: { id: defender.id },
      });

      expect(deadAgent?.isAlive).toBe(false);
      expect(deadAgent?.health).toBe(0);
      expect(deadAgent?.deathTimestamp).toBeDefined();
    });

    it("should not resolve battle before cooldown period", async () => {
      // Create a recent battle
      const recentBattle = await prisma.battle.create({
        data: {
          type: BattleType.Simple,
          status: BattleStatus.Active,
          tokensStaked: 100,
          startTime: new Date(), // Just started
          gameId,
          attackerId: attacker.id,
          defenderId: defender.id,
        },
      });

      await battleResolver["checkAndResolveBattles"]();

      const unresolvedBattle = await prisma.battle.findUnique({
        where: { id: recentBattle.id },
      });
      expect(unresolvedBattle?.status).toBe(BattleStatus.Active);
      expect(unresolvedBattle?.endTime).toBeNull();
    });
  });

  describe("Agent vs Alliance Battle Resolution (1v2)", () => {
    let singleAgent: any;
    let allianceLeader: any;
    let alliancePartner: any;
    let battle: any;

    beforeEach(async () => {
      // Create single agent
      singleAgent = await prisma.agent.create({
        data: {
          onchainId: 4,
          authority: "single-agent-authority",
          gameId,
          health: 100,
          profileId,
          isAlive: true,
          mapTiles: {
            create: {
              x: 3,
              y: 3,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });

      // Create alliance members
      [allianceLeader, alliancePartner] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 5,
            authority: "alliance-leader-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 4,
                y: 4,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 6,
            authority: "alliance-partner-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 5,
                y: 5,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      // Create alliance
      await prisma.alliance.create({
        data: {
          initiatorId: allianceLeader.id,
          joinerId: alliancePartner.id,
          gameId,
          status: "Active",
          combinedTokens: 200,
          timestamp: new Date(),
        },
      });

      // Create battle
      battle = await prisma.battle.create({
        data: {
          type: BattleType.AgentVsAlliance,
          status: BattleStatus.Active,
          tokensStaked: 150,
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          gameId,
          attackerId: singleAgent.id,
          defenderId: allianceLeader.id,
          defenderAllyId: alliancePartner.id,
        },
      });
    });

    it("should resolve agent vs alliance battle", async () => {
      await battleResolver["checkAndResolveBattles"]();

      // Verify battle resolution
      const resolvedBattle = await prisma.battle.findUnique({
        where: { id: battle.id },
      });
      expect(resolvedBattle?.status).toBe(BattleStatus.Resolved);
      expect(resolvedBattle?.endTime).toBeDefined();

      // Verify health penalties
      const [updatedSingle, updatedLeader, updatedPartner] = await Promise.all([
        prisma.agent.findUnique({ where: { id: singleAgent.id } }),
        prisma.agent.findUnique({ where: { id: allianceLeader.id } }),
        prisma.agent.findUnique({ where: { id: alliancePartner.id } }),
      ]);

      expect(updatedSingle).not.toBeNull();
      expect(updatedLeader).not.toBeNull();
      expect(updatedPartner).not.toBeNull();

      if (!updatedSingle || !updatedLeader || !updatedPartner) {
        throw new Error("Failed to fetch updated agents");
      }

      // Either single agent or both alliance members should have reduced health
      if (updatedSingle.health < 100) {
        expect(updatedLeader.health).toBe(100);
        expect(updatedPartner.health).toBe(100);
      } else {
        expect(updatedLeader.health).toBeLessThan(100);
        expect(updatedPartner.health).toBeLessThan(100);
      }
    });
  });

  describe("Alliance vs Alliance Battle Resolution (2v2)", () => {
    let allianceALeader: any;
    let allianceAPartner: any;
    let allianceBLeader: any;
    let allianceBPartner: any;
    let battle: any;

    beforeEach(async () => {
      // Create alliance A members
      [allianceALeader, allianceAPartner] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 7,
            authority: "alliance-a-leader-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 6,
                y: 6,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 8,
            authority: "alliance-a-partner-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 7,
                y: 7,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      // Create alliance B members
      [allianceBLeader, allianceBPartner] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 9,
            authority: "alliance-b-leader-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 8,
                y: 8,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 10,
            authority: "alliance-b-partner-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 9,
                y: 9,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      // Create alliances
      await Promise.all([
        prisma.alliance.create({
          data: {
            initiatorId: allianceALeader.id,
            joinerId: allianceAPartner.id,
            gameId,
            status: "Active",
            combinedTokens: 300,
            timestamp: new Date(),
          },
        }),
        prisma.alliance.create({
          data: {
            initiatorId: allianceBLeader.id,
            joinerId: allianceBPartner.id,
            gameId,
            status: "Active",
            combinedTokens: 300,
            timestamp: new Date(),
          },
        }),
      ]);

      // Create battle
      battle = await prisma.battle.create({
        data: {
          type: BattleType.AllianceVsAlliance,
          status: BattleStatus.Active,
          tokensStaked: 200,
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          gameId,
          attackerId: allianceALeader.id,
          attackerAllyId: allianceAPartner.id,
          defenderId: allianceBLeader.id,
          defenderAllyId: allianceBPartner.id,
        },
      });
    });

    it("should resolve alliance vs alliance battle", async () => {
      await battleResolver["checkAndResolveBattles"]();

      // Verify battle resolution
      const resolvedBattle = await prisma.battle.findUnique({
        where: { id: battle.id },
      });
      expect(resolvedBattle?.status).toBe(BattleStatus.Resolved);
      expect(resolvedBattle?.endTime).toBeDefined();

      // Verify health penalties
      const [updatedALeader, updatedAPartner, updatedBLeader, updatedBPartner] =
        await Promise.all([
          prisma.agent.findUnique({ where: { id: allianceALeader.id } }),
          prisma.agent.findUnique({ where: { id: allianceAPartner.id } }),
          prisma.agent.findUnique({ where: { id: allianceBLeader.id } }),
          prisma.agent.findUnique({ where: { id: allianceBPartner.id } }),
        ]);

      expect(updatedALeader).not.toBeNull();
      expect(updatedAPartner).not.toBeNull();
      expect(updatedBLeader).not.toBeNull();
      expect(updatedBPartner).not.toBeNull();

      if (
        !updatedALeader ||
        !updatedAPartner ||
        !updatedBLeader ||
        !updatedBPartner
      ) {
        throw new Error("Failed to fetch updated agents");
      }

      // Either alliance A or alliance B should have reduced health
      if (updatedALeader.health < 100) {
        expect(updatedAPartner.health).toBeLessThan(100);
        expect(updatedBLeader.health).toBe(100);
        expect(updatedBPartner.health).toBe(100);
      } else {
        expect(updatedALeader.health).toBe(100);
        expect(updatedAPartner.health).toBe(100);
        expect(updatedBLeader.health).toBeLessThan(100);
        expect(updatedBPartner.health).toBeLessThan(100);
      }
    });

    it("should handle multiple battles in different stages", async () => {
      // Create additional battles in different stages
      await Promise.all([
        // Recent battle (not ready for resolution)
        prisma.battle.create({
          data: {
            type: BattleType.Simple,
            status: BattleStatus.Active,
            tokensStaked: 100,
            startTime: new Date(), // Just started
            gameId,
            attackerId: allianceALeader.id,
            defenderId: allianceBLeader.id,
          },
        }),
        // Ready for resolution
        prisma.battle.create({
          data: {
            type: BattleType.AgentVsAlliance,
            status: BattleStatus.Active,
            tokensStaked: 150,
            startTime: new Date(Date.now() - 3600000), // 1 hour ago
            gameId,
            attackerId: allianceALeader.id,
            defenderId: allianceBLeader.id,
            defenderAllyId: allianceBPartner.id,
          },
        }),
      ]);

      await battleResolver["checkAndResolveBattles"]();

      // Verify battle resolutions
      const battles = await prisma.battle.findMany({
        where: { gameId },
        orderBy: { startTime: "asc" },
      });

      // Count resolved and active battles
      const resolvedCount = battles.filter(
        (b) => b.status === BattleStatus.Resolved
      ).length;
      const activeCount = battles.filter(
        (b) => b.status === BattleStatus.Active
      ).length;

      expect(resolvedCount).toBe(2); // Original battle + one ready for resolution
      expect(activeCount).toBe(1); // Recent battle should still be active
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid battle configurations", async () => {
      // Create a battle with invalid configuration (3 agents)
      const [agent1, agent2, agent3] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 11,
            authority: "agent1-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 10,
                y: 10,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 12,
            authority: "agent2-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 11,
                y: 11,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 13,
            authority: "agent3-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 12,
                y: 12,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      const invalidBattle = await prisma.battle.create({
        data: {
          type: BattleType.Simple,
          status: BattleStatus.Active,
          tokensStaked: 100,
          startTime: new Date(Date.now() - 3600000),
          gameId,
          attackerId: agent1.id,
          defenderId: agent2.id,
          defenderAllyId: agent3.id, // Invalid for Simple battle type
        },
      });

      await battleResolver["checkAndResolveBattles"]();

      // Battle should be marked as cancelled due to invalid configuration
      const updatedBattle = await prisma.battle.findUnique({
        where: { id: invalidBattle.id },
      });
      expect(updatedBattle?.status).toBe(BattleStatus.Cancelled);
    });

    it("should handle dead agents in battles", async () => {
      // Create a battle where one agent dies before resolution
      const [attacker, defender] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 14,
            authority: "dead-attacker-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 13,
                y: 13,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 15,
            authority: "defender-authority",
            gameId,
            health: 100,
            profileId,
            isAlive: true,
            mapTiles: {
              create: {
                x: 14,
                y: 14,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      const battle = await prisma.battle.create({
        data: {
          type: BattleType.Simple,
          status: BattleStatus.Active,
          tokensStaked: 100,
          startTime: new Date(Date.now() - 3600000),
          gameId,
          attackerId: attacker.id,
          defenderId: defender.id,
        },
      });

      // Kill the attacker
      await prisma.agent.update({
        where: { id: attacker.id },
        data: {
          isAlive: false,
          health: 0,
          deathTimestamp: new Date(),
        },
      });

      await battleResolver["checkAndResolveBattles"]();

      // Battle should be cancelled due to dead participant
      const updatedBattle = await prisma.battle.findUnique({
        where: { id: battle.id },
      });
      expect(updatedBattle?.status).toBe(BattleStatus.Cancelled);
    });
  });
});
