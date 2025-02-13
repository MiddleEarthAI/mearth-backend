/**
 * Battle Resolution (BR) Module
 * This module handles the organization and classification of battles between agents and alliances,
 * including battle outcome calculations based on token balances
 */

import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import * as anchor from "@coral-xyz/anchor";
import { PrismaClient } from "@prisma/client";
import { GameManager } from "../GameManager";
import { getGamePDA } from "@/utils/pda";
import { logger } from "@/utils/logger";
import { BattleHandlers } from "./battleHandlers";
import { BattleGroup, BattleParticipant } from "./types/battle";
import { organizeBattles, calculateBattleOutcome } from "./battleUtils";
import { BattleType } from "@prisma/client";

/**
 * Battle resolver class that orchestrates the resolution of different battle types
 */
export class BattleResolver {
  private resolutionInterval: NodeJS.Timeout | null = null;
  private readonly battleHandlers: BattleHandlers;

  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient,
    private readonly gameManager: GameManager
  ) {
    this.battleHandlers = new BattleHandlers(program, prisma);
    logger.info("🎮 Battle Resolution Service initialized");
  }

  /**
   * Start the battle resolution service
   */
  public async start(checkIntervalMs: number = 60000) {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
    }

    // Initial battle resolution
    await this.resolvePendingBattles();

    // Set up interval for continuous monitoring
    this.resolutionInterval = setInterval(
      () => this.resolvePendingBattles(),
      checkIntervalMs
    );

    logger.info("🎯 Battle resolution service started", { checkIntervalMs });
  }

  /**
   * Stop the battle resolution service
   */
  public stop() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
      logger.info("✋ Battle resolution service stopped");
    }
  }

  /**
   * Resolve all pending battles
   */
  private async resolvePendingBattles() {
    try {
      const game = await this.gameManager.getActiveGame();
      if (!game) {
        logger.warn("⚠️ No active game found");
        return;
      }

      const agents = game.agents.map((a) => a.account);
      const battles = organizeBattles(agents, game.dbGame.onchainId);

      logger.info("⚔️ Processing battles", {
        count: battles.length,
        gameId: game.dbGame.id,
      });

      // Process each battle in parallel
      await Promise.all(
        battles.map(async (battle) => {
          try {
            if (!this.isBattleReadyToResolve(battle)) {
              return;
            }

            await this.resolveBattle(battle, game.dbGame);
          } catch (error) {
            logger.error("❌ Failed to process battle", {
              error,
              battleId: battle.id,
            });
          }
        })
      );
    } catch (error) {
      logger.error("❌ Battle resolution cycle failed", { error });
    }
  }

  /**
   * Check if battle is ready to be resolved
   */
  private isBattleReadyToResolve(battle: BattleGroup): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - battle.startTime >= battle.cooldownDuration;
  }

  /**
   * Resolve a specific battle based on its type
   */
  private async resolveBattle(
    battle: BattleGroup,
    game: { id: string; onchainId: number }
  ) {
    const { sideAWins, percentLoss } = calculateBattleOutcome(
      battle.sideA,
      battle.sideB
    );
    const [gamePda] = getGamePDA(this.program.programId, game.onchainId);

    try {
      // Execute onchain battle resolution
      switch (battle.type) {
        case BattleType.Simple:
          await this.battleHandlers.handleSimpleBattle(
            gamePda,
            sideAWins ? battle.sideA[0] : battle.sideB[0],
            sideAWins ? battle.sideB[0] : battle.sideA[0],
            percentLoss
          );
          break;

        case BattleType.AgentVsAlliance:
          const [single, alliance] =
            battle.sideA.length === 1
              ? [battle.sideA[0], battle.sideB]
              : [battle.sideB[0], battle.sideA];

          await this.battleHandlers.handleAgentVsAlliance(
            gamePda,
            single,
            alliance[0],
            alliance[1],
            sideAWins === (battle.sideA.length === 1),
            percentLoss
          );
          break;

        case BattleType.AllianceVsAlliance:
          await this.battleHandlers.handleAllianceVsAlliance(
            gamePda,
            battle.sideA[0],
            battle.sideA[1],
            battle.sideB[0],
            battle.sideB[1],
            sideAWins,
            percentLoss
          );
          break;
      }

      // Update battle status and apply health penalties
      await this.finalizeBattle(
        battle.id,
        sideAWins ? battle.sideA : battle.sideB,
        sideAWins ? battle.sideB : battle.sideA,
        game
      );
    } catch (error) {
      logger.error("❌ Battle resolution failed", {
        error,
        battleId: battle.id,
      });
      throw error;
    }
  }

  /**
   * Finalize battle by updating status and applying health penalties
   */
  private async finalizeBattle(
    battleId: string,
    winners: BattleParticipant[],
    losers: BattleParticipant[],
    game: { id: string; onchainId: number }
  ) {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Get profiles for all participants
        const participants = [...winners, ...losers];
        const profiles = await Promise.all(
          participants.map((participant) =>
            prisma.agent.findUnique({
              where: {
                onchainId_gameId: {
                  onchainId: participant.agent.onchainId,
                  gameId: game.id,
                },
              },
              include: { profile: true },
            })
          )
        );

        const winnerProfiles = profiles.slice(0, winners.length);
        const loserProfiles = profiles.slice(winners.length);

        // Create battle resolution event
        let battleMessage = "";
        let eventMetadata: any = {
          timestamp: new Date().toISOString(),
          winners: winnerProfiles.map((w) => w?.profile.xHandle),
          losers: loserProfiles.map((l) => l?.profile.xHandle),
        };

        if (winners.length === 1 && losers.length === 1) {
          battleMessage = `⚔️ Victory! @${winnerProfiles[0]?.profile.xHandle} emerges triumphant over @${loserProfiles[0]?.profile.xHandle} in single combat!`;
          eventMetadata.battleType = "simple";
        } else if (winners.length === 2 && losers.length === 2) {
          battleMessage = `⚔️ Alliance Victory! The alliance of @${winnerProfiles[0]?.profile.xHandle} and @${winnerProfiles[1]?.profile.xHandle} triumphs over @${loserProfiles[0]?.profile.xHandle} and @${loserProfiles[1]?.profile.xHandle}!`;
          eventMetadata.battleType = "alliance_vs_alliance";
        } else {
          const singleAgent =
            winners.length === 1 ? winnerProfiles[0] : loserProfiles[0];
          const alliance =
            winners.length === 2 ? winnerProfiles : loserProfiles;
          battleMessage =
            winners.length === 1
              ? `⚔️ Legendary Victory! @${singleAgent?.profile.xHandle} defeats the alliance of @${alliance[0]?.profile.xHandle} and @${alliance[1]?.profile.xHandle}!`
              : `⚔️ Alliance Victory! The alliance of @${alliance[0]?.profile.xHandle} and @${alliance[1]?.profile.xHandle} overwhelms @${singleAgent?.profile.xHandle}!`;
          eventMetadata.battleType = "agent_vs_alliance";
        }

        // Create battle resolution event
        await prisma.gameEvent.create({
          data: {
            eventType: "BATTLE",
            initiatorId: winners[0].agent.id,
            targetId: losers[0].agent.id,
            message: battleMessage,
            metadata: eventMetadata,
            gameId: game.id,
          },
        });

        // Update battle status
        await prisma.battle.update({
          where: { id: battleId },
          data: {
            status: "Resolved",
            endTime: new Date(),
            winnerId: winners[0].agent.id,
          },
        });

        // Handle deaths with dramatic events
        await Promise.all(
          losers.map(async (loser, index) => {
            const shouldDie = Math.random() <= 0.1; // 10% chance of death
            const loserProfile = loserProfiles[index];

            if (shouldDie && loserProfile) {
              // Create death event
              await prisma.gameEvent.create({
                data: {
                  gameId: game.id,
                  eventType: "BATTLE",
                  initiatorId: winners[0].agent.id,
                  targetId: loser.agent.id,
                  message: `☠️ A warrior falls! @${loserProfile.profile.xHandle} has been defeated in glorious battle by @${winnerProfiles[0]?.profile.xHandle}!`,
                  metadata: {
                    type: "death",
                    timestamp: new Date().toISOString(),
                    slainAgent: loserProfile.profile.xHandle,
                    slayedBy: winnerProfiles[0]?.profile.xHandle,
                  },
                },
              });

              // Update agent status
              await prisma.agent.update({
                where: {
                  onchainId_gameId: {
                    onchainId: loser.agent.onchainId,
                    gameId: game.id,
                  },
                },
                data: {
                  isAlive: false,
                  deathTimestamp: new Date(),
                },
              });

              logger.info(
                `Agent ${loserProfile.profile.xHandle} has fallen in battle`,
                {
                  type: "BATTLE_DEATH",
                  agentId: loser.agent.id,
                  gameId: game.id,
                }
              );
            }
          })
        );

        // Create victory spoils event
        const tokensWon = winners.reduce(
          (sum, winner) => sum + winner.tokenBalance,
          0
        );

        const winnerHandles = winnerProfiles
          .map((w) => w?.profile.xHandle)
          .filter((handle): handle is string => handle !== undefined);

        await prisma.gameEvent.create({
          data: {
            gameId: game.id,
            eventType: "BATTLE",
            initiatorId: winners[0].agent.id,
            targetId: losers[0].agent.id,
            message:
              winners.length === 1
                ? `💰 @${winnerProfiles[0]?.profile.xHandle} claims ${tokensWon} tokens in victory!`
                : `💰 The alliance of @${winnerProfiles[0]?.profile.xHandle} and @${winnerProfiles[1]?.profile.xHandle} share ${tokensWon} tokens in victory!`,
            metadata: {
              type: "spoils",
              timestamp: new Date().toISOString(),
              tokensWon,
              winners: winnerHandles,
            },
          },
        });
      });
    } catch (error) {
      logger.error("❌ Failed to finalize battle", { error });
      throw error;
    }
  }
}
