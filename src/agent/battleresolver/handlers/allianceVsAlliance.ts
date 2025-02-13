import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { PrismaClient } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { BattleParticipant } from "../types/battle";
import { getAgentAta } from "@/utils/program";
import { getAgentPDA } from "@/utils/pda";
import * as anchor from "@coral-xyz/anchor";

export class AllianceVsAllianceHandler {
  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Handle a battle between two alliances
   */
  async handle(
    gamePda: PublicKey,
    allianceALeader: BattleParticipant,
    allianceAPartner: BattleParticipant,
    allianceBLeader: BattleParticipant,
    allianceBPartner: BattleParticipant,
    allianceAWins: boolean,
    percentLoss: number
  ): Promise<void> {
    // Get PDAs and token accounts for alliance A
    const [allianceALeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      allianceALeader.agent.onchainId
    );
    const allianceALeaderAta = await getAgentAta(allianceALeaderPda);

    const [allianceAPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      allianceAPartner.agent.onchainId
    );
    const allianceAPartnerAta = await getAgentAta(allianceAPartnerPda);

    // Get PDAs and token accounts for alliance B
    const [allianceBLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      allianceBLeader.agent.onchainId
    );
    const allianceBLeaderAta = await getAgentAta(allianceBLeaderPda);

    const [allianceBPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      allianceBPartner.agent.onchainId
    );
    const allianceBPartnerAta = await getAgentAta(allianceBPartnerPda);

    // Execute onchain battle resolution
    await this.program.methods
      .resolveBattleAllianceVsAlliance(
        new anchor.BN(percentLoss),
        allianceAWins
      )
      .accounts({
        leaderA: allianceALeaderPda,
        partnerA: allianceAPartnerPda,
        leaderB: allianceBLeaderPda,
        partnerB: allianceBPartnerPda,
        leaderAToken: allianceALeaderAta.address,
        partnerAToken: allianceAPartnerAta.address,
        leaderBToken: allianceBLeaderAta.address,
        partnerBToken: allianceBPartnerAta.address,
      })
      .rpc();
  }
}
