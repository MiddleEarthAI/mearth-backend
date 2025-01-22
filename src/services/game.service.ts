import { PrismaClient } from "@prisma/client";
import { Agent, Position, TerrainType, BattleOutcome } from "../types/game";
import { TwitterService } from "./twitter.service";
import { ProgramService } from "./program.service";

const prisma = new PrismaClient();
const twitterService = new TwitterService();
const programService = new ProgramService();

export class GameService {
  private static readonly MAP_DIAMETER = 120;
  private static readonly BATTLE_RANGE = 2;
  private static readonly MOUNTAIN_SPEED_REDUCTION = 0.5;
  private static readonly RIVER_SPEED_REDUCTION = 0.7;
  private static readonly DEATH_CHANCE_TERRAIN = 0.01;
  private static readonly DEATH_CHANCE_BATTLE = 0.05;
  private static readonly ALLIANCE_COOLDOWN_HOURS = 24;
  private static readonly BATTLE_COOLDOWN_HOURS = 4;

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  }

  /**
   * Check if two agents are within battle range
   */
  private areAgentsInRange(agent1: Agent, agent2: Agent): boolean {
    return (
      this.calculateDistance(agent1.position, agent2.position) <=
      GameService.BATTLE_RANGE
    );
  }

  /**
   * Calculate movement speed based on terrain
   */
  private calculateSpeed(terrain: TerrainType, baseSpeed: number): number {
    switch (terrain) {
      case TerrainType.MOUNTAIN:
        return baseSpeed * GameService.MOUNTAIN_SPEED_REDUCTION;
      case TerrainType.RIVER:
        return baseSpeed * GameService.RIVER_SPEED_REDUCTION;
      default:
        return baseSpeed;
    }
  }

  /**
   * Process a battle between two agents with Twitter and Solana integration
   */
  async processBattle(
    initiatorId: string,
    defenderId: string
  ): Promise<BattleOutcome> {
    const [initiator, defender] = await Promise.all([
      prisma.agent.findUnique({ where: { id: initiatorId } }),
      prisma.agent.findUnique({ where: { id: defenderId } }),
    ]);

    if (!initiator || !defender) {
      throw new Error("Agent not found");
    }

    // Announce battle intention
    await twitterService.announceBattleIntention(
      initiator,
      defender.twitterHandle
    );

    const totalTokens = initiator.tokenBalance + defender.tokenBalance;
    const initiatorWinProbability = initiator.tokenBalance / totalTokens;
    const isInitiatorWinner = Math.random() < initiatorWinProbability;

    const loser = isInitiatorWinner ? defender : initiator;
    const winner = isInitiatorWinner ? initiator : defender;

    // Calculate token burn (31-50%)
    const burnPercentage = 31 + Math.floor(Math.random() * 20);
    const tokensBurned = (loser.tokenBalance * burnPercentage) / 100;

    // Check for death
    const isDead = Math.random() < GameService.DEATH_CHANCE_BATTLE;

    // Process battle on-chain first
    await programService.processBattle(initiatorId, defenderId, tokensBurned);

    // Update database after chain confirmation
    await prisma.$transaction([
      prisma.battle.create({
        data: {
          initiatorId: initiator.id,
          defenderId: defender.id,
          outcome: isDead ? BattleOutcome.DEATH : BattleOutcome.LOSS,
          tokensBurned,
          locationX: loser.positionX,
          locationY: loser.positionY,
        },
      }),
      prisma.agent.update({
        where: { id: loser.id },
        data: {
          tokenBalance: loser.tokenBalance - tokensBurned,
          isAlive: !isDead,
          lastBattleTime: new Date(),
        },
      }),
      prisma.agent.update({
        where: { id: winner.id },
        data: { lastBattleTime: new Date() },
      }),
    ]);

    // Announce battle outcome
    await twitterService.announceBattleOutcome(winner, loser, tokensBurned);

    return isDead
      ? BattleOutcome.DEATH
      : isInitiatorWinner
      ? BattleOutcome.WIN
      : BattleOutcome.LOSS;
  }

  /**
   * Form an alliance between two agents with Twitter and Solana integration
   */
  async formAlliance(agent1Id: string, agent2Id: string): Promise<void> {
    const [agent1, agent2] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agent1Id } }),
      prisma.agent.findUnique({ where: { id: agent2Id } }),
    ]);

    if (!agent1 || !agent2) {
      throw new Error("Agent not found");
    }

    // Record alliance on-chain first
    await programService.recordAlliance(agent1Id, agent2Id);

    // Update database after chain confirmation
    await prisma.alliance.create({
      data: {
        agent1Id,
        agent2Id,
        formedAt: new Date(),
      },
    });

    await prisma.agent.updateMany({
      where: { id: { in: [agent1Id, agent2Id] } },
      data: { lastAllianceTime: new Date() },
    });

    // Announce alliance formation
    await twitterService.announceAlliance(agent1, agent2.twitterHandle);
  }

  /**
   * Move an agent to a new position with Twitter and Solana integration
   */
  async moveAgent(
    agentId: string,
    to: Position,
    terrain: TerrainType
  ): Promise<void> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error("Agent not found");

    const speed = this.calculateSpeed(terrain, 1);
    const isDead =
      terrain !== TerrainType.NORMAL &&
      Math.random() < GameService.DEATH_CHANCE_TERRAIN;

    // Update position on-chain first
    await programService.updateAgentPosition(agentId, to.x, to.y);

    // Update database after chain confirmation
    await prisma.$transaction([
      prisma.movement.create({
        data: {
          agentId,
          fromX: agent.positionX,
          fromY: agent.positionY,
          toX: to.x,
          toY: to.y,
          terrain,
          speed,
          timestamp: new Date(),
        },
      }),
      prisma.agent.update({
        where: { id: agentId },
        data: {
          positionX: to.x,
          positionY: to.y,
          isAlive: !isDead,
        },
      }),
    ]);

    // Announce movement
    const reason =
      terrain === TerrainType.NORMAL
        ? "to explore new territories"
        : `through ${terrain.toLowerCase()} terrain`;
    await twitterService.announceMovement(agent, reason);

    if (isDead) {
      throw new Error("Agent died during movement");
    }
  }

  /**
   * Initialize a new agent on-chain and in database
   */
  async initializeAgent(
    type: string,
    name: string,
    twitterHandle: string,
    initialTokens: number
  ): Promise<Agent> {
    // Initialize agent on-chain first
    const agentPDA = await programService.initializeAgent(
      name,
      type,
      initialTokens
    );

    // Create agent in database after chain confirmation
    const agent = await prisma.agent.create({
      data: {
        type,
        name,
        twitterHandle,
        tokenBalance: initialTokens,
        positionX: 0,
        positionY: 0,
        aggressiveness: Math.floor(Math.random() * 100),
        alliancePropensity: Math.floor(Math.random() * 100),
        influenceability: Math.floor(Math.random() * 100),
      },
    });

    return agent;
  }

  /**
   * Process community influence on agent behavior
   */
  async processAgentInfluence(agentId: string): Promise<void> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error("Agent not found");

    await twitterService.monitorInteractions(agent);
    // Additional influence processing logic based on tweet engagement
  }
}
