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
