import { logger } from "@/utils/logger";
import { getGameStateService } from "../services";
import type { GameStateService } from "../services/GameStateService";
import { Agent } from "./Agent";
import { GameAccount } from "@/types/program";
import { prisma } from "@/config/prisma";

interface AgentStatus {
  id: number;
  status: "active" | "inactive" | "error";
  lastAction?: string;
  error?: string;
}

/**
 * Service for managing multiple AI agents
 * Handles initialization, monitoring, and cleanup of agents
 */
export class AgentManager {
  private static instance: AgentManager;
  private activeAgents: Map<number, Agent> = new Map();
  private agentStatuses: Map<number, AgentStatus> = new Map();
  private gameStateService: GameStateService;
  private isInitialized = false;

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
   * @param gameAccount The game account to initialize agents for
   */
  public async initializeAndStartAgents(
    gameAccount: GameAccount
  ): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.warn("AgentManager is already initialized");
        return;
      }

      logger.info("🚀 Initializing AgentManager...", {
        gameId: gameAccount.gameId.toString(),
        totalAgents: gameAccount.agents.length,
      });

      // Fetch all agent accounts in parallel
      const agentAccounts = await Promise.all(
        gameAccount.agents.map(async (agent) => {
          try {
            return await this.gameStateService.getAgentByPublicKey(agent.key);
          } catch (error) {
            logger.error(`Failed to fetch agent for key ${agent.key}:`, error);
            return null;
          }
        })
      );

      // Filter out null results and dead agents
      const validAgents = agentAccounts.filter(
        (agent): agent is NonNullable<typeof agent> =>
          agent !== null && agent.isAlive
      );

      logger.info("📊 Agent Status Summary", {
        total: gameAccount.agents.length,
        alive: validAgents.length,
        dead: gameAccount.agents.length - validAgents.length,
      });

      // Start each valid agent
      await Promise.all(
        validAgents.map(async (agent) => {
          try {
            await this.startAgent(gameAccount.gameId.toNumber(), agent.id);
            this.updateAgentStatus(agent.id, {
              status: "active",
              lastAction: "initialization",
            });
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            logger.error(`Failed to start agent ${agent.id}:`, error);
            this.updateAgentStatus(agent.id, {
              status: "error",
              error: errorMsg,
            });
          }
        })
      );

      this.isInitialized = true;
      logger.info("✅ AgentManager initialized successfully", {
        activeAgents: this.getActiveAgentsSummary(),
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Failed to initialize AgentManager:", error);
      throw new Error(`AgentManager initialization failed: ${errorMsg}`);
    }
  }

  /**
   * Start a new agent or restart an existing one
   */
  private async startAgent(gameId: number, agentId: number): Promise<void> {
    // Check if agent is already active
    if (this.activeAgents.has(agentId)) {
      logger.warn(`Agent ${agentId} is already active, skipping start`);
      return;
    }

    // Verify agent exists and is alive
    const agent = await this.gameStateService.getAgent(gameId, agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in game ${gameId}`);
    }

    if (!agent.isAlive) {
      logger.warn(`Agent ${agentId} is not alive, skipping start`);
      this.updateAgentStatus(agentId, {
        status: "inactive",
        lastAction: "skipped - agent dead",
      });
      return;
    }

    try {
      // Create and start new agent instance
      const activeAgent = new Agent(gameId, agentId, this.gameStateService);
      await activeAgent.start();

      this.activeAgents.set(agentId, activeAgent);
      this.updateAgentStatus(agentId, {
        status: "active",
        lastAction: "started",
      });

      logger.info(`✅ Started agent ${agentId}`, {
        gameId,
        position: { x: agent.x, y: agent.y },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to start agent ${agentId}:`, error);
      this.updateAgentStatus(agentId, {
        status: "error",
        error: errorMsg,
      });
      throw error;
    }
  }

  /**
   * Create and start a new agent
   */
  public async createAndStart(gameId: number, agentId: number): Promise<void> {
    try {
      await this.startAgent(gameId, agentId);
    } catch (error) {
      logger.error(`Failed to create and start agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Stop an agent
   */
  public async stopAgent(agentId: number): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      logger.warn(`Agent ${agentId} is not active, cannot stop`);
      return;
    }

    try {
      agent.stop();
      this.activeAgents.delete(agentId);
      this.updateAgentStatus(agentId, {
        status: "inactive",
        lastAction: "stopped",
      });
      logger.info(`Stopped agent ${agentId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to stop agent ${agentId}:`, error);
      this.updateAgentStatus(agentId, {
        status: "error",
        error: errorMsg,
      });
      throw error;
    }
  }

  /**
   * Stop all agents and cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info("🛑 Shutting down AgentManager...");

    try {
      const stopPromises = Array.from(this.activeAgents.keys()).map((agentId) =>
        this.stopAgent(agentId)
      );

      await Promise.all(stopPromises);
      this.activeAgents.clear();
      this.agentStatuses.clear();
      this.isInitialized = false;

      logger.info("✅ AgentManager shutdown complete");
    } catch (error) {
      logger.error("❌ Error during AgentManager shutdown:", error);
      throw error;
    }
  }

  /**
   * Get a specific agent instance
   */
  public async getAgent(agentId: number): Promise<Agent> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found or not active`);
    }
    return agent;
  }

  /**
   * Update agent status
   */
  private updateAgentStatus(
    agentId: number,
    status: Partial<AgentStatus>
  ): void {
    const currentStatus = this.agentStatuses.get(agentId) || {
      id: agentId,
      status: "inactive",
    };
    this.agentStatuses.set(agentId, { ...currentStatus, ...status });
  }

  /**
   * Get detailed status of all agents
   */
  private getActiveAgentsSummary(): {
    total: number;
    active: number;
    inactive: number;
    error: number;
    agents: AgentStatus[];
  } {
    const statuses = Array.from(this.agentStatuses.values());
    return {
      total: statuses.length,
      active: statuses.filter((a) => a.status === "active").length,
      inactive: statuses.filter((a) => a.status === "inactive").length,
      error: statuses.filter((a) => a.status === "error").length,
      agents: statuses,
    };
  }

  /**
   * Get all active agents (legacy method for compatibility)
   */
  public getActiveAgents(): {
    count: number;
    agents: { id: number; status: string }[];
  } {
    const summary = this.getActiveAgentsSummary();
    return {
      count: summary.active,
      agents: summary.agents
        .filter((a) => a.status === "active")
        .map(({ id, status }) => ({ id, status: status })),
    };
  }
}
