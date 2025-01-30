import { logger } from "@/utils/logger";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { AgentManager } from "./agent/AgentManager";
import { prisma } from "./config/prisma";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import router from "./routes";
import { setup } from "./config/setup";

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
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 3000;

export async function startServer() {
  try {
    await setup();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

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

startServer();
