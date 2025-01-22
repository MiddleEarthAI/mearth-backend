import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { AgentManagerService } from "./services/agentManager.service";
import { gameRoutes } from "./routes/game.routes";
import { logger } from "./utils/logger";

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const agentManager = new AgentManagerService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// Routes
app.use("/api/game", gameRoutes);

// Error handling middleware
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

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info("Shutting down server...");

  try {
    await agentManager.stop();
    await prisma.$disconnect();
    logger.info("Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server and agent manager
async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    await agentManager.start();

    app.listen(port, () => {
      logger.info(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
