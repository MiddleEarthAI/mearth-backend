import { Connection, Keypair } from "@solana/web3.js";
import { logger } from "./logger";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";

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
    confirmTransactionInitialTimeout: 60000,
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
