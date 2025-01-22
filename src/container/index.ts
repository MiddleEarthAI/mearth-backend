import { PrismaClient } from "@prisma/client";

import { GameService } from "../services/game.service.js";
import { LLMService } from "../services/llm.service.js";
import { TwitterService } from "../services/twitter.service.js";
import { SolanaService } from "../services/solana.service.js";
import { KeyManagerService } from "../services/keyManager.service.js";
import { AgentManagerService } from "../services/agentManager.service.js";
import { logger } from "../utils/logger.js";
import { config } from "@/config";
import { Config } from "@/config";

export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor(private readonly config: Config) {
    this.initializeServices();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container(config);
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // Initialize Prisma
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.database.url,
        },
      },
    });

    // Initialize core services
    const keyManager = new KeyManagerService(this.config.security, prisma);
    const solanaService = new SolanaService(this.config.solana, keyManager);
    const twitterService = new TwitterService(this.config.twitter);
    const llmService = new LLMService(prisma);
    const gameService = new GameService(prisma);

    // Initialize agent manager
    const agentManager = new AgentManagerService(
      prisma,
      gameService,
      llmService,
      twitterService,
      solanaService
    );

    // Store services
    this.services.set("config", this.config);
    this.services.set("prisma", prisma);
    this.services.set("keyManager", keyManager);
    this.services.set("solana", solanaService);
    this.services.set("twitter", twitterService);
    this.services.set("llm", llmService);
    this.services.set("game", gameService);
    this.services.set("agentManager", agentManager);
  }

  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      const error = `Service ${serviceName} not found in container`;
      logger.error(error);
      throw new Error(error);
    }
    return service as T;
  }

  public async dispose(): Promise<void> {
    const prisma = this.get<PrismaClient>("prisma");
    await prisma.$disconnect();

    const agentManager = this.get<AgentManagerService>("agentManager");
    await agentManager.stop();

    logger.info("All services disposed successfully");
  }
}
