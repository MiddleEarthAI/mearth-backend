import type { AgentAccount, Alliance, GameAccount } from "@/types/program";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import {
  Account,
  AccountInfo,
  PublicKey,
  type Connection,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";

/**
 * Service for fetching game state
 */
export class GameStateService {
  constructor(
    private readonly program: Program<MiddleEarthAiProgram>,
    private readonly connection: Connection
  ) {}

  /**
   * Get game state
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
  async getAlliance(agentId: number, gameId: number): Promise<Alliance | null> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      const gameAccount = await this.program.account.game.fetch(gamePDA);
      const agentAccount = await this.program.account.agent.fetch(agentPDA);

      const alliance = agentAccount.allianceWith;

      if (!alliance) {
        return null;
      }

      const allianceAccount = await this.program.account.agent.fetch(alliance);

      return {
        agent1: agentAccount,
        agent2: allianceAccount,
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
}
