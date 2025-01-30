import { logger } from "@/utils/logger";
import { getGameStateService } from "../services";
import type { GameStateService } from "../services/GameStateService";
import { Agent } from "./Agent";
import { GameAccount } from "@/types/program";

/**
 * Service for managing multiple AI agents
 * Handles initialization, monitoring, and cleanup of agents
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
   * Initialize the agent manager and start all registered agents
   */
  public async initializeAndStartAgents(
    gameAccount: GameAccount
  ): Promise<void> {
    try {
      logger.info("Initializing AgentManager...");

      logger.info(JSON.stringify(gameAccount, null, 2));

      const agents = await Promise.all(
        gameAccount.agents.map(async (agent) => {
          const agentAccount = await this.gameStateService.getAgentByPublicKey(
            agent.key
          );
          return agentAccount;
        })
      );

      // Log number of agents found
      logger.info(
        `Found ${gameAccount.agents.length} agents in game ${gameAccount.gameId}`
      );

      const aliveAgents = agents.filter((agent) => agent?.isAlive);

      // Start each agent
      for (const agent of aliveAgents) {
        if (agent?.id) {
          await this.createAndStart(gameAccount.gameId.toNumber(), agent.id);
          logger.info(
            `Started agent ${agent.id} at position (${agent.x}, ${agent.y})`
          );
        }
      }
      logger.info("AgentManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize AgentManager:", error);
      throw error;
    }
  }

  /**
   * Start a new agent
   */
  public async createAndStart(gameId: number, agentId: number): Promise<void> {
    if (this.activeAgents.has(agentId)) {
      logger.warn(`Agent ${agentId} is already active`);
      return;
    }

    const agent = await this.gameStateService.getAgent(agentId, gameId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.isAlive) {
      logger.warn(`Agent ${agentId} is not alive, skipping`);
      return;
    }

    const activeAgent = new Agent(gameId, agentId, this.gameStateService);

    await activeAgent.start();
    this.activeAgents.set(agentId, activeAgent);
  }

  /**
   * Stop an agent
   */
  public async stopAgent(agentId: number): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      logger.warn(`Agent ${agentId} is not active`);
      return;
    }

    agent.stop();
    this.activeAgents.delete(agentId);
    logger.info(`Stopped agent ${agentId}`);
  }

  /**
   * Stop all agents and cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info("Shutting down AgentManager...");

    const stopPromises = Array.from(this.activeAgents.keys()).map((agentId) =>
      this.stopAgent(agentId)
    );

    await Promise.all(stopPromises);
    this.activeAgents.clear();

    logger.info("AgentManager shutdown complete");
  }

  public async getAgent(agentId: number): Promise<Agent> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }

  /**
   * Get all active agents
   */
  public getActiveAgents(): {
    count: number;
    agents: { id: number; status: string }[];
  } {
    const agents = Array.from(this.activeAgents.entries()).map(([id]) => ({
      id,
      status: "active",
    }));

    return {
      count: agents.length,
      agents,
    };
  }
}
