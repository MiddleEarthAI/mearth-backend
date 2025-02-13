import { PublicKey } from "@solana/web3.js";
import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { Prisma, PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import {
  generateBattleId,
  calculateTotalTokens,
  createBattleInitiationMessage,
} from "@/utils/battle";

import { AgentAccount } from "@/types/program";
import { stringToUuid } from "@/utils/uuid";

type AgentWithProfile = Prisma.AgentGetPayload<{
  include: { profile: true };
}>;

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
    const timestamp = Date.now();
    try {
      console.info(
        `Agent ${ctx.agentId} initiating battle with ${action.targetId}`,
        { ctx, action }
      );

      // Get PDAs
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

      // Generate deterministic battle ID
      const battleId = generateBattleId(
        [attacker, defender],
        timestamp,
        ctx.gameOnchainId
      );

      // Convert target onchain ID to database UUID
      const targetId = stringToUuid(action.targetId + ctx.gameOnchainId);

      // Perform all operations (both database and onchain) in a single transaction
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Step 1: Create battle record
          const battle = await prisma.battle.create({
            data: {
              id: battleId,
              type:
                attackerAllyAccount && defenderAllyAccount
                  ? "AllianceVsAlliance"
                  : attackerAllyAccount || defenderAllyAccount
                  ? "AgentVsAlliance"
                  : "Simple",
              status: "Active",
              tokensStaked: totalTokensAtStake,
              gameId: ctx.gameId,
              attackerId: attacker.id,
              defenderId: defender.id,
              attackerAllyId: attackerAllyAccount ? attacker.id : null,
              defenderAllyId: defenderAllyAccount ? defender.id : null,
              startTime: new Date(timestamp),
            },
          });

          // Step 2: Create battle event
          const battleEvent = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "BATTLE",
              initiatorId: ctx.agentId,
              targetId: targetId,
              message: createBattleInitiationMessage(
                attacker.profile.xHandle,
                defender.profile.xHandle,
                totalTokensAtStake,
                attackerAllyAccount,
                defenderAllyAccount
              ),
              metadata: {
                toJSON: () => ({
                  attackerHandle: attacker.profile.xHandle,
                  defenderHandle: defender.profile.xHandle,
                  tokensAtStake: totalTokensAtStake,
                  attackerAlly: attackerAllyAccount,
                  defenderAlly: defenderAllyAccount,
                }),
              },
            },
          });

          // Step 3: Execute onchain transaction
          let tx: string;
          try {
            tx = await this.executeBattleTransaction(
              attackerPda,
              defenderPda,
              attackerAccountData,
              defenderAccountData,
              attackerAllyAccount ?? undefined,
              defenderAllyAccount ?? undefined
            );
          } catch (error) {
            // Log the error and update battle status to Cancelled
            console.error("Onchain battle initiation failed", {
              error,
              battleId,
            });
            await prisma.battle.update({
              where: { id: battleId },
              data: {
                status: "Cancelled",
                endTime: new Date(),
              },
            });
            throw error; // Re-throw to trigger transaction rollback
          }

          // step 4: update game event with tx hash
          await prisma.gameEvent.update({
            where: { id: battleEvent.id },
            data: {
              metadata: {
                toJSON: () => ({
                  ...(battleEvent.metadata as Record<string, any>),
                  transactionHash: tx,
                }),
              },
            },
          });

          return { battle, tx };
        },
        {
          maxWait: 10000, // 10s max wait time
          timeout: 60000, // 60s timeout
        }
      );

      console.info("Battle initiated successfully", {
        battleId: result.battle.id,
        tx: result.tx,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
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
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount,
    attackerAlly?: AgentAccount,
    defenderAlly?: AgentAccount
  ): Promise<string> {
    if (attackerAlly && defenderAlly) {
      return this.program.methods
        .startBattleAlliances()
        .accounts({
          leaderA: attackerPda,
          partnerA: attackerAccount.allianceWith!,
          leaderB: defenderPda,
          partnerB: defenderAccount.allianceWith!,
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
          alliancePartner: alliancePartnerPda!,
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
}
