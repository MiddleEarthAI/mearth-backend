import { logger } from "@/utils/logger";

import { prisma } from "@/config/prisma";
import { PrismaClient } from "@prisma/client";

import TwitterManager, { AgentId } from "@/agent/TwitterManager";
import { DecisionEngine } from "@/agent/DecisionEngine";
import CacheManager from "@/agent/CacheManager";
import { InfluenceCalculator } from "@/agent/InfluenceCalculator";
import EventEmitter from "events";
import { BattleResolver } from "./BattleResolver";
import { stringToUuid } from "@/utils/uuid";
import { TweetV2 } from "twitter-api-v2";
import { ActionContext, ActionManager } from "./ActionManager";
import { GameAction } from "@/types";

// Error types for better error handling
enum OrchestratorErrorType {
  INITIALIZATION = "INITIALIZATION_ERROR",
  AGENT_PROCESSING = "AGENT_PROCESSING_ERROR",
  TWEET_PROCESSING = "TWEET_PROCESSING_ERROR",
  INTERACTION_PROCESSING = "INTERACTION_PROCESSING_ERROR",
  CLEANUP = "CLEANUP_ERROR",
  ACTION_EXECUTION = "ACTION_EXECUTION_ERROR",
  CACHE = "CACHE_ERROR",
  RECOVERY = "RECOVERY_ERROR",
}

class OrchestratorError extends Error {
  constructor(
    public type: OrchestratorErrorType,
    message: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "OrchestratorError";
  }
}

/**
 * Service for managing AI agentData behavior and decision making
 * Handles game orchestration, agent updates, and event processing
 */
export class GameOrchestrator {
  private readonly updateInterval = process.env.UPDATE_INTERVAL
    ? parseInt(process.env.UPDATE_INTERVAL)
    : 60 * 60 * 1000; // 1 min for testing
  private readonly cleanupInterval = 3600000; // 1 hour
  private isRunning: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds

  constructor(
    private readonly currentGameOnchainId: number,
    private readonly gameId: string,
    private readonly actionManager: ActionManager,
    private readonly twitter: TwitterManager,
    private readonly cache: CacheManager,
    private readonly calculator: InfluenceCalculator,
    private readonly engine: DecisionEngine,
    private readonly prisma: PrismaClient,
    private readonly eventEmitter: EventEmitter,
    private readonly battleResolver: BattleResolver
  ) {
    this.setupEventHandlers();
    this.setupErrorBoundary();
  }

  /**
   * Start the update loop and battle resolver with enhanced error handling
   */
  async start(): Promise<void> {
    try {
      logger.info("🎮 Game Orchestrator starting up...", {
        gameId: this.currentGameOnchainId,
        updateInterval: this.updateInterval,
        cleanupInterval: this.cleanupInterval,
      });

      this.isRunning = true;
      this.startCleanupLoop();
      this.startUpdateLoop();
      await this.battleResolver.start();

      logger.info("🚀 Game Orchestrator successfully started", {
        gameId: this.currentGameOnchainId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const orchestratorError = new OrchestratorError(
        OrchestratorErrorType.INITIALIZATION,
        "Failed to start Game Orchestrator",
        { error: error instanceof Error ? error.message : String(error) }
      );
      this.handleError(orchestratorError);
      throw orchestratorError;
    }
  }

  private async startUpdateLoop(): Promise<void> {
    logger.info("⏰ Starting update loop", {
      gameId: this.currentGameOnchainId,
    });

    const processWithRetry = async () => {
      let retries = 0;
      while (this.isRunning) {
        try {
          await this.processAllAgents();
          retries = 0; // Reset retries on success
          await new Promise((resolve) =>
            setTimeout(resolve, this.updateInterval)
          );
        } catch (error) {
          retries++;
          logger.error("Update loop iteration failed", {
            gameId: this.currentGameOnchainId,
            retryAttempt: retries,
            error: error instanceof Error ? error.message : String(error),
          });

          if (retries >= this.maxRetries) {
            const orchestratorError = new OrchestratorError(
              OrchestratorErrorType.AGENT_PROCESSING,
              "Max retries exceeded in update loop",
              { retries, lastError: error }
            );
            this.handleError(orchestratorError);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    };

    processWithRetry().catch((error) => {
      logger.error("Fatal error in update loop", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.isRunning = false;
      this.eventEmitter.emit("error", error);
    });
  }

  private async startCleanupLoop(): Promise<void> {
    logger.info("🧹 Starting cleanup loop", {
      gameId: this.currentGameOnchainId,
    });

    const cleanupWithRetry = async () => {
      let retries = 0;
      while (this.isRunning) {
        try {
          await this.cleanup();
          retries = 0; // Reset retries on success
          await new Promise((resolve) =>
            setTimeout(resolve, this.cleanupInterval)
          );
        } catch (error) {
          retries++;
          logger.error("Cleanup loop iteration failed", {
            gameId: this.currentGameOnchainId,
            retryAttempt: retries,
            error: error instanceof Error ? error.message : String(error),
          });

          if (retries >= this.maxRetries) {
            const orchestratorError = new OrchestratorError(
              OrchestratorErrorType.CLEANUP,
              "Max retries exceeded in cleanup loop",
              { retries, lastError: error }
            );
            this.handleError(orchestratorError);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    };

    cleanupWithRetry().catch((error) => {
      logger.error("Fatal error in cleanup loop", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.isRunning = false;
      this.eventEmitter.emit("error", error);
    });
  }

  private setupEventHandlers(): void {
    logger.info("🎯 Setting up event handlers", {
      gameId: this.currentGameOnchainId,
    });

    this.eventEmitter.on("newAction", this.handleNewAction.bind(this));
    this.eventEmitter.on("error", this.handleError.bind(this));

    // Add handler for uncaught promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Promise Rejection", {
        gameId: this.currentGameOnchainId,
        reason: reason instanceof Error ? reason.message : String(reason),
      });
    });
  }

  private setupErrorBoundary(): void {
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Attempt graceful shutdown
      this.shutdown().catch((shutdownError) => {
        logger.error("Failed to shutdown gracefully", {
          gameId: this.currentGameOnchainId,
          error:
            shutdownError instanceof Error
              ? shutdownError.message
              : String(shutdownError),
        });
        process.exit(1);
      });
    });
  }

  private async handleNewAction(data: {
    actionContext: ActionContext;
    action: GameAction;
  }): Promise<void> {
    try {
      logger.info("🎲 Processing new action", {
        gameId: this.currentGameOnchainId,
        agentId: data.actionContext.agentId,
        actionType: data.action.type,
      });

      await this.actionManager.executeAction(data.actionContext, data.action);

      logger.info("✅ Action successfully processed", {
        gameId: this.currentGameOnchainId,
        agentId: data.actionContext.agentId,
        actionType: data.action.type,
      });
    } catch (error) {
      const orchestratorError = new OrchestratorError(
        OrchestratorErrorType.ACTION_EXECUTION,
        "Failed to handle new action",
        {
          agentId: data.actionContext.agentId,
          actionType: data.action.type,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      this.handleError(orchestratorError);
    }
  }

  private async handleError(error: Error | OrchestratorError): Promise<void> {
    const errorDetails =
      error instanceof OrchestratorError
        ? { type: error.type, metadata: error.metadata }
        : { type: "UNKNOWN_ERROR" };

    logger.error("⚠️ System error occurred", {
      gameId: this.currentGameOnchainId,
      ...errorDetails,
      error: error.message,
      stack: error.stack,
    });

    await this.attemptRecovery(error);
  }

  private async attemptRecovery(
    error: Error | OrchestratorError
  ): Promise<void> {
    logger.info("🔄 Attempting system recovery...", {
      gameId: this.currentGameOnchainId,
    });

    try {
      // Invalidate cache as first recovery step
      await this.cache.invalidateCache("*");

      // If it's an orchestrator error, handle specific recovery logic
      if (error instanceof OrchestratorError) {
        switch (error.type) {
          case OrchestratorErrorType.AGENT_PROCESSING:
            await this.engine.resetAgentState();
            break;
          case OrchestratorErrorType.TWEET_PROCESSING:
            await this.twitter.reconnect();
            break;
          case OrchestratorErrorType.CACHE:
            await this.cache.reset();
            break;
        }
      }

      logger.info("✅ Recovery attempt completed successfully", {
        gameId: this.currentGameOnchainId,
        errorType:
          error instanceof OrchestratorError ? error.type : "UNKNOWN_ERROR",
      });
    } catch (recoveryError) {
      logger.error("❌ Recovery attempt failed", {
        gameId: this.currentGameOnchainId,
        error:
          recoveryError instanceof Error
            ? recoveryError.message
            : String(recoveryError),
        originalError: error.message,
      });

      // If recovery fails, we might need to shutdown
      if (this.shouldShutdown(error)) {
        await this.shutdown();
      }
    }
  }

  private shouldShutdown(error: Error | OrchestratorError): boolean {
    if (error instanceof OrchestratorError) {
      // explanation: we want to shutdown if the error is related to initialization or recovery
      return [
        OrchestratorErrorType.INITIALIZATION,
        OrchestratorErrorType.RECOVERY,
      ].includes(error.type);
    }
    return false;
  }

  private async shutdown(): Promise<void> {
    logger.info("🛑 Initiating graceful shutdown", {
      gameId: this.currentGameOnchainId,
    });

    this.isRunning = false;

    try {
      // Cleanup resources
      await Promise.all([
        this.cache.close(),
        this.twitter.disconnect(),
        this.prisma.$disconnect(),
      ]);

      logger.info("👋 Graceful shutdown completed", {
        gameId: this.currentGameOnchainId,
      });
    } catch (error) {
      logger.error("💥 Error during shutdown", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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

  private async processAgent(actionContext: ActionContext): Promise<void> {
    logger.info(`🤖 Processing agent ${actionContext.agentId}`);

    try {
      throw "testing ";

      const recentTweets = await this.twitter.fetchRecentTweets(
        actionContext.agentOnchainId.toString() as AgentId,
        5
      );
      for (const tweet of recentTweets) {
        await this.processTweetInteractions(actionContext, tweet);
      }
    } catch (error) {
      logger.error(
        "Error processing community interactions, continue anyway...",
        { agentId: actionContext.agentId, error }
      );
    }

    this.engine.proceedWithoutInteractions(actionContext);
  }

  private async processTweetInteractions(
    actionContext: ActionContext,
    tweet: TweetV2
  ): Promise<void> {
    logger.info(
      `📱 Processing tweet interactions for agent ${actionContext.agentId}`
    );
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
    await this.engine.processInfluenceScores(actionContext, scores);
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
