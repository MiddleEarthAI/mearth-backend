import { expect } from "chai";
import { IgnoreHandler } from "@/agent/actionManager/handlers/ignore";
import { PrismaClient } from "@prisma/client";
import { AgentWithProfile, GameInfo, MearthProgram } from "@/types";
import { ActionContext, IgnoreAction } from "@/types";
import { getProgram, getMiddleEarthAiAuthorityWallet } from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";
import { AgentAccount } from "@/types/program";
import { Keypair, PublicKey } from "@solana/web3.js";
import { mintMearthTokens } from "../utiils";
import { requestAirdrop } from "../utiils";

describe("IgnoreHandler", function () {
  let ignoreHandler: IgnoreHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;
  let activeGame: GameInfo;
  let agent1: AgentWithProfile;
  let agent1Account: AgentAccount;
  let agent2: AgentWithProfile;
  let agent2Account: AgentAccount;
  let mearthMint: PublicKey;

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    ignoreHandler = new IgnoreHandler(program, prisma);
    gameManager = new GameManager(program, prisma);

    // Get game authority
    const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();
    gameAuthority = gameAuthorityWallet.keypair;

    // Request airdrop for game authority
    await requestAirdrop(gameAuthority.publicKey, 2);

    // Create MEARTH token mint
    const { mint } = await mintMearthTokens(
      gameAuthority,
      gameAuthority.publicKey,
      1000000000 // Initial supply
    );
    mearthMint = mint;
  });

  beforeEach(async function () {
    activeGame = await gameManager.createNewGame();
    agent1 = activeGame.agents[0].agent;
    agent1Account = activeGame.agents[0].account;
    agent2 = activeGame.agents[1].agent;
    agent2Account = activeGame.agents[1].account;

    // // Get agent1 keypairs
    //  agentKeypair = await getAgentAuthorityKeypair(
    //   agent1.profile.onchainId
    // );
    // const targetAgentKeypair = await getAgentAuthorityKeypair(
    //   agent2.profile.onchainId
    // );
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it("should successfully ignore another agent1", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: agent2.profile.onchainId,
      tweet: "Ignoring agent1",
    };

    console.log("ctx", ctx);
    console.log("action", action);

    // Execute ignore action
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify ignore record created
    const ignore = await prisma.ignore.findFirst({
      where: {
        agentId: agent1.id,
        ignoredAgentId: agent2.id,
        gameId: activeGame.dbGame.id,
      },
    });
    expect(ignore).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent1.id,
        type: "Ignore",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "IGNORE",
        initiatorId: agent1.id,
        targetId: agent2.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent1.profile.name);
    expect(event?.message).to.include(agent2.profile.name);
  });

  it("should handle ignoring during cooldown period", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: agent2.profile.onchainId,
      tweet: "Ignoring during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Ignore",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent1.id,
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

  it("should handle ignoring non-existent agent1", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 999, // Non-existent agent1
      tweet: "Ignoring non-existent agent1",
    };

    // Attempt to ignore non-existent agent1
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("IGNORE");
    expect(result.feedback?.error?.message).to.include("not found");
  });

  it("should handle ignoring already ignored agent1", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: agent2.profile.onchainId,
      tweet: "Ignoring already ignored agent1",
    };

    // Create existing ignore
    await prisma.ignore.create({
      data: {
        agentId: agent1.id,
        ignoredAgentId: agent2.id,
        gameId: activeGame.dbGame.id,
        timestamp: new Date(),
        duration: 3600, // 1 hour
      },
    });

    // Attempt to ignore already ignored agent1
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;
  });
});
