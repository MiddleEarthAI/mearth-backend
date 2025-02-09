import cors from "cors";
import express from "express";
import helmet from "helmet";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import router from "./routes";
import { GameOrchestrator } from "./agent/GameOrchestrator";
import { BattleResolver } from "./agent/BattleResolver";
import EventEmitter from "events";
import { InfluenceCalculator } from "./agent/InfluenceCalculator";
import CacheManager from "./agent/CacheManager";
import TwitterManager from "./agent/TwitterManager";
import { DecisionEngine } from "./agent/DecisionEngine";

import { checkDatabaseConnection } from "./utils";
import { getProgramWithWallet } from "./utils/program";
import { PrismaClient } from "@prisma/client";
import { ActionManager } from "./agent/ActionManager";
import { GameManager } from "./agent/GameManager";
import { serverConfig } from "./config/env";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);
// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate limiting
app.use(defaultRateLimiter);

app.use("/api", router);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", {
      error: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message,
    });
  }
);

export async function startServer() {
  await checkDatabaseConnection();

  const program = await getProgramWithWallet();
  const prisma = new PrismaClient();
  const gameManager = new GameManager(program, prisma);
  const gameInfo = await gameManager.getOrCreateActiveGame();
  if (!gameInfo) {
    console.error("No active game found");
    process.exit(1);
  }

  const twitter = new TwitterManager(gameInfo.agents);
  const cache = new CacheManager();
  const calculator = new InfluenceCalculator();
  const eventEmitter = new EventEmitter();

  const battleResolver = new BattleResolver(program, gameManager, prisma);
  const actionManager = new ActionManager(
    program,
    gameInfo.gameAccount.gameId,
    prisma
  );
  const engine = new DecisionEngine(prisma, eventEmitter, program);

  const orchestrator = new GameOrchestrator(
    gameInfo.gameAccount.gameId,
    gameInfo.agents[0].agent.gameId,
    actionManager,
    twitter,
    cache,
    calculator,
    engine,
    prisma,
    eventEmitter,
    battleResolver
  );

  try {
    await orchestrator.start();
  } catch (error) {
    console.error("Failed to start system", { error });
    process.exit(1);
  }

  try {
    const server = app.listen(serverConfig.port, () => {
      console.info(
        `Server running on port ${serverConfig.port} in development mode`
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.info("Shutting down server...");

      server.close(async () => {
        console.info("HTTP server closed");

        try {
          await prisma.$disconnect();
          console.info("Database connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10s
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();
