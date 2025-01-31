import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { type AgentAccount, type GameAccount } from "@/types/program";
import { logger } from "@/utils/logger";
import { BN, type Program } from "@coral-xyz/anchor";
import { type Connection, PublicKey } from "@solana/web3.js";

import { prisma } from "@/config/prisma";
import { TerrainType } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

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
        logger.info(
          `🆕 Game ${gameId} not found, proceeding with initialization`
        );
      }

      const tx = await this.program.methods
        .initializeGame(new BN(gameId), bump)
        .accounts({})
        .rpc();

      const gameAccount = await this.program.account.game.fetch(gamePda);

      // Create game record in database
      await prisma.game.create({
        data: {
          gameId: gameId,
          authority: this.program.provider.publicKey?.toString() ?? "",
          bump: bump,
          tokenMint: gameAccount.tokenMint.toString(),
          rewardsVault: gameAccount.rewardsVault.toString(),
          mapDiameter: gameAccount.mapDiameter,
          dailyRewardTokens: gameAccount.dailyRewardTokens,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`✨ Game ${gameId} initialized successfully`);

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
    name: string,
    xHandle: string
  ): Promise<RegisterAgentResult> {
    logger.info(
      `🦸 New hero ${name} (ID: ${agentId}) joining at position (${x},${y})`
    );

    try {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const [agentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(agentId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .registerAgent(agentId, new BN(x), new BN(y), name)
        .accounts({
          game: gamePda,
          agent: agentPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      const agentAccount = await this.program.account.agent.fetch(agentPda);

      // Create agent record in database
      await prisma.agent.create({
        data: {
          agentId: agentId,
          name: name,
          publicKey: agentPda.toString(),
          gameId: gameId.toString(),
          location: {
            create: {
              x: x,
              y: y,
              terrainType: TerrainType.Plain,
            },
          },
          xHandle,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`✅ Agent ${name} registered successfully`);

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
    terrain: { [key: string]: any }
  ): Promise<string> {
    logger.info(`🚶 Agent ${agentId} traveling to (${newX},${newY})`);

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);

      const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

      const tx = await this.program.methods
        .moveAgent(new BN(newX), new BN(newY), terrain)
        .accounts({
          agent: agentPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Get current location before updating
      const currentAgent = await prisma.agent.findUnique({
        where: { agentId },
        include: { location: true },
      });

      if (!currentAgent?.location) {
        throw new Error("Agent location not found");
      }

      const currentX = currentAgent.location.x;
      const currentY = currentAgent.location.y;

      // Update agent position in database
      await prisma.agent.update({
        where: { agentId: agentId },
        data: {
          location: {
            update: {
              x: newX,
              y: newY,
              terrainType: terrain,
            },
          },
          updatedAt: new Date(),
        },
      });

      // Record state change in AgentState
      await prisma.agentState.update({
        where: { agentId: currentAgent.id },
        data: {
          lastActionType: "move",
          lastActionTime: new Date(),
          lastActionDetails: `Moved from (${currentX},${currentY}) to (${newX},${newY}) on ${terrain} terrain`,
        },
      });

      logger.info(`🎯 Agent ${agentId} moved successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Movement failed for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Start a battle between two agents
   * @param gameId Game identifier
   * @param agentId Agent identifier
   * @param opponentId Opponent agent's ID
   */
  async startBattle(
    gameId: number,
    agentId: number,
    opponentId: number
  ): Promise<{ message: string; success: boolean }> {
    logger.info(
      `⚔️ Starting battle between agents ${agentId} and ${opponentId}`
    );
    const [gamePda] = getGamePDA(this.program.programId, gameId);
    const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);
    const [opponentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      opponentId
    );

    try {
      const tx = await this.program.methods
        .startBattleSimple()
        .accounts({
          winner: agentPda,
          loser: opponentPda,
        })
        .rpc();

      return {
        message: `Battle started between agents ${agentId} and ${opponentId}`,
        success: true,
      };
    } catch (error) {
      logger.error(`❌ Battle start failed:`, error);
      return {
        message: `Battle start failed: ${error}`,
        success: false,
      };
    }
  }

  /**
   * Start a battle between an agent and an alliance
   * @param gameId Game identifier
   * @param agentId Agent identifier
   * @param allianceId Alliance identifier
   */
  async startBattleAgentVsAlliance(
    gameId: number,
    agentId: number,
    allianceId: number
  ): Promise<{ message: string; success: boolean }> {
    logger.info(
      `⚔️ Starting battle between agent ${agentId} and alliance ${allianceId}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);
      const [alliancePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("alliance"),
          gamePda.toBuffer(),
          Uint8Array.of(allianceId),
        ],
        this.program.programId
      );

      const tx = await this.program.methods
        .startBattleAgentVsAlliance()
        .accounts({
          attacker: agentPda,
          allianceLeader: alliancePda,
          alliancePartner: alliancePda,
        })
        .rpc();

      return {
        message: `Battle started between agent ${agentId} and alliance ${allianceId}`,
        success: true,
      };
    } catch (error) {
      logger.error(`❌ Battle start failed:`, error);
      return {
        message: `Battle start failed: ${error}`,
        success: false,
      };
    }
  }

  /**
   * Start a battle between two alliances
   * @param gameId Game identifier
   * @param allianceAId First alliance identifier
   * @param allianceBId Second alliance identifier
   */
  async startBattleAlliances(
    gameId: number,
    allianceAId: number,
    allianceBId: number
  ): Promise<{ message: string; success: boolean }> {
    logger.info(
      `⚔️ Starting battle between alliances ${allianceAId} and ${allianceBId}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [allianceAPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("alliance"),
          gamePda.toBuffer(),
          Uint8Array.of(allianceAId),
        ],
        this.program.programId
      );
      const [allianceBPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("alliance"),
          gamePda.toBuffer(),
          Uint8Array.of(allianceBId),
        ],
        this.program.programId
      );

      const tx = await this.program.methods
        .startBattleAlliances()
        .accounts({
          leaderA: allianceAPda,
          leaderB: allianceBPda,
          partnerA: allianceAPda,
          partnerB: allianceBPda,
        })
        .rpc();

      return {
        message: `Battle started between alliances ${allianceAId} and ${allianceBId}`,
        success: true,
      };
    } catch (error) {
      logger.error(`❌ Battle start failed:`, error);
      return {
        message: `Battle start failed: ${error}`,
        success: false,
      };
    }
  }

  /**
   * Resolve a battle between two agents
   * @param gameId Game identifier
   * @param winnerId Winning agent's ID
   * @param loserId Losing agent's ID
   * @param percentLoss Percentage of tokens lost
   */
  async resolveBattle(
    gameId: number,
    winnerId: number,
    loserId: number,
    percentLoss: number
  ): Promise<string> {
    logger.info(
      `⚔️ Resolving battle between agents ${winnerId} and ${loserId}`
    );

    try {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const [winnerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(winnerId)],
        this.program.programId
      );

      const [loserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(loserId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .resolveBattleSimple(new BN(percentLoss))
        .accounts({
          winner: winnerPda,
          loser: loserPda,
          winnerToken: winnerPda,
          loserToken: loserPda,
          loserAuthority: this.program.provider.publicKey,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Get agents to get their IDs
      const winner = await prisma.agent.findUnique({
        where: { agentId: winnerId },
      });

      const loser = await prisma.agent.findUnique({
        where: { agentId: loserId },
      });

      if (!winner || !loser) {
        throw new Error("Winner or loser agent not found");
      }

      // Get game to get its ID
      const game = await prisma.game.findUnique({
        where: { gameId },
      });

      if (!game) {
        throw new Error("Game not found");
      }

      // Record battle in database
      await prisma.battle.create({
        data: {
          gameId: game.id,
          agentId: winner.id,
          opponentId: loser.id,
          outcome: "victory",
          tokensLost: percentLoss,
          tokensGained: percentLoss,
          probability: 1.0, // Default value since we don't calculate it here
          timestamp: new Date(),
        },
      });

      // Update agent states
      await prisma.agentState.update({
        where: { agentId: winner.id },
        data: {
          lastActionType: "battle",
          lastActionTime: new Date(),
          lastActionDetails: `Won battle against Agent ${loserId}`,
        },
      });

      await prisma.agentState.update({
        where: { agentId: loser.id },
        data: {
          lastActionType: "battle",
          lastActionTime: new Date(),
          lastActionDetails: `Lost battle against Agent ${winnerId}`,
        },
      });

      logger.info(`🏆 Battle resolved successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Battle resolution failed:`, error);
      throw error;
    }
  }

  /**
   * Resolve a battle between an agent and an alliance
   * @param gameId Game identifier
   * @param winnerId Winning agent/alliance ID
   * @param loserId Losing agent/alliance ID
   * @param percentLoss Percentage of tokens lost
   * @param agentIsWinner Whether the agent is the winner
   */
  async resolveBattleAgentVsAlliance(
    gameId: number,
    winnerId: number,
    loserId: number,
    percentLoss: number,
    agentIsWinner: boolean
  ): Promise<string> {
    logger.info(
      `⚔️ Resolving agent vs alliance battle between ${winnerId} and ${loserId}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [winnerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        winnerId
      );
      const [loserPda] = getAgentPDA(this.program.programId, gamePda, loserId);

      const tx = await this.program.methods
        .resolveBattleAgentVsAlliance(percentLoss, agentIsWinner)
        .accounts({
          singleAgent: winnerPda,
          allianceLeader: loserPda,
          alliancePartner: loserPda,
          singleAgentToken: winnerPda,
          allianceLeaderToken: loserPda,
          alliancePartnerToken: loserPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update database records similar to resolveBattle
      await this.updateBattleRecords(gameId, winnerId, loserId, percentLoss);

      logger.info(`🏆 Agent vs Alliance battle resolved successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Agent vs Alliance battle resolution failed:`, error);
      throw error;
    }
  }

  /**
   * Resolve a battle between two alliances
   * @param gameId Game identifier
   * @param winningAllianceId Winning alliance ID
   * @param losingAllianceId Losing alliance ID
   * @param percentLoss Percentage of tokens lost
   * @param allianceAWins Whether alliance A is the winner
   */
  async resolveBattleAlliances(
    gameId: number,
    winningAllianceId: number,
    losingAllianceId: number,
    percentLoss: number,
    allianceAWins: boolean
  ): Promise<string> {
    logger.info(
      `⚔️ Resolving alliance battle between ${winningAllianceId} and ${losingAllianceId}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [winnerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("alliance"),
          gamePda.toBuffer(),
          Uint8Array.of(winningAllianceId),
        ],
        this.program.programId
      );
      const [loserPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("alliance"),
          gamePda.toBuffer(),
          Uint8Array.of(losingAllianceId),
        ],
        this.program.programId
      );

      const tx = await this.program.methods
        .resolveBattleAllianceVsAlliance(percentLoss, allianceAWins)
        .accounts({
          leaderA: winnerPda,
          leaderB: loserPda,
          partnerA: winnerPda,
          partnerB: loserPda,
          leaderAToken: winnerPda,
          leaderBToken: loserPda,
          partnerAToken: winnerPda,
          partnerBToken: loserPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update database records
      await this.updateBattleRecords(
        gameId,
        winningAllianceId,
        losingAllianceId,
        percentLoss
      );

      logger.info(`🏆 Alliance battle resolved successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Alliance battle resolution failed:`, error);
      throw error;
    }
  }

  /**
   * Form an alliance between two agents
   * @param gameId Game identifier
   * @param initiatorId Initiator agent's ID
   * @param targetId Target agent's ID
   */
  async formAlliance(
    gameId: number,
    initiatorId: number,
    targetId: number
  ): Promise<string> {
    logger.info(
      `🤝 Forming alliance between agents ${initiatorId} and ${targetId}`
    );

    try {
      const [gamePda] = await PublicKey.findProgramAddress(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const [initiatorPda] = await PublicKey.findProgramAddress(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(initiatorId)],
        this.program.programId
      );

      const [targetPda] = await PublicKey.findProgramAddress(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(targetId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // Record alliance in database
      await prisma.alliance.create({
        data: {
          agentId: initiatorId.toString(),
          gameId: gameId.toString(),
          status: "Active",
          alliedAgentId: targetId.toString(),
          combinedTokens: 0,
          formedAt: new Date(),
        },
      });

      logger.info(`✨ Alliance formed successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Alliance formation failed:`, error);
      throw error;
    }
  }

  /**
   * Break an alliance between two agents
   * @param gameId Game identifier
   * @param initiatorId Initiator agent's ID
   * @param targetId Target agent's ID
   */
  async breakAlliance(
    gameId: number,
    initiatorId: number,
    targetId: number
  ): Promise<string> {
    logger.info(
      `💔 Breaking alliance between agents ${initiatorId} and ${targetId}`
    );

    try {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const [initiatorPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(initiatorId)],
        this.program.programId
      );

      const [targetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(targetId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // Update alliance status in database
      await prisma.alliance.updateMany({
        where: {
          OR: [
            {
              agentId: initiatorId.toString(),
              alliedAgentId: targetId.toString(),
            },
            {
              agentId: targetId.toString(),
              alliedAgentId: initiatorId.toString(),
            },
          ],
          status: "Active",
        },
        data: {
          status: "Broken",
        },
      });

      logger.info(`💔 Alliance broken successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Alliance break failed:`, error);
      throw error;
    }
  }

  /**
   * End the game
   * @param gameId Game identifier
   */
  async endGame(gameId: number): Promise<string> {
    logger.info(`🏁 Ending game ${gameId}`);

    try {
      const [gamePda] = await PublicKey.findProgramAddress(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const tx = await this.program.methods
        .endGame()
        .accounts({
          game: gamePda,
        })
        .rpc();

      // Update game status in database
      await prisma.game.update({
        where: { gameId: gameId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`🎬 Game ended successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Game end failed:`, error);
      throw error;
    }
  }

  /**
   * Set agent cooldown
   * @param gameId Game identifier
   * @param agentId Agent identifier
   * @param newCooldown New cooldown timestamp
   */
  async setAgentCooldown(
    gameId: number,
    agentId: number,
    newCooldown: number
  ): Promise<string> {
    logger.info(`⏳ Setting cooldown for agent ${agentId}`);

    try {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), new BN(gameId).toBuffer("le", 4)],
        this.program.programId
      );

      const [agentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), gamePda.toBuffer(), Uint8Array.of(agentId)],
        this.program.programId
      );

      const tx = await this.program.methods
        .setAgentCooldown(new BN(newCooldown))
        .accounts({
          agent: agentPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update agent cooldown in database
      await prisma.agent.update({
        where: { agentId: agentId },
        data: {
          cooldowns: {
            update: {
              where: {
                agentId_targetAgentId_type: {
                  agentId: agentId.toString(),
                  targetAgentId: agentId.toString(),
                  type: "move",
                },
              },
              data: {
                endsAt: new Date(newCooldown * 1000),
              },
            },
          },
          updatedAt: new Date(),
        },
      });

      logger.info(`⌛ Cooldown set successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Setting cooldown failed:`, error);
      throw error;
    }
  }

  /**
   * Reset battle times for an agent
   * @param gameId Game identifier
   * @param agentId Agent identifier
   */
  async resetBattleTimes(gameId: number, agentId: number): Promise<string> {
    logger.info(`🔄 Resetting battle times for agent ${agentId}`);

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

      const tx = await this.program.methods
        .resetBattleTimes()
        .accounts({
          agent1: agentPda,
          authority: this.program.provider.publicKey,
          agent2: agentPda,
          agent3: agentPda,
          agent4: agentPda,
        })
        .rpc();

      logger.info(`✅ Battle times reset successfully`);
      return tx;
    } catch (error) {
      logger.error(`❌ Battle times reset failed:`, error);
      throw error;
    }
  }

  /**
   * Helper method to update battle records in database
   */
  private async updateBattleRecords(
    gameId: number,
    winnerId: number,
    loserId: number,
    percentLoss: number
  ) {
    const game = await prisma.game.findUnique({
      where: { gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    await prisma.battle.create({
      data: {
        gameId: game.id,
        agentId: winnerId.toString(),
        opponentId: loserId.toString(),
        outcome: "victory",
        tokensLost: percentLoss,
        tokensGained: percentLoss,
        probability: 1.0,
        timestamp: new Date(),
      },
    });
  }
}
