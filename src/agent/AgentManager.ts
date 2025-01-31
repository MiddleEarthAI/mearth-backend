import { logger } from "@/utils/logger";
import { getGameStateService } from "../services";
import type { GameStateService } from "../services/GameStateService";
import { Agent } from "./Agent";
import { GameAccount } from "@/types/program";
import { prisma } from "@/config/prisma";

/**
 * Service for managing multiple AI agents
 */
export class AgentManager {
  private static instance: AgentManager;
  private activeAgents: Map<number, Agent> = new Map();
  private gameStateService: GameStateService;

  private constructor() {
    this.gameStateService = getGameStateService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Initialize and start all agents for a game
   */
  public async initializeAndStartAgents(
    gameAccount: GameAccount
  ): Promise<void> {
    try {
      logger.info("🚀 Starting agent initialization...", {
        gameId: gameAccount.gameId.toString(),
        totalAgents: gameAccount.agents.length,
      });

      // Get all registered agents from database
      const game = await prisma.game.findUnique({
        where: { gameId: gameAccount.gameId.toNumber() },
        select: { agents: { include: { state: true } } },
      });
      logger.info("🔍 Found game", { game });
      if (!game?.agents) {
        throw new Error(
          "No agents found in database. Please run setup sync first."
        );
      }

      // Start each alive agent
      for (const dbAgent of game.agents) {
        if (!dbAgent.state?.isAlive) {
          logger.info(`⚰️ Skipping dead agent ${dbAgent.agentId}`);
          continue;
        }

        try {
          const agent = new Agent(
            gameAccount.gameId.toNumber(),
            dbAgent.agentId,
            this.gameStateService
          );

          await agent.start();
          this.activeAgents.set(dbAgent.agentId, agent);

          logger.info(`✅ Started agent ${dbAgent.agentId}`, {
            name: dbAgent.name,
            status: "active",
          });
        } catch (error) {
          logger.error(`Failed to start agent ${dbAgent.agentId}:`, error);
        }
      }

      const activeCount = this.activeAgents.size;
      logger.info(`✨ Agent initialization complete`, {
        total: game.agents.length,
        active: activeCount,
        inactive: game.agents.length - activeCount,
      });
    } catch (error) {
      logger.error("❌ Failed to initialize agents:", error);
      throw error;
    }
  }

  /**
   * Start a single agent
   */
  public async startAgent(gameId: number, agentId: number): Promise<void> {
    if (this.activeAgents.has(agentId)) {
      logger.warn(`Agent ${agentId} is already active`);
      return;
    }

    const dbAgent = await prisma.agent.findFirst({
      where: {
        gameId: gameId.toString(),
        agentId,
      },
      include: { state: true },
    });

    if (!dbAgent) {
      throw new Error(`Agent ${agentId} not found in database`);
    }

    if (!dbAgent.state?.isAlive) {
      logger.warn(`Agent ${agentId} is not alive, skipping`);
      return;
    }

    const agent = new Agent(gameId, agentId, this.gameStateService);
    await agent.start();
    this.activeAgents.set(agentId, agent);

    logger.info(`✅ Started agent ${agentId}`, {
      name: dbAgent.name,
      status: "active",
    });
  }

  /**
   * Stop a single agent
   */
  public async stopAgent(agentId: number): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      logger.warn(`Agent ${agentId} is not active`);
      return;
    }

    agent.stop();
    this.activeAgents.delete(agentId);
    logger.info(`🛑 Stopped agent ${agentId}`);
  }

  /**
   * Stop all agents and cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info("🛑 Shutting down all agents...");

    for (const [agentId, agent] of this.activeAgents) {
      try {
        agent.stop();
        logger.info(`Stopped agent ${agentId}`);
      } catch (error) {
        logger.error(`Failed to stop agent ${agentId}:`, error);
      }
    }

    this.activeAgents.clear();
    logger.info("✅ All agents stopped");
  }

  /**
   * Get an active agent instance
   */
  public getAgent(agentId: number): Agent | undefined {
    return this.activeAgents.get(agentId);
  }

  /**
   * Get summary of active agents
   */
  public getActiveAgents(): {
    count: number;
    agents: { id: number; status: string }[];
  } {
    const agents = Array.from(this.activeAgents.keys()).map((id) => ({
      id,
      status: "active",
    }));

    return {
      count: agents.length,
      agents,
    };
  }
}
