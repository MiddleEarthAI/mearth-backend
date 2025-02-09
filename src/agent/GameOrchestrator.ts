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
import { InfluenceScore } from "@/types/twitter";

/**
 * Service for managing AI agentData behavior and decision making
 * Handles game orchestration, agent updates, and event processing
 */
export class GameOrchestrator {
  private readonly actionInterval = gameConfig.actionInterval;

  private readonly agentInitGapDelay = 600000; // Default 15 minutes delay between agents

  private readonly cleanupInterval = gameConfig.cleanupInterval;
  private isRunning: boolean = false;
  private readonly maxRetries: number = gameConfig.maxRetries;
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
      console.info("🎮 Game Orchestrator starting up...", {
        gameId: this.currentGameOnchainId,
        actionInterval: this.actionInterval,
        cleanupInterval: this.cleanupInterval,
      });
      this.isRunning = true;
      this.startCleanupLoop();
      this.startAgentActions_mainLoop();

      await this.battleResolver.start();

      console.info("🚀 Game Orchestrator successfully started", {
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

  private async startAgentActions_mainLoop(): Promise<void> {
    console.info("⏰ Starting update loop", {
      gameId: this.currentGameOnchainId,
    });

    const processWithRetry = async () => {
      let retries = 0;
      while (this.isRunning) {
        try {
          await this.processAllAgents();
          retries = 0; // Reset retries on success
          await new Promise((resolve) =>
            setTimeout(resolve, this.actionInterval)
          );
        } catch (err) {
          retries++;
          if (retries >= this.maxRetries) {
            const processError = new AgentError(
              "Max retries exceeded in action loop",
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
      console.error("Fatal error in update loop", {
        gameId: this.currentGameOnchainId,
        error: String(error),
      });
      this.isRunning = false;
      this.eventEmitter.emit("error", error);
    });
  }

  private async startCleanupLoop(): Promise<void> {
    console.info("🧹 Starting cleanup loop", {
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
      console.error("Fatal error in cleanup loop", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.isRunning = false;
      this.eventEmitter.emit("error", error);
    });
  }

  private setupEventHandlers(): void {
    console.info("🎯 Setting up event handlers", {
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
      console.error("Unhandled Promise Rejection", {
        gameId: this.currentGameOnchainId,
        reason: String(reason),
      });
    });
  }

  private setupErrorBoundary(): void {
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Attempt graceful shutdown
      this.shutdown().catch((shutdownError) => {
        console.error("Failed to shutdown gracefully", {
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
      console.info("🎲 Processing new action", {
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

      // if action is successful, post a tweet
      if (result.success) {
        await this.twitter.postTweet(
          data.actionContext.agentOnchainId.toString() as AgentId,
          `${getTwitterUserNameByAgentId(
            data.actionContext.agentOnchainId.toString() as AgentId
          )} => ${data.action.tweet}`
        );
        console.info("✅ Action successfully processed", {
          gameId: this.currentGameOnchainId,
          agentId: data.actionContext.agentId,
          actionType: data.action.type,
        });
      }

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
        console.error("Critical error in orchestrator:", error.toJSON());
      } else {
        console.warn("Non-critical error in orchestrator:", error.toJSON());
      }
    } else {
      console.error("Unknown error in orchestrator:", {
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
            console.warn("No recovery strategy for error type:", error.code);
        }
      }

      console.info("Recovery attempt completed for error:", {
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
      console.error("Recovery failed:", recoveryError.toJSON());
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
    console.info("🛑 Initiating graceful shutdown", {
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

      console.info("👋 Graceful shutdown completed", {
        gameId: this.currentGameOnchainId,
      });
    } catch (error) {
      console.error("💥 Error during shutdown", {
        gameId: this.currentGameOnchainId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async processAllAgents(): Promise<void> {
    console.info("👥 Processing all active agents");
    const aliveAgents = await prisma.agent.findMany({
      where: {
        game: {
          isActive: true,
          onchainId: this.currentGameOnchainId.toNumber(),
        },
        health: { gt: 0 },
      },
      include: {
        game: {
          select: {
            id: true,
            onchainId: true,
          },
        },
      },
    });

    // Process aliveAgents sequentially with delay
    for (const agent of aliveAgents) {
      await this.processAgent({
        agentId: agent.id,
        agentOnchainId: agent.onchainId,
        gameId: agent.game.id,
        gameOnchainId: agent.game.onchainId,
      });

      // Add delay between processing aliveAgents
      if (aliveAgents.indexOf(agent) < aliveAgents.length - 1) {
        console.info(
          `⏳ Waiting ${this.agentInitGapDelay}ms before processing next agent`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.agentInitGapDelay)
        );
      }
    }

    console.info(`✅ Processed ${aliveAgents.length} agents sequentially`);
  }

  private async processAgent(actionContext: ActionContext): Promise<void> {
    console.info(`🤖 Processing agent ${actionContext.agentId}`);
    let scores: InfluenceScore[] = [];
    try {
      try {
        const agentTweetTweets = await this.twitter.fetchTweetsFromPastHour(
          actionContext.agentOnchainId.toString() as AgentId,
          5
        );
        console.log(agentTweetTweets);
        scores = await this.processTweetInteractions(
          actionContext,
          agentTweetTweets ? agentTweetTweets[0] : null
        );
        console.log(scores);
      } catch (error) {
        console.error("Error fetching tweets continuing...", {
          agentId: actionContext.agentId,
          error,
        });
      }

      await this.engine.decideNextAction(actionContext, scores);
    } catch (error) {
      console.error("Error processing community interactions", {
        agentId: actionContext.agentId,
        error,
      });
    }
  }

  private async processTweetInteractions(
    actionContext: ActionContext,
    tweet: TweetV2 | null
  ): Promise<InfluenceScore[]> {
    console.info(
      `📱 Processing tweet interactions for agent ${actionContext.agentId}`
    );
    if (!tweet) {
      console.error("No tweet found for agent in the past hour", {
        agentId: actionContext.agentId,
      });
      return [];
    }
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
    return scores;
  }

  private async handleActionExecutionFailure(error: Error): Promise<void> {
    console.error("Action execution failed", { error });
  }

  private async cleanup(): Promise<void> {
    console.info("🧹 Starting cleanup process");
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

    console.info("✨ Cleanup completed successfully");
  }
}
