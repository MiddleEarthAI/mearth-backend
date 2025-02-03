import { PrismaClient } from "@prisma/client";
import EventEmitter from "events";
import TwitterManager from "./TwitterManager";
import { InfluenceCalculator } from "./InfluenceCalculator";
import { NLPManager } from "./NlpManager";
import { DecisionEngine } from "./DecisionEngine";
import GameOrchestrator from "./GameOrchestrator";
import { HealthMonitor } from "./HealthMonitor";
import { logger } from "@/utils/logger";
import CacheManager from "./CacheManager";

// Initialize and start the system
async function main() {
  const prisma = new PrismaClient();
  const eventEmitter = new EventEmitter();
  const cache = new CacheManager();
  const twitter = new TwitterManager();
  const nlp = new NLPManager();
  const calculator = new InfluenceCalculator(nlp);
  const engine = new DecisionEngine(prisma, eventEmitter);

  const orchestrator = new GameOrchestrator(
    twitter,
    cache,
    calculator,
    engine,
    prisma,
    eventEmitter
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
}

// Start the system
main().catch((error) => {
  logger.error("Fatal error", { error });
  process.exit(1);
});
