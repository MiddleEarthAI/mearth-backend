import { expect } from "chai";
import { describe, it, before, after, beforeEach } from "mocha";
import { GameOrchestrator } from "@/agent/GameOrchestrator";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { getProgram } from "@/utils/program";
import { DecisionEngine } from "@/agent/DecisionEngine";
import TwitterManager from "@/agent/TwitterManager";
import { GameManager } from "@/agent/GameManager";
import EventEmitter from "events";
import { ActionManager } from "@/agent/actionManager";
import CacheManager from "@/agent/CacheManager";
import { BN } from "@coral-xyz/anchor";

describe("GameOrchestrator", function () {
  let orchestrator: GameOrchestrator;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let decisionEngine: DecisionEngine;
  let twitterManager: TwitterManager;
  let gameManager: GameManager;
  let eventEmitter: EventEmitter;
  let actionManager: ActionManager;
  let cacheManager: CacheManager;

  // Increase timeout for real interactions
  this.timeout(30000);

  beforeEach(async function () {
    console.log("🎮 Game Orchestrator Test Suite Initializing...");

    // Initialize database connection
    prisma = new PrismaClient();
    await prisma.$connect();

    // Get Solana program instance
    program = await getProgram();

    // Initialize event emitter
    eventEmitter = new EventEmitter();

    // Initialize managers
    actionManager = new ActionManager(program);
    twitterManager = new TwitterManager();
    cacheManager = new CacheManager(prisma);
    decisionEngine = new DecisionEngine(prisma, eventEmitter, program);
    gameManager = new GameManager(program, prisma);

    // Create a test game
    const gameInfo = await gameManager.createNewGame();

    // Initialize orchestrator with real game data
    orchestrator = new GameOrchestrator(
      new BN(gameInfo.dbGame.onchainId),
      gameInfo.dbGame.id,
      actionManager,
      twitterManager,
      cacheManager,
      decisionEngine,
      prisma,
      eventEmitter
    );

    console.log("✅ Game Orchestrator Test Suite Initialized with game:", {
      gameId: gameInfo.dbGame.id,
      onchainId: gameInfo.dbGame.onchainId,
    });
  });

  afterEach(async function () {
    // Clean up database
    await prisma.game.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.tweet.deleteMany({});
    await prisma.battle.deleteMany({});
    await prisma.alliance.deleteMany({});

    // Disconnect services
    await prisma.$disconnect();
    await twitterManager.disconnect();

    console.log("🧹 Game Orchestrator Test Suite Cleaned Up");
  });

  describe("Game Lifecycle", function () {
    it("should process a complete game turn", async function () {
      const turnResult = await orchestrator.processTurn();
      expect(turnResult).to.exist;
      expect(turnResult.processedAgents).to.be.an("array");
      expect(turnResult.turnNumber).to.be.greaterThan(0);
    });

    it("should handle social interactions", async function () {
      const interactions = await orchestrator.processAgentSocialInteractions();
      expect(interactions).to.be.an("array");
      interactions.forEach((interaction) => {
        expect(interaction).to.have.property("agentId");
        expect(interaction).to.have.property("interactions");
      });
    });

    it("should track agent positions", async function () {
      const positions = await orchestrator.getAgentPositions();
      expect(positions).to.be.an("array");
      positions.forEach((position) => {
        expect(position).to.have.property("agentId");
        expect(position).to.have.property("x");
        expect(position).to.have.property("y");
      });
    });

    it("should manage battles", async function () {
      const battles = await orchestrator.getActiveBattles();
      expect(battles).to.be.an("array");

      if (battles.length > 0) {
        const resolution = await orchestrator.resolveBattle(battles[0].id);
        expect(resolution).to.have.property("winnerId");
        expect(resolution).to.have.property("tokensWon");
      }
    });

    it("should handle alliances", async function () {
      const alliances = await orchestrator.getActiveAlliances();
      expect(alliances).to.be.an("array");
      alliances.forEach((alliance) => {
        expect(alliance).to.have.property("initiatorId");
        expect(alliance).to.have.property("joinerId");
        expect(alliance).to.have.property("status");
      });
    });
  });

  describe("Error Recovery", function () {
    it("should handle network errors gracefully", async function () {
      // Simulate network error
      await twitterManager.disconnect();

      const result = await orchestrator.processTurn();
      expect(result).to.exist;
      expect(result.errors).to.be.an("array");
    });

    it("should recover from database disconnection", async function () {
      await prisma.$disconnect();
      await prisma.$connect();

      const result = await orchestrator.getGameState();
      expect(result).to.exist;
      expect(result).to.have.property("status");
    });
  });

  describe("Performance", function () {
    it("should process turns within time limit", async function () {
      const startTime = Date.now();
      await orchestrator.processTurn();
      const duration = Date.now() - startTime;

      expect(duration).to.be.below(10000); // 10 second limit
    });

    it("should handle concurrent operations", async function () {
      const operations = [
        orchestrator.processTurn(),
        orchestrator.getGameState(),
        orchestrator.getAgentPositions(),
      ];

      const results = await Promise.allSettled(operations);
      expect(results.every((r) => r.status === "fulfilled")).to.be.true;
    });
  });
});
