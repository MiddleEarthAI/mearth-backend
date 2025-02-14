import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { calculateBattleOutcome } from "@/utils/battle";
import { getAgentAta } from "@/utils/program";

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

      // Get associated token accounts
      const attackerAta = await getAgentAta(attackerPda);
      const defenderAta = await getAgentAta(defenderPda);

      const [attackerAccountData, defenderAccountData] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      const [
        attackerRecord,
        defenderRecord,
        attackerAllyAccount,
        defenderAllyAccount,
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
        attackerAccountData.allianceWith
          ? this.program.account.agent.fetch(attackerAccountData.allianceWith)
          : null,
        defenderAccountData.allianceWith
          ? this.program.account.agent.fetch(defenderAccountData.allianceWith)
          : null,
      ]);

      // Get ally ATAs if they exist
      const [attackerAllyAta, defenderAllyAta] = await Promise.all([
        attackerAccountData.allianceWith
          ? getAgentAta(attackerAccountData.allianceWith)
          : null,
        defenderAccountData.allianceWith
          ? getAgentAta(defenderAccountData.allianceWith)
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
          tx = await this.program.methods
            .resolveBattleAllianceVsAlliance(
              outcome.percentageLost,
              outcome.winner === "sideA"
            )
            .accounts({
              leaderA: attackerPda,
              partnerA: attackerAccountData.allianceWith!,
              leaderB: defenderPda,
              partnerB: defenderAccountData.allianceWith!,
              leaderAToken: attackerAta.address,
              partnerAToken: attackerAllyAta?.address!,
              leaderBToken: defenderAta.address,
              partnerBToken: defenderAllyAta?.address!,
              leaderAAuthority: this.program.provider.publicKey,
              partnerAAuthority: this.program.provider.publicKey,
              leaderBAuthority: this.program.provider.publicKey,
              partnerBAuthority: this.program.provider.publicKey,
            })
            .rpc();
        } else if (battleType === "AgentVsAlliance") {
          const isAttackerSingle = !attackerAllyAccount;
          tx = await this.program.methods
            .resolveBattleAgentVsAlliance(
              outcome.percentageLost,
              isAttackerSingle
                ? outcome.winner === "sideA"
                : outcome.winner === "sideB"
            )
            .accounts({
              singleAgent: isAttackerSingle ? attackerPda : defenderPda,
              singleAgentToken: isAttackerSingle
                ? attackerAta.address
                : defenderAta.address,
              allianceLeader: isAttackerSingle ? defenderPda : attackerPda,
              allianceLeaderToken: isAttackerSingle
                ? defenderAta.address
                : attackerAta.address,
              alliancePartner: isAttackerSingle
                ? defenderAccountData.allianceWith!
                : attackerAccountData.allianceWith!,
              alliancePartnerToken: isAttackerSingle
                ? attackerAllyAta?.address!
                : defenderAllyAta?.address!,
              singleAgentAuthority: this.program.provider.publicKey,
              allianceLeaderAuthority: this.program.provider.publicKey,
              alliancePartnerAuthority: this.program.provider.publicKey,

              authority: this.program.provider.publicKey,
            })
            .rpc();
        } else {
          tx = await this.program.methods
            .resolveBattleSimple(outcome.percentageLost)
            .accounts({
              winner: outcome.winner === "sideA" ? attackerPda : defenderPda,
              loser: outcome.winner === "sideA" ? defenderPda : attackerPda,
              winnerToken:
                outcome.winner === "sideA"
                  ? attackerAta.address
                  : defenderAta.address,
              loserToken:
                outcome.winner === "sideA"
                  ? defenderAta.address
                  : attackerAta.address,
              loserAuthority: this.program.provider.publicKey,
            })
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
