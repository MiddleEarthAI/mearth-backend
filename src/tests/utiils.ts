import { solanaConfig } from "@/config/env";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { PublicKey } from "@solana/web3.js";

import { Connection } from "@solana/web3.js";

export async function requestAirdrop(publicKey: PublicKey, amount: number = 1) {
  const rpcUrl = solanaConfig.rpcUrl;
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120000, // 2 minutes
  });
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log(`Airdropped ${amount} SOL to ${publicKey.toString()}`);
  } catch (error) {
    console.error("Airdrop failed:", error);
    throw error;
  }
}

export async function mintMearthTokens(
  authority: Keypair,
  recipient: PublicKey,
  amount: number
) {
  const mint = new PublicKey(solanaConfig.tokenMint);
  const connection = new Connection(solanaConfig.rpcUrl, "confirmed");
  try {
    // Get or create recipient's token account
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      mint,
      recipient
    );
    // Mint tokens
    await mintTo(
      connection,
      authority,
      mint,
      recipientAta.address,
      authority,
      amount
    );

    console.log(`Minted ${amount} MEARTH tokens to ${recipient.toString()}`);
    return { mint, recipientAta };
  } catch (error) {
    console.error("Token minting failed:", error);
    throw error;
  }
}
