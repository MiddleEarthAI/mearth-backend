import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { calculateBattleOutcome } from "@/utils/battle";
import {
  getAgentAuthorityAta,
  getAgentAuthorityKeypair,
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
              include: { profile: true },
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
              include: { profile: true },
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

      console.info(`Battle type: ${battleType}`);
      const startTime = new Date();

      const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();

      const attackerAuthorityKeypair = await getAgentAuthorityKeypair(
        attackerRecord.profile.onchainId
      );
      const defenderAuthorityKeypair = await getAgentAuthorityKeypair(
        defenderRecord.profile.onchainId
      );

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

          const attackerAllyAuthority = await getAgentAuthorityKeypair(
            attackerAllyRecord.profile.onchainId
          );
          const defenderAllyAuthority = await getAgentAuthorityKeypair(
            defenderAllyRecord.profile.onchainId
          );

          const isAttackerWinner = outcome.winner === "sideA";
          tx = await this.program.methods
            .resolveBattleAllianceVsAlliance(
              outcome.percentageLost,
              isAttackerWinner
            )
            .accounts({
              leaderA: isAttackerWinner ? attackerPda : defenderPda,
              partnerA: isAttackerWinner
                ? attackerAccountData.allianceWith!
                : defenderAccountData.allianceWith!,
              leaderB: isAttackerWinner ? defenderPda : attackerPda,
              partnerB: isAttackerWinner
                ? defenderAccountData.allianceWith!
                : attackerAccountData.allianceWith!,
              leaderAToken: isAttackerWinner
                ? attackerRecord?.authorityAssociatedTokenAddress
                : defenderRecord?.authorityAssociatedTokenAddress,
              partnerAToken: isAttackerWinner
                ? attackerAllyRecord?.authorityAssociatedTokenAddress
                : defenderAllyRecord?.authorityAssociatedTokenAddress,
              leaderBToken: isAttackerWinner
                ? defenderRecord?.authorityAssociatedTokenAddress
                : attackerRecord?.authorityAssociatedTokenAddress,
              partnerBToken: isAttackerWinner
                ? defenderAllyRecord?.authorityAssociatedTokenAddress
                : attackerAllyRecord?.authorityAssociatedTokenAddress,
              leaderAAuthority: isAttackerWinner
                ? attackerAuthorityKeypair.publicKey
                : defenderAuthorityKeypair.publicKey,
              partnerAAuthority: isAttackerWinner
                ? attackerAllyAuthority.publicKey
                : defenderAllyAuthority.publicKey,
              leaderBAuthority: isAttackerWinner
                ? defenderAuthorityKeypair.publicKey
                : attackerAuthorityKeypair.publicKey,
              partnerBAuthority: isAttackerWinner
                ? defenderAllyAuthority.publicKey
                : attackerAllyAuthority.publicKey,
              authority: gameAuthorityWallet.keypair.publicKey,
            })
            .signers([
              attackerAuthorityKeypair,
              defenderAuthorityKeypair,
              attackerAllyAuthority,
              defenderAllyAuthority,
              gameAuthorityWallet.keypair,
            ])
            .rpc();
        } else if (battleType === "AgentVsAlliance") {
          const isAttackerSingle = !attackerAllyAccount;

          const singleAgent = isAttackerSingle ? attackerPda : defenderPda;

          const singleAgentToken = isAttackerSingle
            ? attackerRecord.authorityAssociatedTokenAddress
            : defenderRecord.authorityAssociatedTokenAddress;
          const singleAgentAuthorityKeypair = isAttackerSingle
            ? attackerAuthorityKeypair
            : defenderAuthorityKeypair;
          const allianceLeaderAuthorityKeypair = isAttackerSingle
            ? defenderAuthorityKeypair
            : attackerAuthorityKeypair;
          const alliancePartnerAuthorityKeypair = isAttackerSingle
            ? attackerAuthorityKeypair
            : defenderAuthorityKeypair;
          const allianceLeader = isAttackerSingle ? defenderPda : attackerPda;
          const alliancePartner = isAttackerSingle
            ? defenderAccountData.allianceWith!
            : attackerAccountData.allianceWith!;

          const allianceLeaderToken = isAttackerSingle
            ? defenderRecord.authorityAssociatedTokenAddress
            : attackerRecord.authorityAssociatedTokenAddress;
          const alliancePartnerToken = isAttackerSingle
            ? defenderAllyRecord?.authorityAssociatedTokenAddress!
            : attackerAllyRecord?.authorityAssociatedTokenAddress!;

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
              singleAgentAuthority: singleAgentAuthorityKeypair.publicKey,
              allianceLeaderAuthority: allianceLeaderAuthorityKeypair.publicKey,
              alliancePartnerAuthority:
                alliancePartnerAuthorityKeypair.publicKey,

              authority: gameAuthorityWallet.keypair.publicKey,
            })
            .signers([
              gameAuthorityWallet.keypair,
              singleAgentAuthorityKeypair,
              allianceLeaderAuthorityKeypair,
              alliancePartnerAuthorityKeypair,
            ])
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
                ? defenderAuthorityKeypair.publicKey
                : attackerAuthorityKeypair.publicKey,
              authority: gameAuthorityWallet.keypair.publicKey,
            })
            .signers([
              gameAuthorityWallet.keypair,
              // the loser authority keypair
              isAttackerWinner
                ? defenderAuthorityKeypair
                : attackerAuthorityKeypair,
            ])
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
