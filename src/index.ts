import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { Container } from "./container";
import { AgentManagerService } from "./services/agentManager.service";
import { logger } from "./utils/logger";
import { config } from "./config";

const app = express();
const container = Container.getInstance();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

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
async function shutdown() {
  logger.info("Shutting down gracefully...");
  try {
    await container.dispose();
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
async function startServer() {
  try {
    const agentManager = container.get<AgentManagerService>("agentManager");
    await agentManager.start();

    app.listen(config.app.port, () => {
      logger.info(
        `⚡️[server]: Server is running at http://localhost:${config.app.port}`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
