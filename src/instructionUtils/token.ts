// import { prisma } from "@/config/prisma";
// import { logger } from "@/utils/logger";
// import { Program, BN } from "@coral-xyz/anchor";
// import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
// import { getAgentPDA, getGamePDA, getStakeInfoPDA } from "@/utils/pda";
// import { PublicKey, SystemProgram } from "@solana/web3.js";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { getProgramWithWallet } from "@/utils/program";

// /**
//  * Initialize staking for an agent
//  * @param gameId - The game ID
//  * @param agentId - The agent ID
//  * @param amount - Amount of tokens to stake
//  * @param stakerSource - Staker's token account
//  * @param agentVault - Agent's vault account
//  */
// export async function initializeStake(
//   gameId: number,
//   agentId: number,
//   amount: number,
//   stakerSource: PublicKey,
//   agentVault: PublicKey
// ): Promise<{ tx: string; stakeInfo: any }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const [stakeInfoPda] = getStakeInfoPDA(
//       program.programId,
//       agentPda,
//       program.provider.publicKey!
//     );

//     // Execute stake initialization on-chain
//     const tx = await program.methods
//       .initializeStake(new BN(amount))
//       .accounts({
//         agent: agentPda,
//         stakeInfo: stakeInfoPda,
//         stakerSource: stakerSource,
//         agentVault: agentVault,
//         authority: program.provider.publicKey!,
//         systemProgram: SystemProgram.programId,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     // Create stake record in database
//     const stakeInfo = await prisma.stakeInfo.create({
//       data: {
//         id: stakeInfoPda.toBase58(),
//         amount,
//         shares: amount, // Initial shares equal amount
//         isInitialized: true,
//         cooldownEndsAt: null,
//         lastRewardTimestamp: new Date(),
//         agent: { connect: { id: agentId.toString() } },
//         staker: program.provider.publicKey.toBase58(),
//       },
//     });

//     logger.info(
//       `🥩 Initialized stake of ${amount} tokens for agent ${agentId}`
//     );
//     return { tx, stakeInfo };
//   } catch (error) {
//     logger.error("Failed to initialize stake:", error);
//     throw error;
//   }
// }

// /**
//  * Stake additional tokens
//  * @param gameId - The game ID
//  * @param agentId - The agent ID
//  * @param amount - Amount of tokens to stake
//  * @param stakerSource - Staker's token account
//  * @param agentVault - Agent's vault account
//  */
// export async function stakeTokens(
//   gameId: number,
//   agentId: number,
//   amount: number,
//   stakerSource: PublicKey,
//   agentVault: PublicKey
// ): Promise<{ tx: string; stakeInfo: any }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const [stakeInfoPda] = getStakeInfoPDA(
//       program.programId,
//       agentPda,
//       program.provider.publicKey!
//     );

//     // Execute stake on-chain
//     const tx = await program.methods
//       .stakeTokens(new BN(amount))
//       .accounts({
//         agent: agentPda,
//         game: gamePda,
//         stakeInfo: stakeInfoPda,
//         stakerSource: stakerSource,
//         agentVault: agentVault,
//         authority: program.provider.publicKey,
//         systemProgram: SystemProgram.programId,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     // Update stake info in database
//     const stakeInfo = await prisma.stakeInfo.update({
//       where: { id: stakeInfoPda.toBase58() },
//       data: {
//         amount: { increment: amount },
//         shares: { increment: amount }, // Simplified share calculation
//       },
//     });

//     logger.info(`🥩 Staked additional ${amount} tokens for agent ${agentId}`);
//     return { tx, stakeInfo };
//   } catch (error) {
//     logger.error("Failed to stake tokens:", error);
//     throw error;
//   }
// }

// /**
//  * Initiate cooldown for unstaking
//  * @param gameId - The game ID
//  * @param agentId - The agent ID
//  */
// export async function initiateCooldown(
//   gameId: number,
//   agentId: number
// ): Promise<{ tx: string; stakeInfo: any }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const [stakeInfoPda] = getStakeInfoPDA(
//       program.programId,
//       agentPda,
//       program.provider.publicKey
//     );

//     // Execute cooldown initiation on-chain
//     const tx = await program.methods
//       .initiateCooldown()
//       .accounts({
//         agent: agentPda,
//         game: gamePda,
//         stakeInfo: stakeInfoPda,
//         authority: program.provider.publicKey,
//         systemProgram: SystemProgram.programId,
//       })
//       .rpc();

//     // Set cooldown in database
//     const cooldownEndsAt = new Date();
//     cooldownEndsAt.setHours(cooldownEndsAt.getHours() + 2); // 2-hour cooldown

//     const stakeInfo = await prisma.stakeInfo.update({
//       where: { id: stakeInfoPda.toBase58() },
//       data: {
//         cooldownEndsAt,
//       },
//     });

//     logger.info(`⏲️ Cooldown initiated for agent ${agentId}`);
//     return { tx, stakeInfo };
//   } catch (error) {
//     logger.error("Failed to initiate cooldown:", error);
//     throw error;
//   }
// }

// /**
//  * Unstake tokens
//  * @param gameId - The game ID
//  * @param agentId - The agent ID
//  * @param shares - Number of shares to unstake
//  * @param stakerDestination - Staker's token account
//  * @param agentVault - Agent's vault account
//  * @param gameAuthority - Game authority public key
//  */
// export async function unstakeTokens(
//   gameId: number,
//   agentId: number,
//   shares: number,
//   stakerDestination: PublicKey,
//   agentVault: PublicKey,
//   gameAuthority: PublicKey
// ): Promise<{ tx: string; stakeInfo: any }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const [stakeInfoPda] = getStakeInfoPDA(
//       program.programId,
//       agentPda,
//       program.provider.publicKey
//     );

//     // Execute unstake on-chain
//     const tx = await program.methods
//       .unstakeTokens(new BN(shares))
//       .accounts({
//         agent: agentPda,
//         game: gamePda,
//         stakeInfo: stakeInfoPda,
//         agentVault: agentVault,
//         stakerDestination: stakerDestination,
//         authority: program.provider.publicKey,
//         gameAuthority: gameAuthority,
//         systemProgram: SystemProgram.programId,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     // Update stake info in database
//     const stakeInfo = await prisma.stakeInfo.update({
//       where: { id: stakeInfoPda.toBase58() },
//       data: {
//         shares: { decrement: shares },
//         // Amount will be updated after fetching the actual unstaked amount
//         cooldownEndsAt: null,
//       },
//     });

//     logger.info(`🔓 Unstaked ${shares} shares for agent ${agentId}`);
//     return { tx, stakeInfo };
//   } catch (error) {
//     logger.error("Failed to unstake tokens:", error);
//     throw error;
//   }
// }

// /**
//  * Claim staking rewards
//  * @param gameId - The game ID
//  * @param agentId - The agent ID
//  * @param stakerDestination - Staker's token account
//  * @param rewardsVault - Rewards vault account
//  * @param rewardsAuthority - Rewards authority public key
//  */
// export async function claimStakingRewards(
//   gameId: number,
//   agentId: number,
//   stakerDestination: PublicKey,
//   rewardsVault: PublicKey,
//   rewardsAuthority: PublicKey
// ): Promise<{ tx: string }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const [stakeInfoPda] = getStakeInfoPDA(
//       program.programId,
//       agentPda,
//       program.provider.publicKey
//     );

//     // Execute claim rewards on-chain
//     const tx = await program.methods
//       .claimStakingRewards()
//       .accounts({
//         agent: agentPda,
//         game: gamePda,
//         stakeInfo: stakeInfoPda,
//         rewardsVault: rewardsVault,
//         rewardsAuthority: rewardsAuthority,
//         stakerDestination: stakerDestination,
//         authority: program.provider.publicKey,
//         systemProgram: SystemProgram.programId,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     // Update last reward claim timestamp
//     await prisma.stakeInfo.update({
//       where: { id: stakeInfoPda.toBase58() },
//       data: {
//         lastRewardTimestamp: new Date(),
//       },
//     });

//     logger.info(`💰 Claimed staking rewards for agent ${agentId}`);
//     return { tx };
//   } catch (error) {
//     logger.error("Failed to claim rewards:", error);
//     throw error;
//   }
// }

// /**
//  * Update daily rewards
//  * @param gameId - The game ID
//  * @param dailyRewards - New daily reward amount
//  * @param gameAuthority - Game authority public key
//  */
// export async function updateDailyRewards(
//   gameId: number,
//   dailyRewards: number,
//   gameAuthority: PublicKey
// ): Promise<{ tx: string }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Token service not initialized");
//     }

//     // Get game PDA
//     const [gamePda] = getGamePDA(program.programId, gameId);

//     // Execute update on-chain
//     const tx = await program.methods
//       .updateDailyRewards(new BN(dailyRewards))
//       .accounts({
//         game: gamePda,
//         authority: gameAuthority,
//       })
//       .rpc();

//     // Update game info in database
//     await prisma.game.update({
//       where: { id: gameId.toString() },
//       data: {
//         dailyRewardTokens: dailyRewards,
//       },
//     });

//     logger.info(`📈 Updated daily rewards to ${dailyRewards}`);
//     return { tx };
//   } catch (error) {
//     logger.error("Failed to update daily rewards:", error);
//     throw error;
//   }
// }
