import { logger } from "@/utils/logger";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import cors from "cors";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import express from "express";
import helmet from "helmet";
import { prisma } from "./config/prisma";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import router from "./routes";
import { initializeServices } from "./services";
import { AgentManager } from "./services/AgentManager";
import { mearthIdl } from "./constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "./constants/middle_earth_ai_program";
import { getProgram } from "./services/utils";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(defaultRateLimiter);

// Routes
app.use(router);

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 3000;

// Graceful shutdown
async function shutdown() {
  logger.info("Initiating graceful shutdown...");

  // Stop all agents
  try {
    const agentManager = AgentManager.getInstance();
    await agentManager.shutdown();
    logger.info("All agents stopped");
  } catch (error) {
    logger.error("Error stopping agents:", error);
  }

  // Close database connection
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
  }

  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export async function startServer() {
  try {
    await initializeApp();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

/**
 * Initialize the application
 */
export async function initializeApp(): Promise<void> {
  try {
    // Initialize Solana connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error(
        "Defined SOLANA_RPC_URL environment variable is required"
      );
    }
    const connection = new Connection(rpcUrl, "confirmed");

    // Initialize wallet from private key
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;

    if (!privateKeyString) {
      throw new Error("WALLET_PRIVATE_KEY environment variable is required");
    }
    const privateKey = bs58.decode(privateKeyString);
    const keypair = Keypair.fromSecretKey(privateKey);

    logger.info("authority publicKey: ", keypair.publicKey.toBase58());
    const wallet = new anchor.Wallet(keypair);

    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const program = await getProgram(provider);

    const gameAccounts = await program.account.game.all();
    logger.info("gameAccounts: ", JSON.stringify(gameAccounts, null, 2));

    const latestGame = gameAccounts.sort((a, b) =>
      b.account.gameId.sub(a.account.gameId).toNumber()
    )[0];

    if (!latestGame) {
      throw new Error("No game found");
    }

    logger.info("latestGame: ", JSON.stringify(latestGame, null, 2));

    // Initialize services
    await initializeServices(connection, program);

    // Initialize and start agents
    const agentManager = AgentManager.getInstance();
    await agentManager.initialize(latestGame.account.gameId.toNumber());

    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application:", error);
    throw error;
  }
}

startServer();
