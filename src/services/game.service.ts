import { PrismaClient } from "@prisma/client";
import { IGameService } from "../types/services";
import {
  Agent,
  Position,
  TerrainType,
  GameState,
  AgentType,
  Battle,
} from "../types/game";
import { logger } from "../utils/logger";
import { calculateDistance } from "../utils/math";

export class GameService implements IGameService {
  constructor(private readonly prisma: PrismaClient) {
    logger.info("Game service initialized");
  }

  async initializeDefaultAgents(): Promise<void> {
    try {
      const agentCount = await this.prisma.agent.count();
      if (agentCount === 0) {
        await this.prisma.agent.createMany({
          data: [
            {
              type: "SCOOTLES",
              name: "Scootles",
              positionX: 0,
              positionY: 0,
              aggressiveness: 80,
              alliancePropensity: 40,
              influenceability: 50,
              twitterHandle: process.env.SCOOTLES_TWITTER_HANDLE || "",
              tokenBalance: 1000,
              isAlive: true,
            },
            {
              type: "PURRLOCK_PAWS",
              name: "Purrlock Paws",
              positionX: 30,
              positionY: 30,
              aggressiveness: 60,
              alliancePropensity: 20,
              influenceability: 30,
              twitterHandle: process.env.PURRLOCK_TWITTER_HANDLE || "",
              tokenBalance: 1000,
              isAlive: true,
            },
            {
              type: "SIR_GULLIHOP",
              name: "Sir Gullihop",
              positionX: -30,
              positionY: 30,
              aggressiveness: 30,
              alliancePropensity: 90,
              influenceability: 70,
              twitterHandle: process.env.GULLIHOP_TWITTER_HANDLE || "",
              tokenBalance: 1000,
              isAlive: true,
            },
            {
              type: "WANDERLEAF",
              name: "Wanderleaf",
              positionX: 0,
              positionY: -30,
              aggressiveness: 40,
              alliancePropensity: 50,
              influenceability: 90,
              twitterHandle: process.env.WANDERLEAF_TWITTER_HANDLE || "",
              tokenBalance: 1000,
              isAlive: true,
            },
          ],
        });
        logger.info("Default agents initialized");
      }
    } catch (error) {
      logger.error("Failed to initialize default agents:", error);
      throw error;
    }
  }

  async initializeAgent(
    agentId: string,
    name: string,
    type: string
  ): Promise<void> {
    try {
      await this.prisma.agent.create({
        data: {
          id: agentId,
          name,
          type,
          positionX: 0,
          positionY: 0,
          aggressiveness: 50,
          alliancePropensity: 50,
          influenceability: 50,
          twitterHandle: "", // Will be updated later
          tokenBalance: 1000,
          isAlive: true,
        },
      });
      logger.info(`Agent ${name} (${agentId}) initialized`);
    } catch (error) {
      logger.error(`Failed to initialize agent ${name}:`, error);
      throw error;
    }
  }

  async processBattle(initiatorId: string, defenderId: string): Promise<void> {
    try {
      const [initiator, defender] = await Promise.all([
        this.prisma.agent.findUnique({ where: { id: initiatorId } }),
        this.prisma.agent.findUnique({ where: { id: defenderId } }),
      ]);

      if (!initiator || !defender) {
        throw new Error("One or both agents not found");
      }

      // Battle processing logic here
      logger.info(
        `Battle processed between ${initiator.name} and ${defender.name}`
      );
    } catch (error) {
      logger.error("Failed to process battle:", error);
      throw error;
    }
  }

  async formAlliance(agent1Id: string, agent2Id: string): Promise<void> {
    try {
      await this.prisma.alliance.create({
        data: {
          agent1Id,
          agent2Id,
        },
      });
      logger.info(`Alliance formed between ${agent1Id} and ${agent2Id}`);
    } catch (error) {
      logger.error("Failed to form alliance:", error);
      throw error;
    }
  }

  async breakAlliance(agentId: string): Promise<void> {
    try {
      await this.prisma.alliance.deleteMany({
        where: {
          OR: [{ agent1Id: agentId }, { agent2Id: agentId }],
        },
      });
      logger.info(`Alliances broken for agent ${agentId}`);
    } catch (error) {
      logger.error("Failed to break alliance:", error);
      throw error;
    }
  }

  async moveAgent(
    agentId: string,
    x: number,
    y: number,
    terrain: TerrainType
  ): Promise<void> {
    try {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          positionX: x,
          positionY: y,
        },
      });
      logger.info(`Agent ${agentId} moved to (${x}, ${y})`);
    } catch (error) {
      logger.error("Failed to move agent:", error);
      throw error;
    }
  }

  async findNearbyAgents(agent: Agent, range: number = 5): Promise<Agent[]> {
    try {
      const nearbyAgents = await this.prisma.agent.findMany({
        where: {
          AND: [
            { id: { not: agent.id } },
            {
              positionX: {
                gte: agent.position.x - range,
                lte: agent.position.x + range,
              },
            },
            {
              positionY: {
                gte: agent.position.y - range,
                lte: agent.position.y + range,
              },
            },
          ],
        },
      });
      return nearbyAgents.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type as AgentType,
        position: { x: a.positionX, y: a.positionY },
        characteristics: {
          aggressiveness: a.aggressiveness,
          alliancePropensity: a.alliancePropensity,
          influenceability: a.influenceability,
        },
        tokenBalance: a.tokenBalance,
        isAlive: a.isAlive,
        twitterHandle: a.twitterHandle,
      })) as Agent[];
    } catch (error) {
      logger.error("Failed to find nearby agents:", error);
      throw error;
    }
  }

  determineTerrainType(position: Position): TerrainType {
    // Implement terrain type determination based on position
    return TerrainType.PLAIN;
  }

  async getGameState(): Promise<GameState> {
    try {
      const [agents, alliances, battles] = await Promise.all([
        this.prisma.agent.findMany(),
        this.prisma.alliance.findMany(),
        this.prisma.battle.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      return {
        agents: agents.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type as AgentType,
          position: { x: a.positionX, y: a.positionY },
          characteristics: {
            aggressiveness: a.aggressiveness,
            alliancePropensity: a.alliancePropensity,
            influenceability: a.influenceability,
          },
          tokenBalance: a.tokenBalance,
          isAlive: a.isAlive,
          twitterHandle: a.twitterHandle,
        })) as Agent[],
        alliances,
        recentBattles: battles.map((b) => ({
          id: b.id,
          initiatorId: b.initiatorId,
          defenderId: b.defenderId,
          timestamp: b.timestamp,
          outcome: b.outcome as "WIN" | "LOSS",
          tokensBurned: b.tokensBurned,
          positionX: b.locationX,
          positionY: b.locationY,
        })) as Battle[],
      };
    } catch (error) {
      logger.error("Failed to get game state:", error);
      throw error;
    }
  }

  /**
   * Calculate battle outcome probability based on token balances
   */
  private calculateBattleProbability(
    initiatorTokens: number,
    defenderTokens: number
  ): number {
    const totalTokens = initiatorTokens + defenderTokens;
    return initiatorTokens / totalTokens;
  }

  /**
   * Calculate token burn amount (31-50%)
   */
  private calculateTokenBurn(tokenBalance: number): number {
    // Each percentage between 31-50 has 5% chance
    const burnPercentage = 31 + Math.floor(Math.random() * 20);
    return Math.floor(tokenBalance * (burnPercentage / 100));
  }

  /**
   * Check for terrain death chance
   */
  private async checkTerrainDeath(
    agent: Agent,
    terrain: TerrainType
  ): Promise<boolean> {
    if (terrain === TerrainType.MOUNTAIN || terrain === TerrainType.RIVER) {
      // 1% death chance in difficult terrain
      if (Math.random() < 0.01) {
        await this.prisma.agent.update({
          where: { id: agent.id },
          data: { isAlive: false },
        });
        logger.info(`Agent ${agent.name} has died crossing ${terrain}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate agent's movement speed based on terrain and tokens
   */
  private calculateMovementSpeed(agent: Agent, terrain: TerrainType): number {
    let baseSpeed = 1; // 1 unit per hour base speed

    // Adjust speed based on token balance
    const tokenMultiplier = Math.min(1.5, 1 + agent.tokenBalance / 10000); // Cap at 50% boost
    baseSpeed *= tokenMultiplier;

    // Apply terrain penalties
    switch (terrain) {
      case TerrainType.MOUNTAIN:
        baseSpeed *= 0.5; // 50% reduction
        break;
      case TerrainType.RIVER:
        baseSpeed *= 0.3; // 70% reduction
        break;
      default:
        break;
    }

    return baseSpeed;
  }

  /**
   * Transform Prisma agent to our Agent type
   */
  private transformPrismaAgent(prismaAgent: any): Agent {
    return {
      id: prismaAgent.id,
      type: prismaAgent.type as AgentType,
      name: prismaAgent.name,
      position: {
        x: prismaAgent.positionX,
        y: prismaAgent.positionY,
      },
      twitterHandle: prismaAgent.twitterHandle,
      characteristics: {
        aggressiveness: prismaAgent.aggressiveness,
        alliancePropensity: prismaAgent.alliancePropensity,
        influenceability: prismaAgent.influenceability,
      },
      isAlive: prismaAgent.isAlive,
      tokenBalance: prismaAgent.tokenBalance,
    };
  }

  /**
   * Move agent to new position
   */
  public async moveAgentToPosition(
    agentId: string,
    position: Position,
    terrain: TerrainType
  ): Promise<void> {
    const prismaAgent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!prismaAgent) {
      throw new Error("Agent not found");
    }

    const agent = this.transformPrismaAgent(prismaAgent);

    // Calculate movement speed
    const speed = this.calculateMovementSpeed(agent, terrain);

    // Check for terrain death
    if (await this.checkTerrainDeath(agent, terrain)) {
      return;
    }

    // Update position on-chain first
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        positionX: position.x,
        positionY: position.y,
      },
    });

    // Update database
    await this.prisma.movement.create({
      data: {
        agentId,
        fromX: prismaAgent.positionX,
        fromY: prismaAgent.positionY,
        toX: position.x,
        toY: position.y,
        terrain,
        speed,
      },
    });

    logger.info(
      `Agent ${agent.name} moved to (${position.x}, ${position.y}) at speed ${speed} in ${terrain}`
    );
  }

  /**
   * Find nearby agents within range
   */
  public async findNearbyAgentsInRange(
    agent: Agent,
    range: number = 10
  ): Promise<Agent[]> {
    const prismaAgents = await this.prisma.agent.findMany({
      where: {
        isAlive: true,
        id: { not: agent.id },
      },
    });

    // Transform Prisma agents into our Agent type
    return prismaAgents
      .map((prismaAgent) => ({
        id: prismaAgent.id,
        type: prismaAgent.type as AgentType,
        name: prismaAgent.name,
        position: {
          x: prismaAgent.positionX,
          y: prismaAgent.positionY,
        },
        twitterHandle: prismaAgent.twitterHandle,
        characteristics: {
          aggressiveness: prismaAgent.aggressiveness,
          alliancePropensity: prismaAgent.alliancePropensity,
          influenceability: prismaAgent.influenceability,
        },
        isAlive: prismaAgent.isAlive,
        tokenBalance: prismaAgent.tokenBalance,
      }))
      .filter((other) => {
        const distance = calculateDistance(agent.position, other.position);
        return distance <= range;
      });
  }
}
