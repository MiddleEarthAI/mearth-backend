import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import type { AgentAccount, AllianceInfo, GameAccount } from "@/types/program";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import type { BN, Program } from "@coral-xyz/anchor";
import type { Connection, PublicKey } from "@solana/web3.js";

/**
 * Service for fetching game state
 */
export class GameStateService {
  constructor(
    private readonly program: Program<MiddleEarthAiProgram>,
    private readonly connection: Connection
  ) {}

  /**
   * returns game state
   */
  async getGameState(gameId: number): Promise<GameAccount | null> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);

      const gameAccount = await this.program.account.game.fetch(gamePDA);

      return gameAccount;
    } catch (error) {
      logger.error("Failed to fetch game state:", error);
      return null;
    }
  }

  /**
   * Get agent state
   */
  async getAgent(
    agentId: number,
    gameId: number
  ): Promise<AgentAccount | null> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      const agentAccount = await this.program.account.agent.fetch(agentPDA);
      return agentAccount;
    } catch (error) {
      logger.error("Failed to fetch agent:", error);
      return null;
    }
  }

  /**
   * Get alliance state
   */
  async getAllianceInfo(
    agentId: number,
    gameId: number
  ): Promise<AllianceInfo | null> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      // const gameAccount = await this.program.account.game.fetch(gamePDA);
      const agentAccount = await this.program.account.agent.fetch(agentPDA);

      const alliance = agentAccount.allianceWith;

      if (!alliance) {
        return null;
      }

      const allyAccount = await this.program.account.agent.fetch(alliance);

      let pastAllyAccount: AgentAccount | null = null;
      if (agentAccount.lastAllianceAgent) {
        pastAllyAccount = await this.program.account.agent.fetch(
          agentAccount.lastAllianceAgent
        );
      }

      return {
        agent: agentAccount,
        ally: allyAccount,
        pastAlly: pastAllyAccount,
        formedAt: agentAccount.allianceTimestamp,
        isActive: agentAccount.allianceWith === alliance,
      };
    } catch (error) {
      logger.error("Failed to fetch alliance:", error);
      return null;
    }
  }

  /**
   * Get agent state
   */
  async getAgentByPublicKey(
    publicKey: PublicKey
  ): Promise<AgentAccount | null> {
    try {
      const agentAccount = await this.program.account.agent.fetch(publicKey);
      return agentAccount;
    } catch (error) {
      logger.error("Failed to fetch agent:", error);
      return null;
    }
  }

  async getAllAliveAgents(gameId: number): Promise<AgentAccount[]> {
    const gameState = await this.getGameState(gameId);
    if (!gameState) throw new Error("Game state not found");
    if (!gameState.agents) return [];
    const agents = [];
    for (const agent of gameState.agents) {
      const agentAccount = await this.program.account.agent.fetch(agent.key);
      if (agentAccount.isAlive) {
        agents.push(agentAccount);
      }
    }
    return agents;
  }
}
