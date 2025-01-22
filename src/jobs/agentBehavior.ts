import { PrismaClient } from "@prisma/client";
import { GameService } from "../services/game.service";
import { LLMService } from "../services/llm.service";
import { TwitterService } from "../services/twitter.service";
import { TerrainType, AgentType } from "../types/game";

export class AgentBehaviorJob {
  private prisma: PrismaClient;
  private gameService: GameService;
  private llmService: LLMService;
  private twitterService: TwitterService;
  private isRunning: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.gameService = new GameService();
    this.llmService = new LLMService();
    this.twitterService = new TwitterService();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Starting agent behavior job...");

    while (this.isRunning) {
      try {
        await this.processAgentBehaviors();
        // Wait 5 minutes between iterations
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
      } catch (error) {
        console.error("Error in agent behavior job:", error);
        await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
      }
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  private async processAgentBehaviors(): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { isAlive: true },
    });

    for (const agent of agents) {
      try {
        await this.processAgentDecision(agent);
      } catch (error) {
        console.error(`Error processing agent ${agent.name}:`, error);
      }
    }
  }

  private async processAgentDecision(agent: any): Promise<void> {
    // Gather game state information
    const nearbyAgents = await this.findNearbyAgents(agent);
    const recentBattles = await this.prisma.battle.findMany({
      where: {
        OR: [{ initiatorId: agent.id }, { defenderId: agent.id }],
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    // Get community feedback from Twitter
    const communityFeedback = await this.twitterService.getAgentFeedback(agent);

    // Get terrain at current position
    const terrain = this.determineTerrainType(agent.positionX, agent.positionY);

    // Get AI decision
    const decision = await this.llmService.getNextMove(agent, {
      nearbyAgents,
      recentBattles,
      communityFeedback,
      terrain,
    });

    // Execute decision
    await this.executeAgentDecision(agent, decision);

    // Process community influence
    await this.processAgentInfluence(agent, communityFeedback);
  }

  private async executeAgentDecision(
    agent: any,
    decision: {
      action: "MOVE" | "BATTLE" | "ALLIANCE" | "WAIT";
      target?: any;
      position?: { x: number; y: number };
      reason: string;
    }
  ): Promise<void> {
    switch (decision.action) {
      case "MOVE":
        if (decision.position) {
          const terrain = this.determineTerrainType(
            decision.position.x,
            decision.position.y
          );
          await this.gameService.moveAgent(
            agent.id,
            decision.position,
            terrain
          );
        }
        break;

      case "BATTLE":
        if (decision.target) {
          const strategy = await this.llmService.getBattleStrategy(
            agent,
            decision.target,
            [] // Add previous battles if needed
          );

          if (strategy.shouldFight) {
            await this.gameService.processBattle(agent.id, decision.target.id);
          }
        }
        break;

      case "ALLIANCE":
        if (decision.target) {
          await this.gameService.formAlliance(agent.id, decision.target.id);
        }
        break;

      case "WAIT":
        // No action needed
        break;
    }

    // Generate and post tweet about the action
    const tweet = await this.llmService.generateTweet(agent, {
      event: decision.action,
      details: {
        reason: decision.reason,
        target: decision.target,
        position: decision.position,
      },
    });
    await this.twitterService.postTweet(agent, tweet);
  }

  private async processAgentInfluence(
    agent: any,
    feedback: any
  ): Promise<void> {
    const adjustments = await this.llmService.processCommunityFeedback(
      agent,
      feedback
    );

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        aggressiveness: adjustments.adjustedAggressiveness,
        alliancePropensity: adjustments.adjustedAlliancePropensity,
      },
    });
  }

  private async findNearbyAgents(agent: any): Promise<any[]> {
    const allAgents = await this.prisma.agent.findMany({
      where: {
        isAlive: true,
        id: { not: agent.id },
      },
    });

    return allAgents.filter((other: any) => {
      const distance = Math.sqrt(
        Math.pow(other.positionX - agent.positionX, 2) +
          Math.pow(other.positionY - agent.positionY, 2)
      );
      return distance <= 10; // Agents within 10 units are considered nearby
    });
  }

  private determineTerrainType(x: number, y: number): TerrainType {
    // Simplified terrain determination
    const distance = Math.sqrt(x * x + y * y);
    if (distance > 50) return TerrainType.MOUNTAIN;
    if (distance > 30) return TerrainType.RIVER;
    return TerrainType.NORMAL;
  }
}
