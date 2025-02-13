import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { PrismaClient } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { BattleParticipant } from "../types/battle";
import { getAgentAta } from "@/utils/program";
import { getAgentPDA } from "@/utils/pda";
import * as anchor from "@coral-xyz/anchor";

export class AgentVsAllianceHandler {
  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Handle a battle between a single agent and an alliance
   */
  async handle(
    gamePda: PublicKey,
    singleAgent: BattleParticipant,
    allianceLeader: BattleParticipant,
    alliancePartner: BattleParticipant,
    singleAgentWins: boolean,
    percentLoss: number
  ): Promise<void> {
    // Get PDAs and token accounts
    const [singleAgentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      singleAgent.agent.onchainId
    );
    const singleAgentAta = await getAgentAta(singleAgentPda);

    const [allianceLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      allianceLeader.agent.onchainId
    );
    const allianceLeaderAta = await getAgentAta(allianceLeaderPda);

    const [alliancePartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      alliancePartner.agent.onchainId
    );
    const alliancePartnerAta = await getAgentAta(alliancePartnerPda);

    // Execute onchain battle resolution
    await this.program.methods
      .resolveBattleAgentVsAlliance(new anchor.BN(percentLoss), singleAgentWins)
      .accounts({
        singleAgent: singleAgentPda,
        allianceLeader: allianceLeaderPda,
        alliancePartner: alliancePartnerPda,
        singleAgentToken: singleAgentAta.address,
        allianceLeaderToken: allianceLeaderAta.address,
        alliancePartnerToken: alliancePartnerAta.address,
      })
      .rpc();
  }
}
