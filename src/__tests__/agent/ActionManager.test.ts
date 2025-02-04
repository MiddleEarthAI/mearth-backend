import { prisma } from "@/config/prisma";
import { getProgramWithWallet } from "@/utils/program";
import { ActionManager } from "@/agent/ActionManager";
import { BN } from "@coral-xyz/anchor";
import { TerrainType, BattleType, BattleStatus } from "@prisma/client";
import { createNextGame } from "@/config/setup";
import { getGamePDA, getAgentPDA } from "@/utils/pda";
import { MearthProgram } from "@/types";
import { PublicKey } from "@solana/web3.js";

/**
 * Test suite for the ActionManager class
 * Tests all major functionalities including:
 * - Game state validation
 * - Movement actions and validation
 * - Battle actions and different battle types
 * - Alliance formation and validation
 * - Error handling and edge cases
 */
describe("ActionManager", () => {
  let actionManager: ActionManager;
  let program: MearthProgram;
  let gameId: string;
  let agentId: string;
  let profileId: string;
  let gamePda: PublicKey;
  let agentPda: PublicKey;
  let gameOnchainId: number;

  beforeAll(async () => {
    // Initialize Solana program
    program = await getProgramWithWallet();

    // Try to find an active game first
    let game = await prisma.game.findFirst({
      where: { isActive: true },
      include: {
        agents: {
          where: { isAlive: true },
          take: 1,
          include: {
            profile: true,
          },
        },
      },
    });

    let firstAgent;

    // If no active game exists, create a new one
    if (!game || game.agents.length === 0) {
      console.log("No active game found. Creating a new game...");
      const { agents, gameAccount } = await createNextGame();
      firstAgent = agents[0];

      game = await prisma.game.findUnique({
        where: { id: firstAgent.agent.gameId },
        include: {
          agents: {
            where: { isAlive: true },
            take: 1,
            include: {
              profile: true,
            },
          },
        },
      });

      if (!game) {
        throw new Error("Failed to create new game");
      }
    } else {
      firstAgent = { agent: game.agents[0] };
    }

    // Set up test variables
    gameId = game.id;
    agentId = firstAgent.agent.id;
    profileId = firstAgent.agent.profileId;
    gameOnchainId = Number(game.onchainId);

    // Initialize ActionManager with real program instance
    actionManager = new ActionManager(program, gameOnchainId, prisma);

    // Get PDAs for later use
    [gamePda] = getGamePDA(program.programId, new BN(gameOnchainId));
    [agentPda] = getAgentPDA(
      program.programId,
      gamePda,
      firstAgent.agent.onchainId
    );
  });

  beforeEach(async () => {
    // Clear occupiedBy for all map tiles before each test
    await prisma.mapTile.updateMany({
      where: {
        occupiedBy: {
          not: null,
        },
      },
      data: { occupiedBy: null },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$transaction([
      prisma.coolDown.deleteMany(),
      prisma.battle.deleteMany(),
      prisma.alliance.deleteMany(),
      prisma.agent.deleteMany(),
      prisma.game.deleteMany(),
      prisma.mapTile.updateMany({
        data: { occupiedBy: null },
      }),
    ]);
    await prisma.$disconnect();
  });

  describe("Game State Validation", () => {
    it("should validate active game state", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const moveAction = {
        type: "MOVE" as const,
        x: 2,
        y: 2,
      };

      const result = await actionManager.executeAction(
        actionContext,
        moveAction
      );
      expect(result.success).toBe(true);
    });

    it("should reject actions for inactive game", async () => {
      // Deactivate the game
      await prisma.game.update({
        where: { id: gameId },
        data: { isActive: false },
      });

      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const moveAction = {
        type: "MOVE" as const,
        x: 3,
        y: 3,
      };

      const result = await actionManager.executeAction(
        actionContext,
        moveAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not active");

      // Reactivate the game for other tests
      await prisma.game.update({
        where: { id: gameId },
        data: { isActive: true },
      });
    });
  });

  describe("Movement Actions", () => {
    it("should execute move action successfully", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const moveAction = {
        type: "MOVE" as const,
        x: 4,
        y: 4,
      };

      const result = await actionManager.executeAction(
        actionContext,
        moveAction
      );
      expect(result.success).toBe(true);

      // Verify database update
      const updatedAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { mapTiles: true },
      });

      expect(updatedAgent?.mapTiles[0].x).toBe(4);
      expect(updatedAgent?.mapTiles[0].y).toBe(4);
    });

    it("should enforce movement cooldown", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      // Create a cooldown
      await prisma.coolDown.create({
        data: {
          type: "Move",
          endsAt: new Date(Date.now() + 60000), // 1 minute from now
          cooledAgentId: agentId,
          gameId,
        },
      });

      const moveAction = {
        type: "MOVE" as const,
        x: 5,
        y: 5,
      };

      const result = await actionManager.executeAction(
        actionContext,
        moveAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.type).toBe("MOVE");
      expect(result.feedback?.error?.message).toContain("cooldown");
    });

    it("should prevent moving to occupied tiles", async () => {
      // Create an occupied tile
      await prisma.mapTile.create({
        data: {
          x: 6,
          y: 6,
          terrainType: TerrainType.Plain,
          occupiedBy: agentId,
        },
      });

      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const moveAction = {
        type: "MOVE" as const,
        x: 6,
        y: 6,
      };

      const result = await actionManager.executeAction(
        actionContext,
        moveAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("occupied");
    });
  });

  describe("Battle Actions", () => {
    let targetAgent: any;

    beforeEach(async () => {
      // Create target agent for battle (using Scootles profile - ID: 2)
      targetAgent = await prisma.agent.create({
        data: {
          onchainId: 2,
          authority: "test-authority",
          gameId,
          health: 100,
          profileId: "2", // Scootles profile
          isAlive: true,
          mapTiles: {
            create: {
              x: 5,
              y: 5,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });
    });

    it("should initiate simple battle successfully", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const battleAction = {
        type: "BATTLE" as const,
        targetId: 2,
        tokensToStake: 100,
      };

      const result = await actionManager.executeAction(
        actionContext,
        battleAction
      );
      expect(result.success).toBe(true);
    });

    it("should prevent battle with dead agent", async () => {
      // Kill target agent
      await prisma.agent.update({
        where: { id: targetAgent.id },
        data: {
          isAlive: false,
          health: 0,
          deathTimestamp: new Date(),
        },
      });

      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const battleAction = {
        type: "BATTLE" as const,
        targetId: 2,
        tokensToStake: 100,
      };

      const result = await actionManager.executeAction(
        actionContext,
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");
    });

    it("should handle alliance vs alliance battle", async () => {
      // Create two more agents (Sir Gullihop - ID: 3 and Wanderleaf - ID: 4)
      const [allyAgent1, allyAgent2] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 3,
            authority: "ally-1-authority",
            gameId,
            health: 100,
            profileId: "3",
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
        prisma.agent.create({
          data: {
            onchainId: 4,
            authority: "ally-2-authority",
            gameId,
            health: 100,
            profileId: "4",
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
      ]);

      // Create alliances
      await Promise.all([
        prisma.alliance.create({
          data: {
            initiatorId: agentId,
            joinerId: allyAgent1.id,
            gameId,
            status: "Active",
            combinedTokens: 200,
            timestamp: new Date(),
          },
        }),
        prisma.alliance.create({
          data: {
            initiatorId: targetAgent.id,
            joinerId: allyAgent2.id,
            gameId,
            status: "Active",
            combinedTokens: 200,
            timestamp: new Date(),
          },
        }),
      ]);

      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const battleAction = {
        type: "BATTLE" as const,
        targetId: 2,
        tokensToStake: 200,
      };

      const result = await actionManager.executeAction(
        actionContext,
        battleAction
      );
      expect(result.success).toBe(true);
    });
  });

  describe("Alliance Actions", () => {
    let targetAgent: any;

    beforeEach(async () => {
      // Create target agent for alliance (using Sir Gullihop - ID: 3)
      targetAgent = await prisma.agent.create({
        data: {
          onchainId: 3,
          authority: "alliance-target-authority",
          gameId,
          health: 100,
          profileId: "3",
          isAlive: true,
          mapTiles: {
            create: {
              x: 9,
              y: 9,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });
    });

    it("should form alliance successfully", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const allianceAction = {
        type: "ALLIANCE" as const,
        targetId: 3,
        combinedTokens: 200,
      };

      const result = await actionManager.executeAction(
        actionContext,
        allianceAction
      );
      expect(result.success).toBe(true);

      // Verify alliance in database
      const alliance = await prisma.alliance.findFirst({
        where: {
          initiatorId: agentId,
          joinerId: targetAgent.id,
          status: "Active",
        },
      });
      expect(alliance).toBeTruthy();
    });

    it("should prevent alliance with dead agent", async () => {
      // Kill target agent
      await prisma.agent.update({
        where: { id: targetAgent.id },
        data: {
          isAlive: false,
          health: 0,
          deathTimestamp: new Date(),
        },
      });

      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      const allianceAction = {
        type: "ALLIANCE" as const,
        targetId: 3,
        combinedTokens: 200,
      };

      const result = await actionManager.executeAction(
        actionContext,
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");
    });

    it("should enforce alliance cooldown", async () => {
      const actionContext = {
        gameId,
        gameOnchainId: new BN(gameOnchainId),
        agentId,
        agentOnchainId: 1,
      };

      // Create a cooldown
      await prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + 60000), // 1 minute from now
          cooledAgentId: agentId,
          gameId,
        },
      });

      const allianceAction = {
        type: "ALLIANCE" as const,
        targetId: 3,
        combinedTokens: 200,
      };

      const result = await actionManager.executeAction(
        actionContext,
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });
  });
});
