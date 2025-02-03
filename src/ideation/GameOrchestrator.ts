import { PrismaClient } from "@prisma/client";
import { DecisionEngine } from "./DecisionEngine";
import { InfluenceCalculator } from "./InfluenceCalculator";
import { EventEmitter } from "stream";
import { logger } from "@/utils/logger";
import { prismaUUID } from "@/config/game-data";
import CacheManager from "./CacheManager";
import TwitterManager from "./TwitterManager";

// Main orchestrator
class GameOrchestrator {
  private readonly updateInterval = 60 * 60 * 1000; // 1 hour
  private readonly cleanupInterval = 3600000; // 1 hour

  constructor(
    private twitter: TwitterManager,
    private cache: CacheManager,
    private calculator: InfluenceCalculator,
    private engine: DecisionEngine,
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter
  ) {
    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    await this.setupDatabase();
    this.startUpdateLoop();
    this.startCleanupLoop();
    logger.info("Game orchestrator started");
  }

  private async setupDatabase(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info("Database connected");
    } catch (error) {
      logger.error("Failed to connect to database", { error });
      process.exit(1);
    }
  }

  private setupEventHandlers(): void {
    this.eventEmitter.on("newAction", this.handleNewAction.bind(this));
    this.eventEmitter.on("error", this.handleError.bind(this));
  }

  private async handleNewAction(data: {
    agentId: string;
    action: ActionSuggestion;
  }): Promise<void> {
    try {
      // Create and post new tweet
      const tweet = await this.prisma.tweet.create({
        data: {
          agentId: data.agentId,
          content: data.action.content,
          type: data.action.type,
          timestamp: new Date(),
          id: prismaUUID(),
        },
      });

      // Update agent state
      await this.updateAgentState(data.agentId, data.action);

      logger.info("New action processed", {
        agentId: data.agentId,
        actionType: data.action.type,
      });
    } catch (error) {
      logger.error("Failed to handle new action", { error, data });
      this.eventEmitter.emit("error", error);
    }
  }

  private async handleError(error: Error): Promise<void> {
    logger.error("System error occurred", { error });
    // Implement retry logic or failover mechanisms
    await this.attemptRecovery();
  }

  private async attemptRecovery(): Promise<void> {
    try {
      await this.cache.invalidateCache("*");
      await this.prisma.$disconnect();
      await this.setupDatabase();
      logger.info("Recovery attempt completed");
    } catch (error) {
      logger.error("Recovery attempt failed", { error });
      // Notify administrators or trigger manual intervention
    }
  }

  private async startUpdateLoop(): Promise<void> {
    setInterval(async () => {
      try {
        await this.processAllAgents();
      } catch (error) {
        logger.error("Update loop failed", { error });
        this.eventEmitter.emit("error", error);
      }
    }, this.updateInterval);
  }

  private async startCleanupLoop(): Promise<void> {
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        logger.error("Cleanup loop failed", { error });
        this.eventEmitter.emit("error", error);
      }
    }, this.cleanupInterval);
  }

  private async processAllAgents(): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { state: { isAlive: true } },
    });

    await Promise.all(agents.map((agent) => this.processAgent(agent.id)));
  }

  private async processAgent(agentId: string): Promise<void> {
    const recentTweets = await this.prisma.tweet.findMany({
      where: {
        agentId,
        timestamp: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
      include: { interactions: true },
    });

    for (const tweet of recentTweets) {
      await this.processTweetInteractions(tweet);
    }
  }

  private async processTweetInteractions(tweet: any): Promise<void> {
    // Get new interactions from Twitter
    const newInteractions = await this.twitter.getTweetInteractions(tweet.id);

    // Process each interaction
    const scores = await Promise.all(
      newInteractions.map(async (interaction) => {
        // Check cache first
        const cached = await this.cache.getCachedInteraction(interaction.id);
        if (cached) return cached;

        // Calculate new score
        const score = await this.calculator.calculateScore(interaction);
        await this.cache.cacheInteraction({
          id: interaction.id,
          score,
        });

        return score;
      })
    );

    // Process scores through decision engine
    await this.engine.processInfluenceScores(tweet.agentId, scores);
  }

  private async updateAgentState(
    agentId: string,
    action: ActionSuggestion
  ): Promise<void> {
    switch (action.type) {
      case "MOVE":
        if (action.position) {
          await this.prisma.agent.update({
            where: { id: agentId },
            data: {
              location: {
                update: {
                  x: action.position.x,
                  y: action.position.y,
                },
              },
            },
          });
        }
        break;

      case "BATTLE":
      case "ALLIANCE":
        if (action.target) {
          await this.createInteraction(agentId, action.target, action.type);
        }
        break;
    }
  }

  private async createInteraction(
    agentId: string,
    targetId: string,
    type: "BATTLE" | "ALLIANCE"
  ): Promise<void> {
    await this.prisma.interaction.create({
      data: {
        type,
        userId: agentId,
        targetId,
        status: "PENDING",
        timestamp: new Date(),
      },
    });
  }

  private async cleanup(): Promise<void> {
    // Clean up old data
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    await Promise.all([
      this.prisma.tweet.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      this.prisma.interaction.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      this.cache.invalidateCache("interaction:*"),
    ]);

    logger.info("Cleanup completed");
  }
}

export default GameOrchestrator;
