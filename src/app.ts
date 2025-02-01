import { logger } from "@/utils/logger";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { prisma } from "./config/prisma";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import router from "./routes";
import { config } from "dotenv";

// Load environment variables
config();

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
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Starting graceful shutdown...");
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Starting graceful shutdown...");
  prisma.$disconnect();
  process.exit(0);
});

startServer();
