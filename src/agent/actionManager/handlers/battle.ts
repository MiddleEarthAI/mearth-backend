import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { calculateBattleOutcome } from "@/utils/battle";
import {
  getAgentAuthorityAta,
  getMiddleEarthAiAuthorityWallet,
} from "@/utils/program";

export class BattleHandler {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(
    ctx: ActionContext,
    action: BattleAction
  ): Promise<ActionResult> {
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

      const [attackerAccountData, defenderAccountData] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      const [attackerAllyAccount, defenderAllyAccount] = await Promise.all([
        attackerAccountData.allianceWith
          ? this.program.account.agent.fetch(attackerAccountData.allianceWith)
          : null,
        defenderAccountData.allianceWith
          ? this.program.account.agent.fetch(defenderAccountData.allianceWith)
          : null,
      ]);

      const [
        attackerRecord,
        defenderRecord,
        attackerAllyRecord,
        defenderAllyRecord,
      ] = await Promise.all([
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
        attackerAllyAccount
          ? this.prisma.agent.findUnique({
              where: {
                onchainId_gameId: {
                  onchainId: Number(attackerAllyAccount.id),
                  gameId: ctx.gameId,
                },
              },
            })
          : null,
        defenderAllyAccount
          ? this.prisma.agent.findUnique({
              where: {
                onchainId_gameId: {
                  onchainId: Number(defenderAllyAccount.id),
                  gameId: ctx.gameId,
                },
              },
            })
          : null,
      ]);

      if (!attackerRecord || !defenderRecord) {
        throw new Error("One or more agents not found");
      }

      const sideA = {
        agent: attackerAccountData,
        ally: attackerAllyAccount,
      };
      const sideB = {
        agent: defenderAccountData,
        ally: defenderAllyAccount,
      };

      // Calculate battle outcome
      const outcome = calculateBattleOutcome(sideA, sideB);

      const battleType =
        attackerAllyAccount && defenderAllyAccount
          ? "AllianceVsAlliance"
          : attackerAllyAccount || defenderAllyAccount
          ? "AgentVsAlliance"
          : "Simple";
      const startTime = new Date();

      const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();

      // Execute everything in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Create battle record
        const battle = await prisma.battle.create({
          data: {
            type: battleType,
            status: "Resolved",
            tokensStaked: Math.floor(outcome.totalTokensAtStake),
            gameId: ctx.gameId,
            attackerId: attackerRecord.id,
            defenderId: defenderRecord.id,
            attackerAllyId: attackerAllyAccount ? attackerRecord.id : null,
            defenderAllyId: defenderAllyAccount ? defenderRecord.id : null,
            startTime,
            endTime: startTime,
            winnerId:
              outcome.winner === "sideA"
                ? attackerRecord.id
                : defenderRecord.id,
          },
        });

        // Create battle event
        const battleEvent = await prisma.gameEvent.create({
          data: {
            gameId: ctx.gameId,
            eventType: "BATTLE",
            initiatorId: ctx.agentId,
            targetId: defenderRecord.id,
            message: this.createBattleMessage(
              attackerRecord.profile.xHandle,
              defenderRecord.profile.xHandle,
              outcome
            ),
            metadata: {
              battleId: battle.id,
              battleType: battleType,
              tokensAtStake: outcome.totalTokensAtStake,
              percentageLost: outcome.percentageLost,
              winner: outcome.winner,
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Execute onchain battle resolution
        let tx: string;

        if (battleType === "AllianceVsAlliance") {
          if (!attackerAllyRecord || !defenderAllyRecord) {
            throw new Error("Could not find the alliance records");
          }

          const isAttackerWinner = outcome.winner === "sideA";
          tx = await this.program.methods
            .resolveBattleAllianceVsAlliance(
              outcome.percentageLost,
              isAttackerWinner
            )
            .accounts({
              leaderA: attackerPda,
              partnerA: attackerAccountData.allianceWith!,
              leaderB: defenderPda,
              partnerB: defenderAccountData.allianceWith!,
              leaderAToken: attackerRecord?.authorityAssociatedTokenAddress,
              partnerAToken:
                attackerAllyRecord?.authorityAssociatedTokenAddress,
              leaderBToken: defenderRecord?.authorityAssociatedTokenAddress,
              partnerBToken:
                defenderAllyRecord?.authorityAssociatedTokenAddress,
              leaderAAuthority: attackerRecord.authority,
              partnerAAuthority: attackerAllyRecord?.authority,
              leaderBAuthority: defenderRecord.authority,
              partnerBAuthority: defenderAllyRecord?.authority,
            })
            .signers([gameAuthorityWallet.keypair])
            .rpc();
        } else if (battleType === "AgentVsAlliance") {
          const isAttackerSingle = !attackerAllyAccount;

          const singleAgent = isAttackerSingle ? attackerPda : defenderPda;
          const singleAgentToken = isAttackerSingle
            ? attackerRecord.authorityAssociatedTokenAddress
            : defenderRecord.authorityAssociatedTokenAddress;
          const singleAgentAuthority = isAttackerSingle
            ? attackerRecord.authority
            : defenderRecord.authority;
          const allianceLeader = isAttackerSingle ? defenderPda : attackerPda;
          const alliancePartner = isAttackerSingle
            ? attackerAccountData.allianceWith!
            : defenderAccountData.allianceWith!;

          const allianceLeaderToken = isAttackerSingle
            ? defenderRecord.authorityAssociatedTokenAddress
            : attackerRecord.authorityAssociatedTokenAddress;
          const alliancePartnerToken = isAttackerSingle
            ? attackerAllyRecord?.authorityAssociatedTokenAddress!
            : defenderAllyRecord?.authorityAssociatedTokenAddress!;
          const allianceLeaderAuthority = isAttackerSingle
            ? defenderRecord.authority
            : attackerRecord.authority;
          const alliancePartnerAuthority = isAttackerSingle
            ? attackerRecord.authority
            : defenderRecord.authority;

          tx = await this.program.methods
            .resolveBattleAgentVsAlliance(
              outcome.percentageLost,
              isAttackerSingle
                ? outcome.winner === "sideA"
                : outcome.winner === "sideB"
            )
            .accounts({
              singleAgent: singleAgent,
              singleAgentToken: singleAgentToken,
              allianceLeader: allianceLeader,
              allianceLeaderToken: allianceLeaderToken,
              alliancePartner: alliancePartner,
              alliancePartnerToken: alliancePartnerToken,
              singleAgentAuthority: singleAgentAuthority,
              allianceLeaderAuthority: allianceLeaderAuthority,
              alliancePartnerAuthority: alliancePartnerAuthority,

              authority: gameAuthorityWallet.keypair.publicKey,
            })
            .signers([gameAuthorityWallet.keypair])
            .rpc();
        } else {
          const isAttackerWinner = outcome.winner === "sideA";
          tx = await this.program.methods
            .resolveBattleSimple(outcome.percentageLost)
            .accounts({
              winner: isAttackerWinner ? attackerPda : defenderPda,
              loser: isAttackerWinner ? defenderPda : attackerPda,
              winnerToken: isAttackerWinner
                ? attackerRecord.authorityAssociatedTokenAddress
                : defenderRecord.authorityAssociatedTokenAddress,
              loserToken: isAttackerWinner
                ? defenderRecord.authorityAssociatedTokenAddress
                : attackerRecord.authorityAssociatedTokenAddress,
              loserAuthority: isAttackerWinner
                ? defenderRecord.authority
                : attackerRecord.authority,
            })
            .signers([gameAuthorityWallet.keypair])
            .rpc();
        }

        return { battle, battleEvent, tx };
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error("💥 Battle failed", { error, ctx, action });
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

  private createBattleMessage(
    attackerHandle: string,
    defenderHandle: string,
    outcome: {
      winner: "sideA" | "sideB";
      percentageLost: number;
      totalTokensAtStake: number;
    }
  ): string {
    const winner = outcome.winner === "sideA" ? attackerHandle : defenderHandle;
    const loser = outcome.winner === "sideA" ? defenderHandle : attackerHandle;

    return `⚔️ Epic battle concluded! @${winner} emerges victorious over @${loser}! ${outcome.percentageLost}% of ${outcome.totalTokensAtStake} tokens lost in the clash!`;
  }
}
