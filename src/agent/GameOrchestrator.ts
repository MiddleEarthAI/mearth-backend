import { prisma } from "@/config/prisma";
import { PrismaClient } from "@prisma/client";

import TwitterManager, { AgentId } from "@/agent/TwitterManager";
import { DecisionEngine } from "@/agent/DecisionEngine";
import CacheManager from "@/agent/CacheManager";
import EventEmitter from "events";
import { ActionContext, GameAction } from "@/types";
import {
  InitializationError,
  AgentError,
  RecoveryError,
  MearthError,
  ShutdownError,
} from "@/utils/error";
import { BN } from "@coral-xyz/anchor";
import { ActionManager } from "./actionManager";
import { gameConfig } from "@/config/env";
import { TwitterInteraction } from "@/types/twitter";
import { twitterInteractions } from "@/tests/data/twitter-interactions";

/**
 * Service for managing AI agentData behavior and decision making
 * Handles game orchestration, agent updates, and event processing
 */
export class GameOrchestrator {
  private readonly actionInterval = gameConfig.actionInterval * 1000; // milliseconds

  private readonly agentInitGapDelay = gameConfig.agentInitGapDelay * 1000; // Default 15 minutes delay between agents entrance into the game
  private readonly cleanupInterval = gameConfig.cleanupInterval * 1000; // milliseconds
  private isRunning: boolean = false;
  private readonly maxRetries: number = gameConfig.maxRetries;
  private readonly retryDelay: number = 5000; // 5 seconds

  constructor(
    private readonly currentGameOnchainId: BN,
    private readonly gameId: string,
    private readonly actionManager: ActionManager,
    private readonly twitter: TwitterManager,
    private readonly cache: CacheManager,
    private readonly engine: DecisionEngine,
    private readonly prisma: PrismaClient,
    private readonly eventEmitter: EventEmitter
  ) {
    this.setupEventHandlers();
    this.setupErrorBoundary();
    console.log("🎮 Game Orchestrator initialized", {
      gameId: this.gameId,
      onchainId: this.currentGameOnchainId,
    });
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

      // if action is successful and tweet is defined, post a tweet
      if (result.success && data.action.tweet) {
        const tweet = await this.twitter.postTweet(
          data.actionContext.agentOnchainId.toString() as AgentId,
          `${getTwitterUserNameByAgentId(
            data.actionContext.agentOnchainId.toString() as AgentId
          )} => ${data.action.tweet}`
        );
        if (tweet?.data?.id) {
          const tweetRecord = await this.prisma.tweet.create({
            data: {
              id: tweet.data.id,
              conversationId: tweet.data.id,
              agentId: data.actionContext.agentId,
              content: data.action.tweet,
              type: data.action.type,
              timestamp: new Date(),
            },
            include: {
              agent: {
                select: {
                  profile: {
                    select: {
                      name: true,
                      xHandle: true,
                    },
                  },
                },
              },
            },
          });
          await this.prisma.gameEvent.create({
            data: {
              gameId: data.actionContext.gameId,
              eventType: "TWEET",
              initiatorId: data.actionContext.agentId,
              message: `${tweetRecord.agent.profile.xHandle} posted https://x.com/${tweetRecord.agent.profile.xHandle}/status/${tweet.data.id}`,
              metadata: {
                toJSON: () => ({
                  tweetId: tweet.data.id,
                  actionType: data.action.type,
                  timestamp: new Date().toISOString(),
                  content: data.action.tweet,
                }),
              },
            },
          });
        }
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
            // await this.engine.resetAgentState();
            break;
          case "TWITTER_ERROR":
            await this.twitter.reconnect();
            break;
          case "CACHE_ERROR":
            // await this.cache.reset();
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
          // onchainId: this.currentGameOnchainId.toNumber(),
        },
        isAlive: true,
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
      try {
        const agentTweet = await prisma.tweet.findFirst({
          where: {
            agentId: agent.id,
          },
          orderBy: {
            timestamp: "desc",
          },
        });
        twitterInteractions.interactions;

        let interactions: TwitterInteraction[] = [];
        if (agentTweet?.conversationId) {
          // Check for new interactions
          interactions = await this.twitter.fetchTweetInteractions(
            agentTweet.conversationId
          );
        }
        // Decide next action based on processed interactions
        await this.engine.decideNextAction(
          {
            agentId: agent.id,
            agentOnchainId: agent.onchainId,
            gameId: agent.game.id,
            gameOnchainId: agent.game.onchainId,
          },
          interactions
        );
      } catch (error) {
        console.error("Error processing agent interactions", {
          agentId: agent.id,
          error,
        });
      }

      // Add delay between processing agents
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
      prisma.gameLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      prisma.gameEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),
      this.cache.invalidateCache("interaction:*"),
    ]);

    console.info("✨ Cleanup completed successfully");
  }
}
