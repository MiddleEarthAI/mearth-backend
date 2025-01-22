import express, { type Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { routes } from "./routes";
import { AgentBehaviorJob } from "./jobs/agentBehavior";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const agentBehaviorJob = new AgentBehaviorJob();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize agents if needed
async function initializeAgents() {
  const agentCount = await prisma.agent.count();
  if (agentCount === 0) {
    console.log("Initializing agents...");
    await prisma.agent.createMany({
      data: [
        {
          type: "SCOOTLES",
          name: "Scootles",
          positionX: 0,
          positionY: 0,
          twitterHandle: process.env.SCOOTLES_TWITTER_HANDLE || "",
          aggressiveness: 80,
          alliancePropensity: 40,
          influenceability: 50,
        },
        {
          type: "PURRLOCK_PAWS",
          name: "Purrlock Paws",
          positionX: 30,
          positionY: 30,
          twitterHandle: process.env.PURRLOCK_TWITTER_HANDLE || "",
          aggressiveness: 60,
          alliancePropensity: 20,
          influenceability: 30,
        },
        {
          type: "SIR_GULLIHOP",
          name: "Sir Gullihop",
          positionX: -30,
          positionY: 30,
          twitterHandle: process.env.GULLIHOP_TWITTER_HANDLE || "",
          aggressiveness: 30,
          alliancePropensity: 90,
          influenceability: 70,
        },
        {
          type: "WANDERLEAF",
          name: "Wanderleaf",
          positionX: 0,
          positionY: -30,
          twitterHandle: process.env.WANDERLEAF_TWITTER_HANDLE || "",
          aggressiveness: 40,
          alliancePropensity: 50,
          influenceability: 90,
        },
      ],
    });
    console.log("Agents initialized successfully");
  }
}

// Start server
async function startServer() {
  try {
    await initializeAgents();
    await agentBehaviorJob.start();

    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
