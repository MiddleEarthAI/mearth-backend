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
import { ActionContext, GameAction } from "@/types";
import {
  InitializationError,
  AgentError,
  RecoveryError,
  MearthError,
  ShutdownError,
} from "@/utils/error";
import { BN } from "@coral-xyz/anchor";
import { ActionManager } from "./ActionManager";
import { gameConfig } from "@/config/env";

/**
 * Service for managing AI agentData behavior and decision making
 * Handles game orchestration, agent updates, and event processing
 */
export class GameOrchestrator {
  private readonly updateInterval = process.env.UPDATE_INTERVAL
    ? parseInt(process.env.UPDATE_INTERVAL)
    : 3600000; // 1 hour

  private readonly agentProcessingDelay = 120000; // Default 2 minutes delay between agents

  private readonly cleanupInterval = gameConfig.cleanupInterval;
  private isRunning: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds

  constructor(
    private readonly currentGameOnchainId: BN,
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
    } catch (err) {
      const initError = new InitializationError(
        "Failed to initialize game orchestrator",
        {
          gameId: this.gameId,
          error: err instanceof Error ? err.message : String(err),
        }
      );
      await this.handleError(initError);
      throw initError;
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
        } catch (err) {
          retries++;
          if (retries >= this.maxRetries) {
            const processError = new AgentError(
              "Max retries exceeded in update loop",
              {
                retries,
                lastError: err instanceof Error ? err.message : String(err),
              }
            );
            await this.handleError(processError);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    };

    processWithRetry().catch((error) => {
      logger.error("Fatal error in update loop", {
        gameId: this.currentGameOnchainId,
        error: String(error),
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
        } catch (err) {
          retries++;
          if (retries >= this.maxRetries) {
            const cleanupError = new ShutdownError(
              "Max retries exceeded in cleanup loop",
              {
                retries,
                lastError: err instanceof Error ? err.message : String(err),
              }
            );
            await this.handleError(cleanupError);
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
    this.eventEmitter.on(
      "actionExecutionFailure",
      this.handleActionExecutionFailure.bind(this)
    );

    // Add handler for uncaught promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Promise Rejection", {
        gameId: this.currentGameOnchainId,
        reason: String(reason),
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

      const result = await this.actionManager.executeAction(
        data.actionContext,
        data.action
      );
      const cacheKey = `action:${data.actionContext.agentId}:${data.action.type}`;
      await this.cache.cacheAction(cacheKey, result);

      // // if action is successful, post a tweet
      // if (result.success && result.feedback?.isValid) {
      //   await this.twitter.postTweet(
      //     data.actionContext.agentOnchainId.toString() as AgentId,
      //     `${getTwitterUserNameByAgentId(
      //       data.actionContext.agentOnchainId.toString() as AgentId
      //     )} => ${data.action.tweet}`
      //   );
      // }

      // TODO: remove this after testing
      function getTwitterUserNameByAgentId(agentId: AgentId): string {
        switch (agentId) {
          case "1":
            return "PurrlockPawsAI";
          case "2":
            return "Scootles";
          case "3":
            return "Sir Gullihop";

          case "4":
            return "Wanderleaf";

          default:
            throw new Error("Invalid agent ID");
        }
      }

      // this.engine.handleActionResult(data.actionContext, result);

      logger.info("✅ Action successfully processed", {
        gameId: this.currentGameOnchainId,
        agentId: data.actionContext.agentId,
        actionType: data.action.type,
      });
    } catch (err) {
      const actionError = new AgentError("Failed to handle new action", {
        agentId: data.actionContext.agentId,
        actionType: data.action.type,
        error: err instanceof Error ? err.message : String(err),
      });
      await this.handleError(actionError);
    }
  }

  private async handleError(error: Error | MearthError): Promise<void> {
    const errorDetails = error instanceof MearthError ? error.details : {};

    // Log error with appropriate level based on severity
    if (error instanceof MearthError) {
      if (error.status >= 500) {
        logger.error("Critical error in orchestrator:", error.toJSON());
      } else {
        logger.warn("Non-critical error in orchestrator:", error.toJSON());
      }
    } else {
      logger.error("Unknown error in orchestrator:", {
        error: error.message,
        stack: error.stack,
      });
    }

    // Attempt recovery based on error type
    await this.attemptRecovery(error);

    // Check if we need to shutdown
    if (this.shouldShutdown(error)) {
      await this.shutdown();
    }
  }

  private async attemptRecovery(error: Error | MearthError): Promise<void> {
    try {
      if (error instanceof MearthError) {
        switch (error.code) {
          case "AGENT_ERROR":
            await this.engine.resetAgentState();
            break;
          case "TWITTER_ERROR":
            await this.twitter.reconnect();
            break;
          case "CACHE_ERROR":
            await this.cache.reset();
            break;
          default:
            // For unknown errors, log and continue
            logger.warn("No recovery strategy for error type:", error.code);
        }
      }

      logger.info("Recovery attempt completed for error:", {
        type: error instanceof MearthError ? error.code : "UNKNOWN_ERROR",
        message: error.message,
      });
    } catch (recoveryErr) {
      const recoveryError = new RecoveryError("Failed to recover from error", {
        originalError:
          error instanceof MearthError ? error.toJSON() : error.message,
        recoveryError:
          recoveryErr instanceof Error
            ? recoveryErr.message
            : String(recoveryErr),
      });
      logger.error("Recovery failed:", recoveryError.toJSON());
      throw recoveryError;
    }
  }

  private shouldShutdown(error: Error | MearthError): boolean {
    if (error instanceof MearthError) {
      return [
        "INITIALIZATION_ERROR",
        "RECOVERY_ERROR",
        "SHUTDOWN_ERROR",
      ].includes(error.code);
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
    });

    // Process agents sequentially with delay
    for (const agent of agents) {
      await this.processAgent({
        agentId: agent.id,
        agentOnchainId: agent.onchainId,
        gameId: agent.game.id,
        gameOnchainId: new BN(agent.game.onchainId),
      });

      // Add delay between processing agents
      if (agents.indexOf(agent) < agents.length - 1) {
        logger.info(
          `⏳ Waiting ${this.agentProcessingDelay}ms before processing next agent`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.agentProcessingDelay)
        );
      }
    }

    logger.info(`✅ Processed ${agents.length} agents sequentially`);
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

  private async handleActionExecutionFailure(error: Error): Promise<void> {
    logger.error("Action execution failed", { error });
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
