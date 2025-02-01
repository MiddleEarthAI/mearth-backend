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
  constructor(private readonly program: Program<MiddleEarthAiProgram>) {
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
          dailyRewardTokens: gameAccount.dailyRewardTokens.toNumber(),
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
      const [gamePda] = getGamePDA(this.program.programId, gameId);
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
   * Move an agent to a new position with blockchain validation and database sync
   * @param gameId Game identifier
   * @param agentId Agent identifier
   * @param newX New x coordinate
   * @param newY New y coordinate
   * @param terrain Terrain type at new position
   * @throws Error if movement fails validation or blockchain transaction fails
   */
  async moveAgent(
    gameId: number,
    agentId: number,
    newX: number,
    newY: number,
    terrain: { plain?: {}; river?: {}; mountain?: {} }
  ): Promise<string> {
    logger.info(`🚶 Agent ${agentId} traveling to (${newX},${newY})`);

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

      // Fetch initial agent state to verify it's alive and get initial timestamps
      const initialAgent = await this.program.account.agent.fetch(agentPda);
      if (!initialAgent.isAlive) {
        throw new Error("Cannot move dead agent");
      }

      // Verify authority
      if (!this.program.provider.publicKey?.equals(initialAgent.authority)) {
        throw new Error("Unauthorized movement attempt");
      }

      // Execute movement transaction
      const tx = await this.program.methods
        .moveAgent(new BN(newX), new BN(newY), terrain)
        .accounts({
          agent: agentPda,
        })
        .rpc();

      // Verify blockchain state update
      const updatedAgent = await this.program.account.agent.fetch(agentPda);

      // Get current database state
      const currentAgent = await prisma.agent.findUnique({
        where: { agentId },
        include: {
          location: true,
          state: true,
        },
      });

      if (!currentAgent?.location) {
        throw new Error("Agent location not found in database");
      }

      const currentX = currentAgent.location.x;
      const currentY = currentAgent.location.y;

      // Determine terrain type for database
      let terrainType: TerrainType;
      let stuckTurns = 0;
      if (terrain.mountain) {
        terrainType = TerrainType.Mountain;
        stuckTurns = 2;
      } else if (terrain.river) {
        terrainType = TerrainType.River;
        stuckTurns = 1;
      } else {
        terrainType = TerrainType.Plain;
      }

      // Update database state atomically
      await prisma.$transaction([
        // Update location
        prisma.agent.update({
          where: { agentId },
          data: {
            location: {
              update: {
                x: newX,
                y: newY,
                terrainType,
              },
            },
            updatedAt: new Date(),
          },
        }),

        // Update agent state
        prisma.agentState.upsert({
          where: { agentId: currentAgent.id },
          create: {
            isAlive: true,
            lastActionType: "move",
            lastActionTime: new Date(updatedAgent.lastMove.toNumber() * 1000),
            lastActionDetails: `Moved from (${currentX},${currentY}) to (${newX},${newY}) on ${
              Object.keys(terrain)[0]
            } terrain`,
            agentId: currentAgent.id,
          },
          update: {
            lastActionType: "move",
            lastActionTime: new Date(updatedAgent.lastMove.toNumber() * 1000),
            lastActionDetails: `Moved from (${currentX},${currentY}) to (${newX},${newY}) on ${
              Object.keys(terrain)[0]
            } terrain`,
          },
        }),

        // Update movement cooldown
        prisma.cooldown.upsert({
          where: {
            agentId_targetAgentId_type: {
              agentId: currentAgent.id,
              targetAgentId: currentAgent.id,
              type: "move",
            },
          },
          create: {
            type: "move",
            targetAgentId: currentAgent.id,
            agentId: currentAgent.id,
            endsAt: new Date(updatedAgent.nextMoveTime.toNumber() * 1000),
          },
          update: {
            endsAt: new Date(updatedAgent.nextMoveTime.toNumber() * 1000),
          },
        }),
      ]);

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
    defenderId: number,
    ally: PublicKey
  ): Promise<{ message: string; success: boolean }> {
    logger.info(
      `⚔️ Starting battle between agent ${agentId} and alliance ${ally}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);
      const [defenderPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        defenderId
      );

      const tx = await this.program.methods
        .startBattleAgentVsAlliance()
        .accounts({
          attacker: agentPda,
          allianceLeader: defenderPda,
          alliancePartner: ally,
        })
        .rpc();

      return {
        message: `Battle started between agent ${agentId} and alliance ${ally}`,
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
    leaderAId: number,
    partnerA: PublicKey,
    leaderBId: number,
    partnerB: PublicKey
  ): Promise<{ message: string; success: boolean }> {
    logger.info(
      `⚔️ Starting battle between alliances ${leaderAId} and ${leaderBId}`
    );

    try {
      const [gamePda] = getGamePDA(this.program.programId, gameId);
      const [leaderAPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        leaderAId
      );

      const [leaderBPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        leaderBId
      );

      const tx = await this.program.methods
        .startBattleAlliances()
        .accounts({
          leaderA: leaderAPda,
          leaderB: leaderBPda,
          partnerA: partnerA,
          partnerB: partnerB,
        })
        .rpc();

      return {
        message: `Battle started between alliances ${leaderAId} and ${leaderBId}`,
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
          startTime: new Date(),
          resolutionTime: new Date(),
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
   * @returns {Promise<{tx: string, alliance: Alliance}>} Transaction signature and created alliance details
   * @throws Error if alliance formation fails due to:
   * - Self-alliance attempt
   * - Either agent already in alliance
   * - Unauthorized wallet
   */
  async formAlliance(
    gameId: number,
    initiatorId: number,
    targetId: number
  ): Promise<{ tx: string; alliance: any }> {
    logger.info(
      `🤝 Forming alliance between agents ${initiatorId} and ${targetId}`
    );

    try {
      // Prevent self-alliance
      if (initiatorId === targetId) {
        throw new Error("Cannot form alliance with oneself");
      }

      const [gamePda] = getGamePDA(this.program.programId, gameId);

      const [initiatorPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        initiatorId
      );

      const [targetPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        targetId
      );

      // Check if either agent is already in an alliance
      const existingAlliances = await prisma.alliance.findMany({
        where: {
          OR: [
            { agentId: initiatorId.toString() },
            { agentId: targetId.toString() },
            { alliedAgentId: initiatorId.toString() },
            { alliedAgentId: targetId.toString() },
          ],
          status: "Active",
        },
      });

      if (existingAlliances.length > 0) {
        throw new Error("One or both agents are already in an alliance");
      }

      // Get agents' token balances for combined tokens calculation
      const [initiatorTokens, targetTokens] = await Promise.all([
        this.program.account.agent.fetch(initiatorPda),
        this.program.account.agent.fetch(targetPda),
      ]);

      const combinedTokens =
        (initiatorTokens?.tokenBalance || 0) +
        (targetTokens?.tokenBalance || 0);

      // Execute on-chain alliance formation
      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // Record alliance in database within a transaction
      const alliance = await prisma.$transaction(async (prisma) => {
        // Create alliance record
        const newAlliance = await prisma.alliance.create({
          data: {
            agentId: initiatorId.toString(),
            gameId: gameId.toString(),
            status: "Active",
            alliedAgentId: targetId.toString(),
            combinedTokens,
            formedAt: new Date(),
          },
        });

        // Update both agents' states
        await Promise.all([
          prisma.agentState.update({
            where: { agentId: initiatorId.toString() },
            data: {
              lastActionType: "alliance",
              lastActionTime: new Date(),
              lastActionDetails: `Formed alliance with agent ${targetId}`,
            },
          }),
          prisma.agentState.update({
            where: { agentId: targetId.toString() },
            data: {
              lastActionType: "alliance",
              lastActionTime: new Date(),
              lastActionDetails: `Formed alliance with agent ${initiatorId}`,
            },
          }),
        ]);

        return newAlliance;
      });

      logger.info(
        `✨ Alliance formed successfully between agents ${initiatorId} and ${targetId}`
      );
      return {
        tx,
        alliance,
      };
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
   * @returns Object containing transaction signature and alliance break details
   */
  async breakAlliance(
    gameId: number,
    initiatorId: number,
    targetId: number
  ): Promise<{
    tx: string;
    details: {
      success: boolean;
      message: string;
      initiatorState: string;
      targetState: string;
    };
  }> {
    logger.info(
      `💔 Breaking alliance between agents ${initiatorId} and ${targetId}`
    );

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, gameId);

      const [initiatorPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        initiatorId
      );

      const [targetPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        targetId
      );

      // Verify alliance exists and can be broken
      const initiatorAgent = await this.program.account.agent.fetch(
        initiatorPda
      );
      const targetAgent = await this.program.account.agent.fetch(targetPda);

      if (!initiatorAgent.allianceWith || !targetAgent.allianceWith) {
        throw new Error("No active alliance exists between these agents");
      }

      if (
        initiatorAgent.allianceWith.toBase58() !== targetPda.toBase58() ||
        targetAgent.allianceWith.toBase58() !== initiatorPda.toBase58()
      ) {
        throw new Error("Agents are not allied with each other");
      }

      // Execute on-chain break alliance
      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // Update database in transaction
      const dbUpdates = await prisma.$transaction(async (prisma) => {
        // Update alliance status
        const updatedAlliance = await prisma.alliance.updateMany({
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

        // Update agent states
        const [initiatorState, targetState] = await Promise.all([
          prisma.agentState.update({
            where: { agentId: initiatorId.toString() },
            data: {
              lastActionType: "alliance_break",
              lastActionTime: new Date(),
              lastActionDetails: `Broke alliance with agent ${targetId}`,
            },
          }),
          prisma.agentState.update({
            where: { agentId: targetId.toString() },
            data: {
              lastActionType: "alliance_break",
              lastActionTime: new Date(),
              lastActionDetails: `Alliance broken by agent ${initiatorId}`,
            },
          }),
        ]);

        return {
          initiatorState,
          targetState,
          allianceUpdated: updatedAlliance.count > 0,
        };
      });

      logger.info(`💔 Alliance broken successfully`);

      return {
        tx,
        details: {
          success: true,
          message: "Alliance broken successfully",
          initiatorState: dbUpdates.initiatorState.lastActionDetails,
          targetState: dbUpdates.targetState.lastActionDetails,
        },
      };
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
        startTime: new Date(),
        resolutionTime: new Date(),
      },
    });
  }
}
