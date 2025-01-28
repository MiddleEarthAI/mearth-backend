import { logger } from "@/utils/logger";
import { Agent, type AgentConfig } from "../Agent";
import { getGameService, getGameStateService, getTokenService } from ".";
import { GameStateService } from "./GameStateService";

import { GameService } from "./GameService";
import { TokenService } from "./TokenService";
import { getAgentConfigById } from "@/utils";
import { GameAccount } from "@/types/program";

/**
 * Service for managing multiple AI agents
 * Handles initialization, monitoring, and cleanup of agents
 */
export class AgentManager {
  private static instance: AgentManager;
  private activeAgents: Map<number, Agent> = new Map();
  private gameStateService: GameStateService;
  private gameService: GameService;
  private tokenService: TokenService;

  private constructor() {
    this.gameStateService = getGameStateService();
    this.gameService = getGameService();
    this.tokenService = getTokenService();
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
  public async initialize(gameId: number): Promise<void> {
    try {
      logger.info("Initializing AgentManager...");

      // Get game state from blockchain
      const gameAccount = await this.gameStateService.getGameState(gameId);
      logger.info(JSON.stringify(gameAccount, null, 2));

      if (!gameAccount) {
        throw new Error("Game account not found");
      }

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
        `Found ${gameAccount.agents.length} agents in game ${gameId}`
      );

      // Start each agent
      for (const agent of agents) {
        const configPrefix = agent?.id;

        const config = getAgentConfigById(configPrefix);

        if (agent?.id) {
          await this.startAgent(gameId, agent.id, config);
          logger.info(
            `Started agent ${agent.id} at position (${agent.x}, ${agent.y})`
          );
        } else {
          logger.warn(`Agent ${agent?.id} is not alive, skipping`);
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
  public async startAgent(
    gameId: number,
    agentId: number,
    config: AgentConfig
  ): Promise<void> {
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

    const agentService = new Agent(
      gameId,
      agentId,
      this.gameService,
      this.gameStateService,
      this.tokenService,
      config
    );

    await agentService.start();
    this.activeAgents.set(agentId, agentService);
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
