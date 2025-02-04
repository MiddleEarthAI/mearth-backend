import { MapSystem } from "@/agent/MapSystem";
import { PrismaClient, TerrainType } from "@prisma/client";
import EventEmitter from "events";
import { jest } from "@jest/globals";

describe("MapSystem", () => {
  let mapSystem: MapSystem;
  let prisma: PrismaClient;
  let eventEmitter: EventEmitter;
  let gameId: string;
  let profileId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    eventEmitter = new EventEmitter();
    mapSystem = new MapSystem(prisma, eventEmitter);

    // Create test game
    const game = await prisma.game.create({
      data: {
        onchainId: BigInt(1),
        authority: "test-authority",
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 30,
        isActive: true,
        lastUpdate: new Date(),
        bump: 1,
        dailyRewardTokens: 1000.0,
      },
    });
    gameId = game.id;

    // Create test profile
    const profile = await prisma.agentProfile.create({
      data: {
        onchainId: 1,
        name: "Test Agent",
        xHandle: "test_agent",
        characteristics: ["Brave", "Strategic"],
        lore: ["Ancient warrior"],
        knowledge: ["Combat tactics"],
        traits: {
          aggression: {
            value: 80,
            description: "High aggression",
          },
        },
      },
    });
    profileId = profile.id;
  });

  afterAll(async () => {
    await prisma.$transaction([
      prisma.mapTile.deleteMany(),
      prisma.agent.deleteMany(),
      prisma.agentProfile.deleteMany(),
      prisma.game.deleteMany(),
    ]);
    await prisma.$disconnect();
  });

  describe("Map Boundaries", () => {
    it("should validate positions within circular map", () => {
      // Center of map
      expect(mapSystem.isWithinCircle(15, 15)).toBe(true);

      // Edge cases
      expect(mapSystem.isWithinCircle(0, 15)).toBe(true);
      expect(mapSystem.isWithinCircle(29, 15)).toBe(true);
      expect(mapSystem.isWithinCircle(15, 0)).toBe(true);
      expect(mapSystem.isWithinCircle(15, 29)).toBe(true);

      // Outside map
      expect(mapSystem.isWithinCircle(-1, 15)).toBe(false);
      expect(mapSystem.isWithinCircle(30, 15)).toBe(false);
      expect(mapSystem.isWithinCircle(15, -1)).toBe(false);
      expect(mapSystem.isWithinCircle(15, 30)).toBe(false);
    });
  });

  describe("Movement Validation", () => {
    let agentId: string;

    beforeEach(async () => {
      // Create test agent
      const agent = await prisma.agent.create({
        data: {
          onchainId: 1,
          authority: "test-authority",
          gameId,
          health: 100,
          profileId,
          mapTiles: {
            create: {
              x: 15,
              y: 15,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });
      agentId = agent.id;
    });

    it("should allow movement when no cooldown or effects are active", async () => {
      const result = await mapSystem.canMove(agentId);
      expect(result.canMove).toBe(true);
    });

    it("should prevent movement during cooldown period", async () => {
      // Record a movement
      await mapSystem.recordMovement(agentId, {
        x: 16,
        y: 15,
        terrainType: TerrainType.Plain,
      });

      const result = await mapSystem.canMove(agentId);
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain("Movement cooldown active");
    });
  });

  describe("Terrain Effects", () => {
    let agentId: string;

    beforeEach(async () => {
      // Create test agent
      const agent = await prisma.agent.create({
        data: {
          onchainId: 2,
          authority: "test-authority",
          gameId,
          health: 100,
          profileId,
          mapTiles: {
            create: {
              x: 10,
              y: 10,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });
      agentId = agent.id;
    });

    it("should apply mountain terrain effect", async () => {
      await mapSystem.recordMovement(agentId, {
        x: 11,
        y: 10,
        terrainType: TerrainType.Mountain,
      });

      const result = await mapSystem.canMove(agentId);
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain("mountain");
    });

    it("should apply river terrain effect", async () => {
      await mapSystem.recordMovement(agentId, {
        x: 11,
        y: 11,
        terrainType: TerrainType.River,
      });

      const result = await mapSystem.canMove(agentId);
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain("river");
    });

    it("should clear terrain effects", async () => {
      // Apply effect
      await mapSystem.recordMovement(agentId, {
        x: 12,
        y: 10,
        terrainType: TerrainType.Mountain,
      });

      // Clear effect
      mapSystem.clearEffects(agentId);

      // Should be able to move (if not in cooldown)
      jest
        .spyOn(mapSystem["lastMoveTime"], "get")
        .mockReturnValue(new Date(Date.now() - 3600000));

      const result = await mapSystem.canMove(agentId);
      expect(result.canMove).toBe(true);
    });
  });

  describe("Agent Interactions", () => {
    let agent1Id: string;
    let agent2Id: string;
    let agent3Id: string;

    beforeEach(async () => {
      // Create three test agents at different positions
      const [agent1, agent2, agent3] = await Promise.all([
        prisma.agent.create({
          data: {
            onchainId: 3,
            authority: "test-authority-1",
            gameId,
            health: 100,
            profileId,
            mapTiles: {
              create: {
                x: 5,
                y: 5,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
        prisma.agent.create({
          data: {
            onchainId: 4,
            authority: "test-authority-2",
            gameId,
            health: 100,
            profileId,
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
            onchainId: 5,
            authority: "test-authority-3",
            gameId,
            health: 100,
            profileId,
            mapTiles: {
              create: {
                x: 15,
                y: 15,
                terrainType: TerrainType.Plain,
              },
            },
          },
        }),
      ]);

      agent1Id = agent1.id;
      agent2Id = agent2.id;
      agent3Id = agent3.id;
    });

    it("should find agents within interaction range", async () => {
      const nearbyAgents = await mapSystem.getAgentsInRange(agent1Id, 2);
      expect(nearbyAgents).toContain(agent2Id);
      expect(nearbyAgents).not.toContain(agent3Id);
    });

    it("should emit movement events", async () => {
      const eventPromise = new Promise<void>((resolve) => {
        eventEmitter.once("agentMoved", ({ agentId, position }) => {
          expect(agentId).toBe(agent1Id);
          expect(position.x).toBe(6);
          expect(position.y).toBe(5);
          resolve();
        });
      });

      await mapSystem.recordMovement(agent1Id, {
        x: 6,
        y: 5,
        terrainType: TerrainType.Plain,
      });

      await eventPromise;
    });
  });
});
