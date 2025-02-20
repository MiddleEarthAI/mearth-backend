import { expect } from "chai";
import { IgnoreHandler } from "@/agent/actionManager/handlers/ignore";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { ActionContext, IgnoreAction } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";

describe("IgnoreHandler", function () {
  let ignoreHandler: IgnoreHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    ignoreHandler = new IgnoreHandler(program, prisma);
    gameManager = new GameManager(program, prisma);
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it("should successfully ignore another agent", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const targetAgent = activeGame.agents[1];

    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Ignoring agent",
    };

    // Execute ignore action
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify ignore record created
    const ignore = await prisma.ignore.findFirst({
      where: {
        agentId: agent.agent.id,
        ignoredAgentId: targetAgent.agent.id,
        gameId: activeGame.dbGame.id,
      },
    });
    expect(ignore).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent.agent.id,
        type: "Ignore",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "IGNORE",
        initiatorId: agent.agent.id,
        targetId: targetAgent.agent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.agent.profile.xHandle);
  });

  it("should handle ignoring during cooldown period", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const targetAgent = activeGame.agents[1];

    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Ignoring during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Ignore",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent.agent.id,
        gameId: activeGame.dbGame.id,
      },
    });

    // Attempt ignore during cooldown
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("IGNORE");
    expect(result.feedback?.error?.message).to.include("cooldown");
  });

  it("should handle ignoring non-existent agent", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];

    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 999, // Non-existent agent
      tweet: "Ignoring non-existent agent",
    };

    // Attempt to ignore non-existent agent
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("IGNORE");
    expect(result.feedback?.error?.message).to.include("not found");
  });

  it("should handle ignoring already ignored agent", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const targetAgent = activeGame.agents[1];

    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Ignoring already ignored agent",
    };

    // Create existing ignore
    await prisma.ignore.create({
      data: {
        agentId: agent.agent.id,
        ignoredAgentId: targetAgent.agent.id,
        gameId: activeGame.dbGame.id,
        timestamp: new Date(),
        duration: 3600, // 1 hour
      },
    });

    // Attempt to ignore already ignored agent
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;
  });
});
