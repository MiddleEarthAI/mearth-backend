import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { solanaConfig } from "@/config/env";

export async function getMiddleEarthAiAuthorityWallet() {
  const privateKeyString = solanaConfig.middleEarthAiAuthorityPrivateKey;
  if (!privateKeyString) {
    throw new Error("MIDDLE_EARTH_AI_AUTHORITY_PRIVATE_KEY is not set");
  }
  const privateKey = bs58.decode(privateKeyString);
  const keypair = Keypair.fromSecretKey(privateKey);
  return {
    wallet: new anchor.Wallet(keypair),
    keypair,
  };
}

export async function getProgram() {
  // Validate environment variables
  const rpcUrl = solanaConfig.rpcUrl;

  if (!rpcUrl) {
    throw new Error("Missing required environment variables: SOLANA_RPC_URL");
  }
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
  });

  const authorityWallet = await getMiddleEarthAiAuthorityWallet();

  const provider = new anchor.AnchorProvider(
    connection,
    authorityWallet.wallet,
    {
      commitment: "confirmed",
    }
  );

  const program = new anchor.Program(
    mearthIdl as MiddleEarthAiProgram,
    provider
  );

  return program;
}

// export async function getAgentAuthorityAta(agentOnchainId: number) {
//   const mearthTokenMint = solanaConfig.tokenMint;

//   if (!mearthTokenMint) {
//     throw new Error("MEARTH_TOKEN_MINT is not set");
//   }
//   const agentAuthorityKeypair = await getAgentAuthorityKeypair(agentOnchainId);
//   const mintPubKey = new PublicKey(mearthTokenMint);
//   const conn = connection();
//   const ata = await getOrCreateAssociatedTokenAccount(
//     conn,
//     agentAuthorityKeypair,
//     mintPubKey,
//     agentAuthorityKeypair.publicKey,
//     false
//   );

//   return ata;
// }

export const connection = () => {
  const rpcUrl = solanaConfig.rpcUrl;
  if (!rpcUrl) {
    throw new Error("SOLANA_RPC_URL is not set");
  }
  return new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120000, // 2 minutes
  });
};

export async function getAgentAuthorityKeypair(agentOnchainId: number) {
  let privateKeyString = "";
  switch (agentOnchainId) {
    case 1:
      privateKeyString = solanaConfig.agentAuthority1;
      break;
    case 2:
      privateKeyString = solanaConfig.agentAuthority2;
      break;
    case 3:
      privateKeyString = solanaConfig.agentAuthority3;
      break;
    case 4:
      privateKeyString = solanaConfig.agentAuthority4;
      break;
    default:
      throw new Error(`Invalid agent onchain ID: ${agentOnchainId}`);
  }

  if (!privateKeyString) {
    throw new Error(`AGENT_AUTHORITY_${agentOnchainId} is not set`);
  }

  const privateKey = bs58.decode(privateKeyString);
  const keypair = Keypair.fromSecretKey(privateKey);
  return keypair;
}

export async function getAgentVault(agentOnchainId: number) {
  const agentAuthorityKeypair = await getAgentAuthorityKeypair(agentOnchainId);
  const agentVault = await getOrCreateAssociatedTokenAccount(
    connection(),
    agentAuthorityKeypair,
    new PublicKey(solanaConfig.tokenMint),
    agentAuthorityKeypair.publicKey,
    false
  );
  return agentVault;
}

export async function getRewardsVault() {
  const mearthTokenMint = solanaConfig.tokenMint;

  if (!mearthTokenMint) {
    throw new Error("MEARTH_TOKEN_MINT is not set");
  }

  const gameAuthorityKeypair = await getMiddleEarthAiAuthorityWallet();
  const mintPubKey = new PublicKey(mearthTokenMint);
  const conn = connection();
  const ata = await getOrCreateAssociatedTokenAccount(
    conn,
    gameAuthorityKeypair.keypair,
    mintPubKey,
    gameAuthorityKeypair.keypair.publicKey,
    false
  );

  return ata;
}
