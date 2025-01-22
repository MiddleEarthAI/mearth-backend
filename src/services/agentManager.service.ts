import { PrismaClient } from "@prisma/client";
import { LLMService } from "./llm.service";
import { GameService } from "./game.service";
import { TwitterService } from "./twitter.service";
import { SolanaService } from "./solana.service";
import { Agent, AgentDecision, GameState, Battle } from "../types/game";
import { EventEmitter } from "events";
import PQueue from "p-queue";
import NodeCache from "node-cache";
import { retryWithExponentialBackoff } from "../utils/retry";
import { logger } from "../utils/logger";

interface AgentDecisionEvent {
  agentId: string;
  decision: AgentDecision;
  timestamp: Date;
}

interface AgentErrorEvent {
  agentId: string;
  error: Error;
  timestamp: Date;
}

interface SystemMetrics {
  activeAgents: number;
  pendingDecisions: number;
  queuePending: number;
  cacheStats: NodeCache.Stats;
}

/**
 * Manages the lifecycle and coordination of autonomous agents
 */
export class AgentManagerService {
  private readonly prisma: PrismaClient;
  private readonly llmService: LLMService;
  private readonly gameService: GameService;
  private readonly twitterService: TwitterService;
  private readonly solanaService: SolanaService;
  private readonly eventEmitter: EventEmitter;
  private readonly decisionQueue: PQueue;
  private readonly stateCache: NodeCache;
  private isRunning: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService();
    this.gameService = new GameService();
    this.twitterService = new TwitterService();
    this.solanaService = new SolanaService();
    this.eventEmitter = new EventEmitter();
    this.decisionQueue = new PQueue({ concurrency: 3 }); // Process 3 agent decisions concurrently
    this.stateCache = new NodeCache({ stdTTL: 60 }); // Cache game state for 1 minute

    this.setupEventListeners();
  }

  /**
   * Start the autonomous agent system
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Agent manager is already running");
      return;
    }

    try {
      this.isRunning = true;
      logger.info("Starting agent manager...");

      // Initialize agents if needed
      await this.initializeAgents();

      // Subscribe to Solana program events
      this.solanaService.subscribeToEvents();

      // Start the main processing loop
      this.startProcessingLoop();

      // Start monitoring system
      this.startMonitoring();

      logger.info("Agent manager started successfully");
    } catch (error) {
      logger.error("Failed to start agent manager:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the autonomous agent system
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    await this.decisionQueue.onIdle();
    logger.info("Agent manager stopped");
  }

  /**
   * Initialize the agent system
   */
  private async initializeAgents(): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { isAlive: true },
    });

    if (agents.length === 0) {
      logger.info("No active agents found, initializing default agents...");
      await this.gameService.initializeDefaultAgents();
    }
  }

  /**
   * Start the main processing loop
   */
  private async startProcessingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const agents = await this.prisma.agent.findMany({
          where: { isAlive: true },
        });

        // Process each agent's decision in parallel with rate limiting
        await Promise.all(
          agents.map((agent: Agent) =>
            this.decisionQueue.add(() => this.processAgentDecision(agent))
          )
        );

        // Wait before next iteration
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
      } catch (error) {
        logger.error("Error in processing loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 30 * 1000)); // 30 seconds backoff
      }
    }
  }

  /**
   * Process an individual agent's decision
   */
  private async processAgentDecision(agent: Agent): Promise<void> {
    try {
      // Get cached or fresh game state
      const gameState = await this.getGameState(agent);

      // Get agent's next decision
      const decision = await retryWithExponentialBackoff(
        async () => await this.llmService.getNextMove(agent, gameState)
      );

      // Execute the decision
      await this.executeDecision(agent, decision);

      // Emit decision event for monitoring
      this.eventEmitter.emit("agentDecision", {
        agentId: agent.id,
        decision,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Error processing agent ${agent.id} decision:`, error);
      this.eventEmitter.emit("agentError", {
        agentId: agent.id,
        error,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Execute an agent's decision
   */
  private async executeDecision(
    agent: Agent,
    decision: AgentDecision
  ): Promise<void> {
    try {
      switch (decision.action) {
        case "MOVE":
          if (decision.position) {
            const terrain = this.gameService.determineTerrainType(
              decision.position
            );
            await this.gameService.moveAgent(
              agent.id,
              decision.position,
              terrain
            );
            await this.twitterService.announceMovement(agent, decision.reason);
          }
          break;

        case "BATTLE":
          if (decision.target) {
            const strategy = await this.llmService.getBattleStrategy(
              agent,
              decision.target,
              await this.getPreviousBattles(agent.id, decision.target.id)
            );

            if (strategy.shouldFight) {
              await this.gameService.processBattle(
                agent.id,
                decision.target.id
              );
              await this.twitterService.announceBattleOutcome(
                agent,
                decision.target,
                strategy.suggestedTokenBurn
              );
            }
          }
          break;

        case "ALLIANCE":
          if (decision.target) {
            await this.gameService.formAlliance(agent.id, decision.target.id);
            await this.twitterService.announceAlliance(
              agent,
              decision.target.twitterHandle
            );
          }
          break;

        case "WAIT":
          // No action needed
          break;
      }

      logger.info(`Agent ${agent.id} executed decision: ${decision.action}`);
    } catch (error) {
      logger.error(`Error executing decision for agent ${agent.id}:`, error);
      throw error;
    }
  }

  /**
   * Get cached or fresh game state
   */
  private async getGameState(agent: Agent): Promise<GameState> {
    const cacheKey = `gameState_${agent.id}`;
    const cachedState = this.stateCache.get<GameState>(cacheKey);

    if (cachedState) {
      return cachedState;
    }

    const gameState: GameState = {
      nearbyAgents: await this.gameService.findNearbyAgents(agent),
      recentBattles: await this.getPreviousBattles(agent.id),
      communityFeedback: {
        sentiment: 0,
        interactions: 0,
        lastUpdated: new Date(),
      },
      terrain: this.gameService.determineTerrainType(agent.position),
    };

    this.stateCache.set(cacheKey, gameState);
    return gameState;
  }

  /**
   * Get previous battles between agents
   */
  private async getPreviousBattles(
    agentId: string,
    opponentId?: string
  ): Promise<Battle[]> {
    const where = opponentId
      ? {
          OR: [
            { initiatorId: agentId, defenderId: opponentId },
            { initiatorId: opponentId, defenderId: agentId },
          ],
        }
      : {
          OR: [{ initiatorId: agentId }, { defenderId: agentId }],
        };

    return await this.prisma.battle.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 5,
    });
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    // Agent decision events
    this.eventEmitter.on("agentDecision", (event) => {
      logger.info("Agent decision:", event);
    });

    // Agent error events
    this.eventEmitter.on("agentError", (event) => {
      logger.error("Agent error:", event);
    });

    // Solana program events
    this.eventEmitter.on("battleProcessed", (event) => {
      logger.info("Battle processed on-chain:", event);
    });

    this.eventEmitter.on("allianceFormed", (event) => {
      logger.info("Alliance formed on-chain:", event);
    });

    this.eventEmitter.on("positionUpdated", (event) => {
      logger.info("Position updated on-chain:", event);
    });
  }

  /**
   * Start monitoring system metrics
   */
  private startMonitoring(): void {
    setInterval(
      async () => {
        try {
          const metrics: SystemMetrics = {
            activeAgents: await this.prisma.agent.count({
              where: { isAlive: true },
            }),
            pendingDecisions: this.decisionQueue.size,
            queuePending: this.decisionQueue.pending,
            cacheStats: this.stateCache.getStats(),
          };
          logger.info("System metrics:", metrics);
        } catch (error) {
          logger.error("Error collecting metrics:", error);
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }
}
