import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./utils/logger";
import { config } from "./config";
import { Agent, AgentConfig } from "./agent";
import { prisma } from "./config/prisma";
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

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
    console.log("agent is runing");
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
        logger.error(
          `Agent ${agent.characterType} password or username is not set`
        );
        throw new Error(
          `Agent ${agent.characterType} password or username is not set`
        );
      }
      const agentRuntime = createAgent(agent.id, agentConfig);
      agentRuntime.start();
      return agentRuntime;
    })
  );

  return agentRuntimes;
};

let agentRuntimesOutside: Agent[] = [];

// Graceful shutdown
async function shutdown() {
  agentRuntimesOutside.forEach((agent) => {
    agent.stop();
  });
  logger.info("Shutting down gracefully...");
  try {
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
    const agentRuntimes = await startAgents();
    agentRuntimesOutside = agentRuntimes;
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

app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Database connection failed";
    res.status(500).json({
      status: "unhealthy",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

startServer();
