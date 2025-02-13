import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { PrismaClient } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { BattleParticipant } from "../types/battle";
import { getAgentAta } from "@/utils/program";
import { getAgentPDA } from "@/utils/pda";
import * as anchor from "@coral-xyz/anchor";

export class SimpleBattleHandler {
  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Handle a simple 1v1 battle between two agents
   */
  async handle(
    gamePda: PublicKey,
    winner: BattleParticipant,
    loser: BattleParticipant,
    percentLoss: number
  ): Promise<void> {
    // Get PDAs and token accounts
    const [winnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      winner.agent.onchainId
    );
    const winnerAta = await getAgentAta(winnerPda);

    const [loserPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      loser.agent.onchainId
    );
    const loserAta = await getAgentAta(loserPda);

    // Execute onchain battle resolution
    await this.program.methods
      .resolveBattleSimple(new anchor.BN(percentLoss))
      .accounts({
        winner: winnerPda,
        loser: loserPda,
        winnerToken: winnerAta.address,
        loserToken: loserAta.address,
      })
      .rpc();
  }
}
