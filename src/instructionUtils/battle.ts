import { logger } from "@/utils/logger";
import { BN } from "@coral-xyz/anchor";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { PublicKey } from "@solana/web3.js";

import { getProgramWithWallet } from "@/utils/program";

/**
 * Start a simple battle between two agents
 * @param gameId - The game ID
 * @param winnerId - The ID of the winning agent
 * @param loserId - The ID of the losing agent
 */
export async function startSimpleBattle(
  gameId: number,
  winnerId: number,
  loserId: number
): Promise<{ tx: string }> {
  const program = await getProgramWithWallet();
  try {
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [winnerPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(winnerId)
    );
    const [loserPda] = getAgentPDA(program.programId, gamePda, new BN(loserId));

    // Execute battle start on-chain
    const tx = await program.methods
      .startBattleSimple()
      .accounts({
        winner: winnerPda,
        loser: loserPda,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Simple battle started between agents ${winnerId} and ${loserId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to start simple battle:", error);
    throw error;
  }
}

/**
 * Resolve a simple battle between two agents
 * @param gameId - The game ID
 * @param winnerId - The ID of the winning agent
 * @param loserId - The ID of the losing agent
 * @param tokenPercentage - The percentage of tokens to transfer (1-100)
 */
export async function resolveSimpleBattle(
  gameId: number,
  winnerId: number,
  loserId: number,
  tokenPercentage: number,
  loserAuthority: PublicKey,
  winnerTokenAccount: PublicKey,
  loserTokenAccount: PublicKey
): Promise<{ tx: string }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [winnerPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(winnerId)
    );
    const [loserPda] = getAgentPDA(program.programId, gamePda, new BN(loserId));

    // Execute battle resolution on-chain
    const tx = await program.methods
      .resolveBattleSimple(new BN(tokenPercentage))
      .accounts({
        winner: winnerPda,
        loser: loserPda,
        winnerToken: winnerTokenAccount,
        loserToken: loserTokenAccount,
        loserAuthority: loserAuthority,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Simple battle resolved between agents ${winnerId} and ${loserId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to resolve simple battle:", error);
    throw error;
  }
}

/**
 * Start a battle between an agent and an alliance
 * @param gameId - The game ID
 * @param attackerId - The ID of the attacking agent
 * @param allianceLeaderId - The ID of the alliance leader
 * @param alliancePartnerId - The ID of the alliance partner
 */
export async function startAgentVsAllianceBattle(
  gameId: number,
  attackerId: number,
  allianceLeaderId: number,
  alliancePartnerId: number
): Promise<{ tx: string }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [attackerPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(attackerId)
    );
    const [leaderPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceLeaderId)
    );
    const [partnerPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(alliancePartnerId)
    );

    // Execute battle start on-chain
    const tx = await program.methods
      .startBattleAgentVsAlliance()
      .accounts({
        attacker: attackerPda,
        allianceLeader: leaderPda,
        alliancePartner: partnerPda,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Agent vs Alliance battle started between agent ${attackerId} and alliance ${allianceLeaderId}-${alliancePartnerId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to start agent vs alliance battle:", error);
    throw error;
  }
}

/**
 * Resolve a battle between an agent and an alliance
 * @param gameId - The game ID
 * @param singleAgentId - The ID of the single agent
 * @param allianceLeaderId - The ID of the alliance leader
 * @param alliancePartnerId - The ID of the alliance partner
 * @param tokenPercentage - The percentage of tokens to transfer (1-100)
 * @param singleAgentWins - Whether the single agent wins
 */
export async function resolveAgentVsAllianceBattle(
  gameId: number,
  singleAgentId: number,
  allianceLeaderId: number,
  alliancePartnerId: number,
  tokenPercentage: number,
  singleAgentWins: boolean,
  singleAgentAuthority: PublicKey,
  allianceLeaderAuthority: PublicKey,
  alliancePartnerAuthority: PublicKey,
  singleAgentToken: PublicKey,
  allianceLeaderToken: PublicKey,
  alliancePartnerToken: PublicKey
): Promise<{ tx: string }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [singleAgentPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(singleAgentId)
    );
    const [leaderPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceLeaderId)
    );
    const [partnerPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(alliancePartnerId)
    );

    // Execute battle resolution on-chain
    const tx = await program.methods
      .resolveBattleAgentVsAlliance(new BN(tokenPercentage), singleAgentWins)
      .accounts({
        singleAgent: singleAgentPda,
        allianceLeader: leaderPda,
        alliancePartner: partnerPda,
        singleAgentToken,
        allianceLeaderToken,
        alliancePartnerToken,
        singleAgentAuthority,
        allianceLeaderAuthority,
        alliancePartnerAuthority,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Agent vs Alliance battle resolved between agent ${singleAgentId} and alliance ${allianceLeaderId}-${alliancePartnerId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to resolve agent vs alliance battle:", error);
    throw error;
  }
}

/**
 * Start a battle between two alliances
 * @param gameId - The game ID
 * @param allianceALeaderId - The ID of alliance A's leader
 * @param allianceAPartnerId - The ID of alliance A's partner
 * @param allianceBLeaderId - The ID of alliance B's leader
 * @param allianceBPartnerId - The ID of alliance B's partner
 */
export async function startAllianceVsAllianceBattle(
  gameId: number,
  allianceALeaderId: number,
  allianceAPartnerId: number,
  allianceBLeaderId: number,
  allianceBPartnerId: number
): Promise<{ tx: string }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [leaderAPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceALeaderId)
    );
    const [partnerAPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceAPartnerId)
    );
    const [leaderBPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceBLeaderId)
    );
    const [partnerBPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceBPartnerId)
    );

    // Execute battle start on-chain
    const tx = await program.methods
      .startBattleAlliances()
      .accounts({
        leaderA: leaderAPda,
        partnerA: partnerAPda,
        leaderB: leaderBPda,
        partnerB: partnerBPda,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Alliance vs Alliance battle started between alliances ${allianceALeaderId}-${allianceAPartnerId} and ${allianceBLeaderId}-${allianceBPartnerId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to start alliance vs alliance battle:", error);
    throw error;
  }
}

/**
 * Resolve a battle between two alliances
 * @param gameId - The game ID
 * @param allianceALeaderId - The ID of alliance A's leader
 * @param allianceAPartnerId - The ID of alliance A's partner
 * @param allianceBLeaderId - The ID of alliance B's leader
 * @param allianceBPartnerId - The ID of alliance B's partner
 * @param tokenPercentage - The percentage of tokens to transfer (1-100)
 * @param allianceAWins - Whether alliance A wins
 */
export async function resolveAllianceVsAllianceBattle(
  gameId: number,
  allianceALeaderId: number,
  allianceAPartnerId: number,
  allianceBLeaderId: number,
  allianceBPartnerId: number,
  tokenPercentage: number,
  allianceAWins: boolean,
  leaderAAuthority: PublicKey,
  partnerAAuthority: PublicKey,
  leaderBAuthority: PublicKey,
  partnerBAuthority: PublicKey,
  leaderAToken: PublicKey,
  partnerAToken: PublicKey,
  leaderBToken: PublicKey,
  partnerBToken: PublicKey
): Promise<{ tx: string }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Battle service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [leaderAPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceALeaderId)
    );
    const [partnerAPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceAPartnerId)
    );
    const [leaderBPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceBLeaderId)
    );
    const [partnerBPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(allianceBPartnerId)
    );

    // Execute battle resolution on-chain
    const tx = await program.methods
      .resolveBattleAllianceVsAlliance(new BN(tokenPercentage), allianceAWins)
      .accounts({
        leaderA: leaderAPda,
        partnerA: partnerAPda,
        leaderB: leaderBPda,
        partnerB: partnerBPda,
        leaderAToken,
        partnerAToken,
        leaderBToken,
        partnerBToken,
        leaderAAuthority,
        partnerAAuthority,
        leaderBAuthority,
        partnerBAuthority,
        authority: program.provider.publicKey,
      })
      .rpc();

    logger.info(
      `⚔️ Alliance vs Alliance battle resolved between alliances ${allianceALeaderId}-${allianceAPartnerId} and ${allianceBLeaderId}-${allianceBPartnerId}`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to resolve alliance vs alliance battle:", error);
    throw error;
  }
}

// /**
//  * Set an agent's cooldown time
//  * @param gameId - The game ID
//  * @param agentId - The ID of the agent
//  * @param cooldownTime - The cooldown timestamp
//  */
// export async function setAgentCooldown(
//   gameId: number,
//   agentId: number,
//   cooldownTime: number
// ): Promise<{ tx: string }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Battle service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

//     // Execute cooldown set on-chain
//     const tx = await program.methods
//       .setAgentCooldown(new BN(cooldownTime))
//       .accounts({
//         agent: agentPda,
//         authority: program.provider.publicKey,
//       })
//       .rpc();

//     logger.info(`⏲️ Cooldown set for agent ${agentId} to ${cooldownTime}`);
//     return { tx };
//   } catch (error) {
//     logger.error("Failed to set agent cooldown:", error);
//     throw error;
//   }
// }
