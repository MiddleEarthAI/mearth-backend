import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Agent, type AgentConfig } from "./agent";
import { config } from "./config";
import { prisma } from "./config/prisma";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import { gameRoutes } from "./routes/game.routes";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(defaultRateLimiter); // Apply rate limiting globally

// Routes
app.use("/game", gameRoutes);

// Health check endpoint for deployment
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get system status
    const [agentsCount, activeAgents] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({ where: { status: "ACTIVE" } }),
    ]);

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: "connected",
      agents: {
        total: agentsCount,
        active: activeAgents,
      },
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "System health check failed";
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

function createAgent(agentId: string, agentConfig: AgentConfig) {
  return new Agent(agentConfig, agentId);
}

const startAgents = async () => {
  const agents = await prisma.agent.findMany();
  if (!agents) {
    logger.error("No agents found");
    throw new Error("No agents found");
  }

  const agentRuntimes = await Promise.all(
    agents.map(async (agent) => {
      const username =
        process.env[`${agent.characterType.toUpperCase()}_USERNAME`]!;
      const password =
        process.env[`${agent.characterType.toUpperCase()}_PASSWORD`]!;
      const email = process.env[`${agent.characterType.toUpperCase()}_EMAIL`]!;
      const twitter2faSecret =
        process.env[`${agent.characterType.toUpperCase()}_TWITTER_2FA_SECRET`]!;

      const agentConfig: AgentConfig = {
        username,
        password,
        email,
        twitter2faSecret,
      };

      if (!agentConfig.password || !agentConfig.username) {
        logger.error(`Agent ${agent.characterType} credentials not configured`);
        throw new Error(
          `Agent ${agent.characterType} credentials not configured`
        );
      }

      const agentRuntime = createAgent(agent.id, agentConfig);
      await agentRuntime.start();
      return agentRuntime;
    })
  );

  return agentRuntimes;
};

let agentRuntimes: Agent[] = [];

// Graceful shutdown
async function shutdown() {
  logger.info("Initiating graceful shutdown...");

  // Stop all agents
  for (const agent of agentRuntimes) {
    try {
      agent.stop();
      logger.info(`Stopped agent ${agent.agentId}`);
    } catch (error) {
      logger.error(`Error stopping agent ${agent.agentId}:`, error);
    }
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

// Start server
async function startServer() {
  try {
    const runtimes = await startAgents();
    agentRuntimes = runtimes;

    app.listen(config.app.port, () => {
      logger.info(
        `⚡️[server]: Server is running on http://localhost:${config.app.port}`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
