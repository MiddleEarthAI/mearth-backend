import { PrismaClient } from "@prisma/client";
import { SolanaService } from "./solana.service";
import { Agent, Position, TerrainType } from "../types/game";
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
        type: "SCOOTLES",
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
        type: "PURRLOCK_PAWS",
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
        type: "SIR_GULLIHOP",
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
        type: "WANDERLEAF",
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
      const agent = await this.prisma.agent.create({
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

      // Initialize agent on-chain
      await this.solanaService.initializeAgent({
        ...agent,
        position: { x: agent.positionX, y: agent.positionY },
        characteristics: {
          aggressiveness: agent.aggressiveness,
          alliancePropensity: agent.alliancePropensity,
          influenceability: agent.influenceability,
        },
      });

      logger.info(`Agent ${agent.name} initialized`);
    }
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

    // Calculate token burn amount (31-50% of defender's tokens)
    const tokensBurned = Math.floor(
      defender.tokenBalance * (Math.random() * 0.2 + 0.31)
    );

    // Process battle on-chain first
    await this.solanaService.processBattle(
      initiatorId,
      defenderId,
      tokensBurned
    );

    // Update database
    await this.prisma.$transaction([
      this.prisma.battle.create({
        data: {
          initiatorId,
          defenderId,
          tokensBurned,
          outcome:
            initiator.tokenBalance > defender.tokenBalance ? "WIN" : "LOSS",
          positionX: defender.positionX,
          positionY: defender.positionY,
        },
      }),
      this.prisma.agent.update({
        where: { id: defenderId },
        data: {
          tokenBalance: {
            decrement: tokensBurned,
          },
        },
      }),
    ]);

    logger.info(
      `Battle processed: ${initiator.name} vs ${defender.name}, ${tokensBurned} tokens burned`
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

    // Form alliance on-chain first
    await this.solanaService.formAlliance(agent1Id, agent2Id);

    // Update database
    await this.prisma.alliance.create({
      data: {
        agent1Id,
        agent2Id,
      },
    });

    logger.info(`Alliance formed between ${agent1.name} and ${agent2.name}`);
  }

  /**
   * Move agent to new position
   */
  public async moveAgent(
    agentId: string,
    position: Position,
    terrain: TerrainType
  ): Promise<void> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
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
          fromX: agent.positionX,
          fromY: agent.positionY,
          toX: position.x,
          toY: position.y,
          terrain,
        },
      }),
    ]);

    logger.info(`Agent ${agent.name} moved to (${position.x}, ${position.y})`);
  }

  /**
   * Find nearby agents within range
   */
  public async findNearbyAgents(
    agent: Agent,
    range: number = 10
  ): Promise<Agent[]> {
    const agents = await this.prisma.agent.findMany({
      where: {
        isAlive: true,
        id: { not: agent.id },
      },
    });

    return agents.filter((other) => {
      const distance = calculateDistance(
        { x: agent.position.x, y: agent.position.y },
        { x: other.positionX, y: other.positionY }
      );
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
    return TerrainType.NORMAL;
  }
}
