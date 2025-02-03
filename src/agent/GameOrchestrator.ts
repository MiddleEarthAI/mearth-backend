import { logger } from "@/utils/logger";

import { prisma } from "@/config/prisma";
import { PrismaClient } from "@prisma/client";

import { getAgentPDA, getGamePDA } from "@/utils/pda";

import TwitterManager, { AgentId } from "@/agent/TwitterManager";
import { AgentBasicInfo, DecisionEngine } from "@/agent/DecisionEngine";
import CacheManager from "@/agent/CacheManager";
import { InfluenceCalculator } from "@/agent/InfluenceCalculator";
import EventEmitter from "events";
import { MearthProgram } from "@/types";
import { BN } from "@coral-xyz/anchor";
import { BattleResolver } from "./BattleResolver";
import { stringToUuid } from "@/utils/uuid";
import { TweetV2 } from "twitter-api-v2";
import { ActionManager, GameAction } from "./ActionManager";

/**
 * Service for managing AI agentData behavior and decision making
 * Handles game orchestration, agent updates, and event processing
 */
export class GameOrchestrator {
  private readonly updateInterval = process.env.UPDATE_INTERVAL
    ? parseInt(process.env.UPDATE_INTERVAL)
    : 60 * 60 * 1000; // 1 min for testing
  private readonly cleanupInterval = 3600000; // 1 hour
  private readonly actionManager: ActionManager;

  constructor(
    private currentGameId: number,
    private program: MearthProgram,
    private twitter: TwitterManager,
    private cache: CacheManager,
    private calculator: InfluenceCalculator,
    private engine: DecisionEngine,
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter,
    private battleResolver: BattleResolver
  ) {
    this.actionManager = new ActionManager(program, currentGameId, prisma);
    this.setupEventHandlers();
  }

  /**
   * Start the update loop and battle resolver
   */
  async start(): Promise<void> {
    logger.info("🎮 Game Orchestrator starting up...");
    this.startCleanupLoop();
    this.startUpdateLoop();
    await this.battleResolver.start();
    logger.info("🚀 Game Orchestrator successfully started");
  }

  private async startUpdateLoop(): Promise<void> {
    logger.info("⏰ Starting update loop");
    setInterval(async () => {
      try {
        await this.processAllAgents();
      } catch (error) {
        logger.error("❌ Update loop failed", { error });
        this.eventEmitter.emit("error", error);
      }
    }, this.updateInterval);
  }

  private async startCleanupLoop(): Promise<void> {
    logger.info("🧹 Starting cleanup loop");
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        logger.error("❌ Cleanup loop failed", { error });
        this.eventEmitter.emit("error", error);
      }
    }, this.cleanupInterval);
  }

  private setupEventHandlers(): void {
    logger.info("🎯 Setting up event handlers");
    this.eventEmitter.on("newAction", this.handleNewAction.bind(this));
    this.eventEmitter.on("error", this.handleError.bind(this));
  }

  private async handleNewAction(data: {
    agentId: string;
    action: GameAction;
  }): Promise<void> {
    try {
      logger.info("🎲 Processing new action", {
        agentId: data.agentId,
        actionType: data.action.type,
      });

      // Execute action through ActionManager
      await this.actionManager.executeAction(data.agentId, data.action);

      logger.info("✅ Action successfully processed", {
        agentId: data.agentId,
        actionType: data.action.type,
      });
    } catch (error) {
      logger.error("❌ Failed to handle new action", { error, data });
      this.eventEmitter.emit("error", error);
    }
  }

  private async handleError(error: Error): Promise<void> {
    logger.error("⚠️ System error occurred", { error });
    await this.attemptRecovery();
  }

  private async attemptRecovery(): Promise<void> {
    logger.info("🔄 Attempting system recovery...");
    try {
      await this.cache.invalidateCache("*");
      logger.info("✅ Recovery attempt completed successfully");
    } catch (error) {
      logger.error("❌ Recovery attempt failed", { error });
    }
  }

  private async processAllAgents(): Promise<void> {
    logger.info("👥 Processing all active agents");
    const agents = await prisma.agent.findMany({
      where: { game: { isActive: true }, health: { gt: 0 } },
      include: {
        game: {
          select: {
            id: true,
            onchainId: true,
          },
        },
      },
      take: 1,
    });

    await Promise.all(
      agents.map((agent) =>
        this.processAgent({
          agentId: agent.id,
          agentOnchainId: agent.onchainId,
          gameId: agent.game.id,
          gameOnchainId: agent.game.onchainId,
        })
      )
    );
    logger.info(`✅ Processed ${agents.length} agents`);
  }

  private async processAgent(agentInfo: AgentBasicInfo): Promise<void> {
    logger.info(`🤖 Processing agent ${agentInfo.agentId}`);

    try {
      throw "testing ";

      const recentTweets = await this.twitter.fetchRecentTweets(
        agentInfo.agentOnchainId.toString() as AgentId,
        5
      );
      for (const tweet of recentTweets) {
        await this.processTweetInteractions(agentInfo.agentId, tweet);
      }
    } catch (error) {
      logger.error(
        "Error processing community interactions, continue anyway...",
        { agentId: agentInfo.agentId, error }
      );
    }

    this.engine.proceedWithoutInteractions(agentInfo);
  }

  private async processTweetInteractions(
    agentId: string,
    tweet: TweetV2
  ): Promise<void> {
    logger.info(`📱 Processing tweet interactions for agent ${agentId}`);
    // Get new interactions from Twitter
    const newInteractions = await this.twitter.fetchTweetInteractions(tweet.id);
    // Process each interaction
    const scores = await Promise.all(
      newInteractions.map(async (interaction) => {
        // Generate deterministic UUID for interaction based on its content
        const interactionId = stringToUuid(
          `${tweet.id}-${interaction.userId}-${interaction.timestamp}`
        );
        // Check cache first
        const cached = await this.cache.getCachedInteraction(interactionId);
        if (cached) return cached;

        // Upsert interaction in DB with generated UUID
        // await this.prisma.interaction.upsert({
        //   where: { id: interactionId },
        //   update: {
        //     userMetrics: {
        //       toJSON: () => interaction.userMetrics,
        //     },
        //   },
        //   create: {
        //     id: interactionId,
        //     tweetId: tweet.id,
        //     userId: interaction.userId,
        //     type: interaction.type,
        //     content: interaction.content,
        //     timestamp: new Date(interaction.timestamp),
        //     userMetrics: interaction.userMetrics,
        //     // engagementScore: interaction.userMetrics.engagementRate,
        //     // lastUpdated: new Date(),
        //     tweet: { connect: { id: tweet.id } },
        //   },
        // });

        // Calculate new score
        const score = await this.calculator.calculateScore(interaction);

        await this.cache.cacheInteraction({
          id: interactionId,
          score,
        });

        return score;
      })
    );
    // Process scores through decision engine
    await this.engine.processInfluenceScores(agentId, scores);
    logger.info(`✅ Processed ${scores.length} interactions`);
  }

  private async cleanup(): Promise<void> {
    logger.info("🧹 Starting cleanup process");
    // Clean up old data
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    await Promise.all([
      prisma.tweet.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      prisma.interaction.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      this.cache.invalidateCache("interaction:*"),
    ]);

    logger.info("✨ Cleanup completed successfully");
  }
}
