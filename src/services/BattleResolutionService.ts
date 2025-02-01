import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { GameService } from "./GameService";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { CronJob } from "cron";

/**
 * Service for handling battle resolutions via cron
 * Monitors active battles and resolves them after the 1 hour duration
 */
export class BattleResolutionService {
  private resolutionJob: CronJob;

  constructor(
    private readonly gameService: GameService,
    private readonly program: Program<MiddleEarthAiProgram>
  ) {
    // Initialize cron job to run every minute
    this.resolutionJob = new CronJob(
      "* * * * *", // Every minute
      () => this.checkAndResolveBattles(),
      null,
      false,
      "UTC"
    );

    logger.info("⚔️ Battle Resolution Service initialized");
  }

  /**
   * Start the battle resolution cron job
   */
  public start() {
    this.resolutionJob.start();
    this.setupBattleEventListener();
    logger.info("⚔️ Battle resolution cron job started");
  }

  /**
   * Stop the battle resolution cron job
   */
  public stop() {
    this.resolutionJob.stop();
    logger.info("⚔️ Battle resolution cron job stopped");
  }

  /**
   * Set up listener for battle start events from the program
   */
  private setupBattleEventListener() {
    this.program.addEventListener("battleInitiated", async (event) => {
      const { agentId, opponentAgentId } = event;
      const agent = await prisma.agent.findUnique({
        where: { agentId: agentId },
      });
      const opponent = await prisma.agent.findUnique({
        where: { agentId: opponentAgentId },
      });

      try {
        logger.info(`🗡️ New battle recorded: ${agentId} vs ${opponentAgentId}`);
      } catch (error) {
        logger.error("Failed to record battle start:", error);
      }
    });
  }

  /**
   * Check for battles that need resolution and resolve them
   */
  private async checkAndResolveBattles() {
    try {
      // Find battles that need resolution
      const battlesToResolve = await prisma.battle.findMany({
        where: {
          status: "Active",
          resolutionTime: {
            lte: new Date(), // Resolution time has passed
          },
        },
        include: {
          opponent: true,
          agent: true,
        },
      });

      for (const battle of battlesToResolve) {
        try {
          // Calculate battle outcome
          const outcome = await this.calculateBattleOutcome(battle);

          // Resolve the battle based on type
          switch (battle.type) {
            case "Simple":
              await this.gameService.resolveBattle(
                parseInt(battle.gameId),
                outcome.winnerId,
                outcome.loserId,
                outcome.percentLoss
              );
              break;
            case "AgentVsAlliance":
              await this.gameService.resolveBattleAgentVsAlliance(
                parseInt(battle.gameId),
                outcome.winnerId,
                outcome.loserId,
                outcome.percentLoss,
                outcome.agentIsWinner
              );
              break;
            case "AllianceVsAlliance":
              await this.gameService.resolveBattleAlliances(
                parseInt(battle.gameId),
                outcome.winnerId,
                outcome.loserId,
                outcome.percentLoss,
                outcome.allianceAWins
              );
              break;
          }

          // Update battle status
          await prisma.battle.update({
            where: { id: battle.id },
            data: {
              status: "Resolved",
              outcome:
                outcome.winnerId === parseInt(battle.agentId)
                  ? "Victory"
                  : "Defeat",
              tokensLost: outcome.percentLoss,
              resolvedAt: new Date(),
            },
          });

          logger.info(`⚔️ Battle ${battle.id} resolved successfully`);
        } catch (error) {
          logger.error(`Failed to resolve battle ${battle.id}:`, error);

          // Mark battle as failed
          await prisma.battle.update({
            where: { id: battle.id },
            data: {
              status: "Failed",
              resolvedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      logger.error("Battle resolution check failed:", error);
    }
  }

  /**
   * Calculate battle outcome based on agent strengths and random factors
   */
  private async calculateBattleOutcome(battle: any) {
    // Get current agent states
    const [attacker, defender] = await Promise.all([
      this.program.account.agent.fetch(
        new PublicKey(battle.attacker.publicKey)
      ),
      this.program.account.agent.fetch(
        new PublicKey(battle.defender.publicKey)
      ),
    ]);

    // Calculate strength based on tokens and alliances
    const attackerStrength =
      attacker.tokenBalance.toNumber() * (attacker.allianceWith ? 1.5 : 1);
    const defenderStrength =
      defender.tokenBalance.toNumber() * (defender.allianceWith ? 1.5 : 1);

    // Add random factor (0.8 to 1.2)
    const randomFactor = 0.8 + Math.random() * 0.4;
    const adjustedAttackerStrength = attackerStrength * randomFactor;

    // Determine winner
    const attackerWins = adjustedAttackerStrength > defenderStrength;

    // Calculate token loss (10-30% of loser's tokens)
    const percentLoss = Math.floor(10 + Math.random() * 20);

    return {
      winnerId: attackerWins
        ? parseInt(battle.agentId)
        : parseInt(battle.opponentId),
      loserId: attackerWins
        ? parseInt(battle.opponentId)
        : parseInt(battle.agentId),
      percentLoss,
      agentIsWinner: attackerWins,
      allianceAWins: attackerWins,
    };
  }
}
