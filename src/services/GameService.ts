import { BN, Program } from "@coral-xyz/anchor";
import { type Connection, PublicKey, SystemProgram } from "@solana/web3.js";

import type { MearthProgram } from "@/types";
import {
  type AgentAccount,
  type GameAccount,
  TerrainType,
} from "@/types/program";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";

type InitializeGameResult = {
  tx: string;
  gameAccount: GameAccount;
};

type RegisterAgentResult = { tx: string; agentAccount: AgentAccount };

/**
 * Service for interacting with the Middle Earth program
 * Handles game initialization, agent management, battles and alliances
 */
export class GameService {
  constructor(
    private readonly program: Program<MiddleEarthAiProgram>,
    private readonly connection: Connection
  ) {
    logger.info("🎮 GameService initialized and ready for action!");
  }

  /**
   * Initialize a new game instance if it doesn't already exist
   * @param gameId Unique identifier for the game
   * @throws Error if game already exists
   */
  async initializeGame(gameId: number): Promise<InitializeGameResult> {
    logger.info(`🌟 Checking for existing game - Game ID: ${gameId}`);

    try {
      const [gamePda, bump] = getGamePDA(this.program.programId, gameId);

      logger.info(`🎮 Game PDA in initializeGame: ${gamePda}`);

      // Check if game already exists
      try {
        const existingGame = await this.program.account.game.fetch(gamePda);

        logger.warn(`⚠️ Game ${gameId} ${existingGame.gameId} already exists`);
        throw new Error("Game with id " + gameId + " already initialized");
      } catch (e) {
        // Game doesn't exist, continue with initialization
        logger.info(
          `🆕 Game ${gameId} not found, proceeding with initialization`
        );
      }

      const tx = await this.program.methods
        .initializeGame(gameId, bump)
        .accounts({})
        .rpc();

      const gameAccount = await this.program.account.game.fetch(gamePda);
      logger.info(
        `✨ Game ${gameId} initialized successfully - Let the adventure begin!`
      );

      return {
        tx,
        gameAccount,
      };
    } catch (error) {
      logger.error(`❌ Game initialization failed for ID ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Register a new agent in the game
   * @param gameId Game identifier
   * @param agentId Unique agent identifier
   * @param x Initial x coordinate
   * @param y Initial y coordinate
   * @param name Agent name
   */
  async registerAgent(
    gameId: number,
    agentId: number,
    x: number,
    y: number,
    name: string
  ): Promise<RegisterAgentResult> {
    logger.info(
      `🦸 New hero ${name} (ID: ${agentId}) joining at position (${x},${y})`
    );

    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);

      logger.info(`🎮 Game PDA: ${gamePDA}`);

      const gameAccount = await this.program.account.game.fetch(gamePDA);

      logger.info(`🎮 Game ${gameId} found, checking agent count`);
      logger.info(`gameAccount: ${gameAccount}`);

      if (gameAccount.agents.length >= 4) {
        logger.warn(
          `🚫 Registration failed - Game ${gameId} is at maximum capacity`
        );
        throw new Error("Game is full");
      }

      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      const tx = await this.program.methods
        .registerAgent(agentId, new BN(x), new BN(y), name)
        .accountsStrict({
          game: gamePDA,
          agent: agentPDA,
          authority: this.program.provider?.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const agentAccount = await this.program.account.agent.fetch(agentPDA);
      logger.info(`✅ Agent ${name} has joined the adventure!`);

      return {
        tx,
        agentAccount,
      };
    } catch (error) {
      logger.error(`❌ Agent registration failed for ID ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Move an agent to a new position
   * @param gameId Game identifier
   * @param agentId Agent identifier
   * @param newX New x coordinate
   * @param newY New y coordinate
   * @param terrain Terrain type at new position
   */
  async moveAgent(
    gameId: number,
    agentId: number,
    newX: number,
    newY: number,
    terrain: TerrainType
  ): Promise<string> {
    logger.info(`🚶 Agent ${agentId} traveling to (${newX},${newY})`);

    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);
      const terrainTypeKey =
        terrain === TerrainType.Rivers
          ? "river"
          : terrain === TerrainType.Mountains
          ? "mountain"
          : "plains";

      const tx = await this.program.methods
        .moveAgent(new BN(newX), new BN(newY), {
          [terrainTypeKey]: terrain,
        })
        .accounts({
          agent: agentPDA,
        })
        .rpc();

      logger.info(`🎯 Agent ${agentId} reached destination (${newX}, ${newY})`);
      return tx;
    } catch (error) {
      logger.error(`❌ Movement failed for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a battle between two agents
   * @param winnerId Winning agent's ID
   * @param loserId Losing agent's ID
   * @param percentLoss Percentage of tokens lost
   */
  async resolveBattle(
    winnerId: number,
    loserId: number,
    percentLoss: number
  ): Promise<string> {
    logger.info(`⚔️ Epic battle: Agent ${winnerId} vs Agent ${loserId}`);

    try {
      const [winnerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(winnerId)],
        this.program.programId
      );

      const [loserPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(loserId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .resolveBattleSimple(percentLoss)
        .accounts({
          winner: winnerPDA,
          loser: loserPDA,
          loserToken: loserPDA,
          winnerToken: winnerPDA,
        })
        .rpc();

      logger.info(
        `🏆 Victory! Agent ${winnerId} triumphed over Agent ${loserId} (${percentLoss}% resources lost)`
      );
      return tx;
    } catch (error) {
      logger.error(
        `💥 Battle resolution failed between agents ${winnerId} and ${loserId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Form an alliance between two agents
   * @param leaderId Leader agent's ID
   * @param partnerId Partner agent's ID
   */
  async formAlliance(leaderId: number, partnerId: number): Promise<string> {
    logger.info(
      `🤝 Forming alliance between agents ${leaderId} and ${partnerId}`
    );

    try {
      const [leaderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(leaderId)],
        this.program.programId
      );

      const [partnerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(partnerId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          initiator: leaderPDA,
          targetAgent: partnerPDA,
        })
        .rpc();

      logger.info(
        `✨ A new alliance is born between ${leaderId} and ${partnerId}!`
      );
      return tx;
    } catch (error) {
      logger.error(
        `💔 Alliance formation failed between ${leaderId} and ${partnerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Break an alliance between two agents
   * @param leaderId Leader agent's ID
   * @param partnerId Partner agent's ID
   */
  async breakAlliance(leaderId: number, partnerId: number): Promise<string> {
    logger.info(
      `💔 Breaking alliance between agents ${leaderId} and ${partnerId}`
    );

    try {
      const [leaderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(leaderId)],
        this.program.programId
      );

      const [partnerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(partnerId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: leaderPDA,
          targetAgent: partnerPDA,
        })
        .rpc();

      logger.info(`🔚 Alliance between ${leaderId} and ${partnerId} has ended`);
      return tx;
    } catch (error) {
      logger.error(
        `❌ Alliance break failed between ${leaderId} and ${partnerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Stake tokens for an agent
   * @param agentId Agent identifier
   * @param amount Amount of tokens to stake
   */
  async stakeTokens(agentId: number, amount: number): Promise<string> {
    logger.info(`💰 Staking ${amount} tokens for agent ${agentId}`);

    try {
      const [agentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(agentId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .stakeTokens(new BN(amount))
        .accounts({
          agent: agentPDA,
          agentVault: agentPDA,
          stakerSource: agentPDA,
        })
        .rpc();

      logger.info(
        `✅ Successfully staked ${amount} tokens for agent ${agentId}`
      );
      return tx;
    } catch (error) {
      logger.error(`❌ Token staking failed for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Initiate a battle between two agents
   * @param attackerId Attacking agent's ID
   * @param defenderId Defending agent's ID
   */
  async initiateBattle(
    attackerId: number,
    defenderId: number
  ): Promise<string> {
    logger.info(
      `⚔️ Battle begins: Agent ${attackerId} challenges Agent ${defenderId}`
    );

    try {
      const [attackerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(attackerId)],
        this.program.programId
      );

      const [defenderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(defenderId)],
        this.program.programId
      );

      const [gamePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("game")],
        this.program.programId
      );

      const tx = await this.program.methods
        .resolveBattleSimple(10)
        .accounts({
          winner: attackerPDA,
          loser: defenderPDA,
          winnerToken: attackerPDA,
          loserToken: defenderPDA,
          loserAuthority: defenderPDA,
          authority: attackerPDA,
        })
        .rpc();

      logger.info(
        `🏹 Battle commenced between ${attackerId} and ${defenderId}`
      );
      return tx;
    } catch (error) {
      logger.error(
        `💥 Battle initiation failed between ${attackerId} and ${defenderId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Ignore an agent to prevent interactions
   * @param agentId Agent identifier
   * @param targetAgentId Target agent to ignore
   */
  async ignoreAgent(agentId: number, targetAgentId: number): Promise<string> {
    logger.info(`🙈 Agent ${agentId} ignoring Agent ${targetAgentId}`);

    try {
      const [agentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(agentId)],
        this.program.programId
      );

      const [gamePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("game")],
        this.program.programId
      );

      const [agentAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_authority"), agentPDA.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .ignoreAgent(targetAgentId)
        .accounts({
          agent: agentPDA,
        })
        .rpc();

      logger.info(
        `🚫 Agent ${agentId} has blocked interactions with Agent ${targetAgentId}`
      );
      return tx;
    } catch (error) {
      logger.error(`❌ Ignore action failed for agent ${agentId}:`, error);
      throw error;
    }
  }
}
