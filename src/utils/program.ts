import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { logger } from "./logger";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

export async function getWallet() {
  const privateKeyString = process.env.WALLET_PRIVATE_KEY;
  if (!privateKeyString) {
    throw new Error("WALLET_PRIVATE_KEY is not set");
  }
  const privateKey = bs58.decode(privateKeyString);
  const keypair = Keypair.fromSecretKey(privateKey);
  return {
    wallet: new anchor.Wallet(keypair),
    keypair,
  };
}

export async function getProgramWithWallet() {
  // Validate environment variables
  const rpcUrl = process.env.SOLANA_RPC_URL;

  const privateKeyString = process.env.WALLET_PRIVATE_KEY;

  if (!rpcUrl || !privateKeyString) {
    throw new Error(
      "Missing required environment variables: SOLANA_RPC_URL or WALLET_PRIVATE_KEY"
    );
  }
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120000, // 2 minutes
  });

  const privateKey = bs58.decode(privateKeyString);
  const keypair = Keypair.fromSecretKey(privateKey);
  logger.info("🔑 Authority wallet initialized", {
    publicKey: keypair.publicKey.toBase58(),
  });

  // Set up Anchor with optimized configuration
  const wallet = new anchor.Wallet(keypair);

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  logger.info("⚓ Anchor provider configured", {
    commitment: provider.connection.commitment,
    wallet: wallet.publicKey.toBase58(),
  });

  const program = new anchor.Program(
    mearthIdl as MiddleEarthAiProgram,
    provider
  );

  return program;
}

export async function getAgentAta(agentPda: PublicKey) {
  const mearthTokenMint = process.env.MEARTH_TOKEN_MINT;
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!mearthTokenMint || !rpcUrl) {
    throw new Error("MEARTH_TOKEN_MINT or SOLANA_RPC_URL is not set");
  }
  const wallet = await getWallet();
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120000, // 2 minutes
  });

  const mearthTokenMintKey = new PublicKey(mearthTokenMint);

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.keypair,
    mearthTokenMintKey,
    new PublicKey(agentPda),
    false
  );
  return ata;
}
