import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

/**
 * Get the PDA for a game instance
 * @param programId The program ID
 * @param gameId The game ID
 * @returns [PDA, bump]
 */
export const getGamePDA = (programId: PublicKey, gameId: BN) => {
  const gId = new BN(gameId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game"), gId.toBuffer("le", 4)],
    programId
  );
};

/**
 * Get the PDA for an agent
 * @param programId The program ID
 * @param gamePDA The game PDA
 * @param agentId The agent ID
 * @returns [PDA, bump]
 */
export const getAgentPDA = (
  programId: PublicKey,
  gamePDA: PublicKey,
  agentId: number
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), gamePDA.toBuffer(), Uint8Array.of(agentId)],
    programId
  );
};

/**
 * Get the PDA for an alliance
 * @param programId The program ID
 * @param initiatorPDA The initiator agent PDA
 * @param targetPDA The target agent PDA
 * @returns [PDA, bump]
 */
export const getAlliancePDA = (
  programId: PublicKey,
  initiatorPDA: PublicKey,
  targetPDA: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("alliance"), initiatorPDA.toBuffer(), targetPDA.toBuffer()],
    programId
  );
};

/**
 * Get the PDA for a battle
 * @param programId The program ID
 * @param attackerPDA The attacker agent PDA
 * @param defenderPDA The defender agent PDA
 * @returns [PDA, bump]
 */
export const getBattlePDA = (
  programId: PublicKey,
  attackerPDA: PublicKey,
  defenderPDA: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("battle"), attackerPDA.toBuffer(), defenderPDA.toBuffer()],
    programId
  );
};

/**
 * Get the PDA for an agent's vault
 * @param programId The program ID
 * @param agentPDA The agent PDA
 * @returns [PDA, bump]
 */
export const getAgentVaultPDA = (programId: PublicKey, agentPDA: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), agentPDA.toBuffer()],
    programId
  );
};

/**
 * Get the PDA for rewards vault
 * @param programId The program ID
 * @param gamePDA The game PDA
 * @returns [PDA, bump]
 */
export const getRewardsVaultPDA = (
  programId: PublicKey,
  gamePDA: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), gamePDA.toBuffer()],
    programId
  );
};
