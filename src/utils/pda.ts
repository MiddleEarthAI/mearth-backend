import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const getGamePDA = (programId: PublicKey, gameId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game"), new BN(gameId).toArrayLike(Buffer, "le", 4)],
    programId
  );
};

export const getAgentPDA = (
  programId: PublicKey,
  gamePDA: PublicKey,
  agentId: number
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), gamePDA.toBuffer(), Buffer.from([agentId])],
    programId
  );
};

export const getStakeInfoPDA = (
  programId: PublicKey,
  agentPDA: PublicKey,
  authority: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), agentPDA.toBuffer(), authority.toBuffer()],
    programId
  );
};
