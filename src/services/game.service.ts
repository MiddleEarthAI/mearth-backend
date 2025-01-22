import { PrismaClient } from "@prisma/client";
import { SolanaService } from "./solana.service";
import { Agent, Position, TerrainType, AgentType } from "../types/game";
import { logger } from "../utils/logger";
import { calculateDistance } from "../utils/math";

export class GameService {
  private readonly prisma: PrismaClient;
  private readonly solanaService: SolanaService;

  constructor() {
    this.prisma = new PrismaClient();
    this.solanaService = new SolanaService();
  }

  /**
   * Initialize default agents
   */
  public async initializeDefaultAgents(): Promise<void> {
    const defaultAgents = [
      {
        type: AgentType.SCOOTLES,
        name: "Scootles",
        position: { x: 0, y: 0 },
        twitterHandle: process.env.SCOOTLES_TWITTER_HANDLE || "",
        characteristics: {
          aggressiveness: 80,
          alliancePropensity: 40,
          influenceability: 50,
        },
      },
      {
        type: AgentType.PURRLOCK_PAWS,
        name: "Purrlock Paws",
        position: { x: 30, y: 30 },
        twitterHandle: process.env.PURRLOCK_TWITTER_HANDLE || "",
        characteristics: {
          aggressiveness: 60,
          alliancePropensity: 20,
          influenceability: 30,
        },
      },
      {
        type: AgentType.SIR_GULLIHOP,
        name: "Sir Gullihop",
        position: { x: -30, y: 30 },
        twitterHandle: process.env.GULLIHOP_TWITTER_HANDLE || "",
        characteristics: {
          aggressiveness: 30,
          alliancePropensity: 90,
          influenceability: 70,
        },
      },
      {
        type: AgentType.WANDERLEAF,
        name: "Wanderleaf",
        position: { x: 0, y: -30 },
        twitterHandle: process.env.WANDERLEAF_TWITTER_HANDLE || "",
        characteristics: {
          aggressiveness: 40,
          alliancePropensity: 50,
          influenceability: 90,
        },
      },
    ];

    for (const agentData of defaultAgents) {
      // Create agent in database
      const dbAgent = await this.prisma.agent.create({
        data: {
          type: agentData.type,
          name: agentData.name,
          positionX: agentData.position.x,
          positionY: agentData.position.y,
          twitterHandle: agentData.twitterHandle,
          aggressiveness: agentData.characteristics.aggressiveness,
          alliancePropensity: agentData.characteristics.alliancePropensity,
          influenceability: agentData.characteristics.influenceability,
          isAlive: true,
          tokenBalance: 1000, // Initial token balance
        },
      });

      // Transform database agent to our Agent type
      const agent: Agent = {
        id: dbAgent.id,
        type: dbAgent.type as AgentType,
        name: dbAgent.name,
        position: {
          x: dbAgent.positionX,
          y: dbAgent.positionY,
        },
        twitterHandle: dbAgent.twitterHandle,
        characteristics: {
          aggressiveness: dbAgent.aggressiveness,
          alliancePropensity: dbAgent.alliancePropensity,
          influenceability: dbAgent.influenceability,
        },
        isAlive: dbAgent.isAlive,
        tokenBalance: dbAgent.tokenBalance,
      };

      // Initialize agent on-chain
      await this.solanaService.initializeAgent(agent);

      logger.info(`Agent ${agent.name} initialized`);
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
   * Process a battle between agents
   */
  public async processBattle(
    initiatorId: string,
    defenderId: string
  ): Promise<void> {
    const [initiator, defender] = await Promise.all([
      this.prisma.agent.findUnique({ where: { id: initiatorId } }),
      this.prisma.agent.findUnique({ where: { id: defenderId } }),
    ]);

    if (!initiator || !defender) {
      throw new Error("Agent not found");
    }

    // Check if agents are in range
    const distance = Math.sqrt(
      Math.pow(defender.positionX - initiator.positionX, 2) +
        Math.pow(defender.positionY - initiator.positionY, 2)
    );

    if (distance > 2) {
      throw new Error("Agents are not in range for battle");
    }

    // Check battle cooldown (4 hours)
    const lastBattle = await this.prisma.battle.findFirst({
      where: {
        OR: [
          { initiatorId, defenderId },
          { initiatorId: defenderId, defenderId: initiatorId },
        ],
      },
      orderBy: { timestamp: "desc" },
    });

    if (
      lastBattle &&
      Date.now() - lastBattle.timestamp.getTime() < 4 * 60 * 60 * 1000
    ) {
      throw new Error("Battle cooldown not expired");
    }

    // Calculate battle probability
    const initiatorWinProbability = this.calculateBattleProbability(
      initiator.tokenBalance,
      defender.tokenBalance
    );

    // Determine winner
    const initiatorWins = Math.random() < initiatorWinProbability;
    const loser = initiatorWins ? defender : initiator;
    const winner = initiatorWins ? initiator : defender;

    // Calculate token burn
    const tokensBurned = this.calculateTokenBurn(loser.tokenBalance);

    // Process battle on-chain first
    await this.solanaService.processBattle(
      initiatorId,
      defenderId,
      tokensBurned
    );

    // Check for death (5% chance on loss)
    const dies = Math.random() < 0.05;

    // Update database
    await this.prisma.$transaction(async (prisma) => {
      // Create battle record
      await prisma.battle.create({
        data: {
          initiatorId,
          defenderId,
          tokensBurned,
          outcome: initiatorWins ? "WIN" : "LOSS",
          locationX: defender.positionX,
          locationY: defender.positionY,
        },
      });

      // Update loser's token balance
      await prisma.agent.update({
        where: { id: loser.id },
        data: {
          tokenBalance: {
            decrement: tokensBurned,
          },
          isAlive: !dies,
        },
      });

      // If agent dies, transfer remaining tokens to winner
      if (dies) {
        const remainingTokens = loser.tokenBalance - tokensBurned;
        await prisma.agent.update({
          where: { id: winner.id },
          data: {
            tokenBalance: {
              increment: remainingTokens,
            },
          },
        });
      }
    });

    logger.info(
      `Battle processed: ${initiator.name} vs ${defender.name}, ` +
        `${tokensBurned} tokens burned, ` +
        `${loser.name} ${dies ? "died" : "survived"}`
    );
  }

  /**
   * Form an alliance between agents
   */
  public async formAlliance(agent1Id: string, agent2Id: string): Promise<void> {
    const [agent1, agent2] = await Promise.all([
      this.prisma.agent.findUnique({ where: { id: agent1Id } }),
      this.prisma.agent.findUnique({ where: { id: agent2Id } }),
    ]);

    if (!agent1 || !agent2) {
      throw new Error("Agent not found");
    }

    // Check if agents are in range
    const distance = Math.sqrt(
      Math.pow(agent2.positionX - agent1.positionX, 2) +
        Math.pow(agent2.positionY - agent1.positionY, 2)
    );

    if (distance > 2) {
      throw new Error("Agents are not in range for alliance");
    }

    // Check alliance cooldown (24 hours)
    const lastAlliance = await this.prisma.alliance.findFirst({
      where: {
        OR: [
          { agent1Id, agent2Id },
          { agent1Id: agent2Id, agent2Id: agent1Id },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (
      lastAlliance &&
      Date.now() - lastAlliance.createdAt.getTime() < 24 * 60 * 60 * 1000
    ) {
      throw new Error("Alliance cooldown not expired");
    }

    // Check battle cooldown (4 hours)
    const lastBattle = await this.prisma.battle.findFirst({
      where: {
        OR: [
          { initiatorId: agent1Id, defenderId: agent2Id },
          { initiatorId: agent2Id, defenderId: agent1Id },
        ],
      },
      orderBy: { timestamp: "desc" },
    });

    if (
      lastBattle &&
      Date.now() - lastBattle.timestamp.getTime() < 4 * 60 * 60 * 1000
    ) {
      throw new Error("Battle cooldown not expired");
    }

    // Form alliance on-chain first
    await this.solanaService.formAlliance(agent1Id, agent2Id);

    // Update database
    await this.prisma.$transaction([
      this.prisma.alliance.create({
        data: {
          agent1Id,
          agent2Id,
        },
      }),
      this.prisma.agent.update({
        where: { id: agent1Id },
        data: { allianceWith: agent2Id },
      }),
      this.prisma.agent.update({
        where: { id: agent2Id },
        data: { allianceWith: agent1Id },
      }),
    ]);

    logger.info(`Alliance formed between ${agent1.name} and ${agent2.name}`);
  }

  /**
   * Break alliance between agents
   */
  public async breakAlliance(agentId: string): Promise<void> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || !agent.allianceWith) {
      throw new Error("Agent not found or no active alliance");
    }

    // Break alliance on-chain first
    await this.solanaService.breakAlliance(agentId, agent.allianceWith);

    // Update database
    await this.prisma.$transaction([
      this.prisma.agent.update({
        where: { id: agentId },
        data: { allianceWith: null },
      }),
      this.prisma.agent.update({
        where: { id: agent.allianceWith },
        data: { allianceWith: null },
      }),
    ]);

    logger.info(`Alliance broken for agent ${agent.name}`);
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
   * Move agent to new position
   */
  public async moveAgent(
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
    await this.solanaService.updateAgentPosition(
      agentId,
      position.x,
      position.y
    );

    // Update database
    await this.prisma.$transaction([
      this.prisma.agent.update({
        where: { id: agentId },
        data: {
          positionX: position.x,
          positionY: position.y,
        },
      }),
      this.prisma.movement.create({
        data: {
          agentId,
          fromX: prismaAgent.positionX,
          fromY: prismaAgent.positionY,
          toX: position.x,
          toY: position.y,
          terrain,
          speed,
        },
      }),
    ]);

    logger.info(
      `Agent ${agent.name} moved to (${position.x}, ${position.y}) at speed ${speed} in ${terrain}`
    );
  }

  /**
   * Find nearby agents within range
   */
  public async findNearbyAgents(
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

  /**
   * Determine terrain type at position
   */
  public determineTerrainType(position: Position): TerrainType {
    const distance = Math.sqrt(
      position.x * position.x + position.y * position.y
    );
    if (distance > 50) return TerrainType.MOUNTAIN;
    if (distance > 30) return TerrainType.RIVER;
    return TerrainType.PLAIN;
  }
}
