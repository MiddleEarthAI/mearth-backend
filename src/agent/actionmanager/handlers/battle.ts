import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { ActionContext, BattleAction } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionResult } from "../types/feedback";
import { createBattleMessage } from "../utils/battle-messages";
import { calculateTotalTokens } from "../utils/token-calculations";

export class BattleHandler {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Handle battle initiation with validation
   */
  async handle(
    ctx: ActionContext,
    action: BattleAction
  ): Promise<ActionResult> {
    try {
      console.info(
        `Agent ${ctx.agentId} initiating battle with ${action.targetId}`
      );

      // Get PDAs and accounts
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [attackerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [defenderPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      // First fetch the main accounts
      const [attackerAccountData, defenderAccountData] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      // Then fetch everything else
      const [attacker, defender, attackerAllyAccount, defenderAllyAccount] =
        await Promise.all([
          this.prisma.agent.findUnique({
            where: { id: ctx.agentId },
            include: { profile: true },
          }),
          this.prisma.agent.findUnique({
            where: {
              onchainId_gameId: {
                onchainId: action.targetId,
                gameId: ctx.gameId,
              },
            },
            include: { profile: true },
          }),
          attackerAccountData?.allianceWith
            ? this.program.account.agent.fetch(attackerAccountData.allianceWith)
            : null,
          defenderAccountData?.allianceWith
            ? this.program.account.agent.fetch(defenderAccountData.allianceWith)
            : null,
        ]);

      if (!attacker || !defender) {
        throw new Error("One or more agents not found in database");
      }

      // Calculate total tokens at stake
      const totalTokensAtStake = calculateTotalTokens(
        attackerAccountData,
        defenderAccountData,
        attackerAllyAccount,
        defenderAllyAccount
      );

      // Execute battle transaction
      const tx = await this.executeBattleTransaction(
        attackerPda,
        defenderPda,
        attackerAccountData,
        defenderAccountData,
        attackerAllyAccount,
        defenderAllyAccount
      );

      // Create battle record and event
      await this.createBattleRecords(
        ctx,
        action,
        attacker,
        defender,
        attackerAllyAccount,
        defenderAllyAccount,
        totalTokensAtStake,
        tx
      );

      return {
        success: true,
        feedback: {
          isValid: true,
          data: {
            transactionHash: tx,
            message: `Battle initiated successfully with ${totalTokensAtStake.toNumber()} tokens at stake!`,
          },
        },
      };
    } catch (error) {
      console.error("💥 Battle initiation failed", { error, ctx, action });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "BATTLE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  /**
   * Execute the appropriate battle transaction based on participant types
   */
  private async executeBattleTransaction(
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: any,
    defenderAccount: any,
    attackerAlly?: any,
    defenderAlly?: any
  ): Promise<string> {
    if (attackerAlly && defenderAlly) {
      return this.program.methods
        .startBattleAlliances()
        .accounts({
          leaderA: attackerPda,
          partnerA: attackerAccount.allianceWith ?? "",
          leaderB: defenderPda,
          partnerB: defenderAccount.allianceWith ?? "",
        })
        .rpc();
    }

    if (attackerAlly || defenderAlly) {
      const [singlePda, allianceLeaderPda, alliancePartnerPda] = attackerAlly
        ? [defenderPda, attackerPda, attackerAccount.allianceWith]
        : [attackerPda, defenderPda, defenderAccount.allianceWith];

      return this.program.methods
        .startBattleAgentVsAlliance()
        .accounts({
          attacker: singlePda,
          allianceLeader: allianceLeaderPda,
          alliancePartner: alliancePartnerPda ?? "",
        })
        .rpc();
    }

    return this.program.methods
      .startBattleSimple()
      .accounts({
        winner: attackerPda,
        loser: defenderPda,
      })
      .rpc();
  }

  /**
   * Create battle records in database
   */
  private async createBattleRecords(
    ctx: ActionContext,
    action: BattleAction,
    attacker: any,
    defender: any,
    attackerAlly: any,
    defenderAlly: any,
    totalTokensAtStake: BN,
    tx: string
  ) {
    const battleType =
      attackerAlly && defenderAlly
        ? "AllianceVsAlliance"
        : attackerAlly || defenderAlly
        ? "AgentVsAlliance"
        : "Simple";

    await this.prisma.$transaction([
      this.prisma.battle.create({
        data: {
          type: battleType,
          status: "Active",
          tokensStaked: totalTokensAtStake.toNumber(),
          gameId: ctx.gameId,
          attackerId: attacker.id,
          defenderId: defender.id,
          attackerAllyId: attackerAlly ? attacker.id : null,
          defenderAllyId: defenderAlly ? defender.id : null,
          startTime: new Date(),
        },
      }),
      this.prisma.gameEvent.create({
        data: {
          eventType: "BATTLE",
          initiatorId: ctx.agentId.toString(),
          targetId: action.targetId.toString(),
          message: createBattleMessage(
            attacker.profile.xHandle,
            defender.profile.xHandle,
            totalTokensAtStake.toNumber(),
            attackerAlly,
            defenderAlly
          ),
          metadata: {
            battleType,
            tokensAtStake: totalTokensAtStake.toNumber(),
            timestamp: new Date().toISOString(),
            attackerHandle: attacker.profile.xHandle,
            defenderHandle: defender.profile.xHandle,
          },
        },
      }),
    ]);
  }
}
