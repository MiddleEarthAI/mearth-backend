import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { PrismaClient } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { BattleParticipant } from "./types/battle";
import { getAgentAta } from "@/utils/program";
import { getAgentPDA } from "@/utils/pda";
import * as anchor from "@coral-xyz/anchor";
import { logger } from "@/utils/logger";

/**
 * Consolidated battle handler that manages all types of battle resolutions
 */
export class BattleHandlers {
  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Handle a simple 1v1 battle between two agents
   */
  async handleSimpleBattle(
    gamePda: PublicKey,
    winner: BattleParticipant,
    loser: BattleParticipant,
    percentLoss: number
  ): Promise<void> {
    try {
      // Get PDAs and token accounts
      const [winnerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        winner.agent.onchainId
      );
      const [loserPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        loser.agent.onchainId
      );

      const [winnerAta, loserAta] = await Promise.all([
        getAgentAta(winnerPda),
        getAgentAta(loserPda),
      ]);

      if (!winnerAta || !loserAta) {
        throw new Error("Failed to get token accounts");
      }

      // Execute onchain battle resolution
      await this.program.methods
        .resolveBattleSimple(new anchor.BN(percentLoss))
        .accounts({
          winner: winnerPda,
          loser: loserPda,
          winnerToken: winnerAta.address,
          loserToken: loserAta.address,
          loserAuthority: loser.agent.authority,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      console.info("Simple battle resolved successfully", {
        winnerId: winner.agent.id,
        loserId: loser.agent.id,
        percentLoss,
      });
    } catch (error) {
      console.error("Failed to resolve simple battle", {
        error,
        winnerId: winner.agent.id,
        loserId: loser.agent.id,
      });
      throw error;
    }
  }

  /**
   * Handle a battle between a single agent and an alliance
   */
  async handleAgentVsAlliance(
    gamePda: PublicKey,
    single: BattleParticipant,
    leader: BattleParticipant,
    partner: BattleParticipant,
    singleWins: boolean,
    percentLoss: number
  ): Promise<void> {
    try {
      // Get PDAs
      const [singlePda] = getAgentPDA(
        this.program.programId,
        gamePda,
        single.agent.onchainId
      );
      const [leaderPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        leader.agent.onchainId
      );
      const [partnerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        partner.agent.onchainId
      );

      // Get token accounts
      const [singleAta, leaderAta, partnerAta] = await Promise.all([
        getAgentAta(singlePda),
        getAgentAta(leaderPda),
        getAgentAta(partnerPda),
      ]);

      if (!singleAta || !leaderAta || !partnerAta) {
        throw new Error("Failed to get token accounts");
      }

      // Execute onchain battle resolution
      await this.program.methods
        .resolveBattleAgentVsAlliance(new anchor.BN(percentLoss), singleWins)
        .accounts({
          singleAgent: singlePda,
          allianceLeader: leaderPda,
          alliancePartner: partnerPda,
          singleAgentToken: singleAta.address,
          allianceLeaderToken: leaderAta.address,
          alliancePartnerToken: partnerAta.address,
          singleAgentAuthority: single.agent.authority,
          allianceLeaderAuthority: leader.agent.authority,
          alliancePartnerAuthority: partner.agent.authority,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      console.info("Agent vs Alliance battle resolved successfully", {
        singleId: single.agent.id,
        leaderId: leader.agent.id,
        partnerId: partner.agent.id,
        singleWins,
        percentLoss,
      });
    } catch (error) {
      console.error("Failed to resolve agent vs alliance battle", {
        error,
        singleId: single.agent.id,
        leaderId: leader.agent.id,
        partnerId: partner.agent.id,
      });
      throw error;
    }
  }

  /**
   * Handle a battle between two alliances
   */
  async handleAllianceVsAlliance(
    gamePda: PublicKey,
    leaderA: BattleParticipant,
    partnerA: BattleParticipant,
    leaderB: BattleParticipant,
    partnerB: BattleParticipant,
    allianceAWins: boolean,
    percentLoss: number
  ): Promise<void> {
    try {
      // Get PDAs
      const [leaderAPda, partnerAPda, leaderBPda, partnerBPda] =
        await Promise.all(
          [
            getAgentPDA(
              this.program.programId,
              gamePda,
              leaderA.agent.onchainId
            ),
            getAgentPDA(
              this.program.programId,
              gamePda,
              partnerA.agent.onchainId
            ),
            getAgentPDA(
              this.program.programId,
              gamePda,
              leaderB.agent.onchainId
            ),
            getAgentPDA(
              this.program.programId,
              gamePda,
              partnerB.agent.onchainId
            ),
          ].map(([pda]) => pda)
        );

      // Get token accounts
      const [leaderAAta, partnerAAta, leaderBAta, partnerBAta] =
        await Promise.all([
          getAgentAta(leaderAPda),
          getAgentAta(partnerAPda),
          getAgentAta(leaderBPda),
          getAgentAta(partnerBPda),
        ]);

      if (!leaderAAta || !partnerAAta || !leaderBAta || !partnerBAta) {
        throw new Error("Failed to get token accounts");
      }

      // Execute onchain battle resolution
      await this.program.methods
        .resolveBattleAllianceVsAlliance(
          new anchor.BN(percentLoss),
          allianceAWins
        )
        .accounts({
          leaderA: leaderAPda,
          partnerA: partnerAPda,
          leaderB: leaderBPda,
          partnerB: partnerBPda,
          leaderAToken: leaderAAta.address,
          partnerAToken: partnerAAta.address,
          leaderBToken: leaderBAta.address,
          partnerBToken: partnerBAta.address,
          leaderAAuthority: leaderA.agent.authority,
          partnerAAuthority: partnerA.agent.authority,
          leaderBAuthority: leaderB.agent.authority,
          partnerBAuthority: partnerB.agent.authority,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      console.info("Alliance vs Alliance battle resolved successfully", {
        leaderAId: leaderA.agent.id,
        partnerAId: partnerA.agent.id,
        leaderBId: leaderB.agent.id,
        partnerBId: partnerB.agent.id,
        allianceAWins,
        percentLoss,
      });
    } catch (error) {
      console.error("Failed to resolve alliance vs alliance battle", {
        error,
        leaderAId: leaderA.agent.id,
        partnerAId: partnerA.agent.id,
        leaderBId: leaderB.agent.id,
        partnerBId: partnerB.agent.id,
      });
      throw error;
    }
  }
}
