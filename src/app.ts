import { logger } from "@/utils/logger";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import router from "./routes";
import { HealthMonitor } from "./agent/HealthMonitor";
import { AgentId } from "./agent/TwitterManager";
import { GameOrchestrator } from "./agent/GameOrchestrator";
import { BattleResolver } from "./agent/BattleResolver";
import EventEmitter from "events";
import { InfluenceCalculator } from "./agent/InfluenceCalculator";
import CacheManager from "./agent/CacheManager";
import TwitterManager from "./agent/TwitterManager";
import { DecisionEngine } from "./agent/DecisionEngine";
import TwitterApi from "twitter-api-v2";
import { createNextGame } from "./config/setup";
import { checkDatabaseConnection } from "./utils";
import { getProgramWithWallet } from "./utils/program";
import { PrismaClient } from "@prisma/client";
import { BN } from "@coral-xyz/anchor";
import { ActionManager } from "./agent/ActionManager";

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
    logger.error("Unhandled error:", {
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

const PORT = process.env.PORT || 3001;

export async function startServer() {
  await checkDatabaseConnection();

  const { gameAccount, agents } = await createNextGame();
  const program = await getProgramWithWallet();
  const prisma = new PrismaClient();

  const _twitterClients = new Map<AgentId, TwitterApi>();
  agents.forEach((agent) => {
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;

    if (!appKey || !appSecret) {
      throw new Error("Twitter AppKey and AppSecret are not set");
    }

    const agentId = new BN(agent.account.id).toString() as AgentId;
    console.log(
      "agentId:🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥",
      agentId
    );
    const accessToken = process.env[`TWITTER_ACCESS_TOKEN_${agentId}`];
    const accessSecret = process.env[`TWITTER_ACCESS_SECRET_${agentId}`];

    if (!accessToken || !accessSecret) {
      throw new Error(
        `Twitter Access Token and Access Secret are not set env key: ${
          process.env[`TWITTER_ACCESS_TOKEN_${agentId}`]
        } ${process.env[`TWITTER_ACCESS_SECRET_${agentId}`]}`
      );
    }
    _twitterClients.set(
      agentId,
      new TwitterApi({
        appKey,
        appSecret,
        accessSecret,
        accessToken,
      })
    );
  });

  const twitter = new TwitterManager(_twitterClients);
  const cache = new CacheManager();
  const calculator = new InfluenceCalculator();
  const eventEmitter = new EventEmitter();
  const engine = new DecisionEngine(prisma, eventEmitter);

  const battleResolver = new BattleResolver(
    gameAccount.gameId,
    program,
    prisma
  );
  const actionManager = new ActionManager(program, gameAccount.gameId, prisma);

  const orchestrator = new GameOrchestrator(
    gameAccount.gameId,
    actionManager,
    twitter,
    cache,
    calculator,
    engine,
    prisma,
    eventEmitter,
    battleResolver
  );

  const healthMonitor = new HealthMonitor(orchestrator, prisma, cache);
  try {
    await orchestrator.start();
    await healthMonitor.startMonitoring();

    logger.info("System started successfully");
  } catch (error) {
    logger.error("Failed to start system", { error });
    process.exit(1);
  }

  try {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in development mode`);
      logger.info(`API available at /api`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await prisma.$disconnect();
          logger.info("Database connection closed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
