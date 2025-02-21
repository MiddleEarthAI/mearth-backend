import { expect } from "chai";
import { IgnoreHandler } from "@/agent/actionManager/handlers/ignore";
import { PrismaClient } from "@prisma/client";
import { AgentWithProfile, GameInfo, MearthProgram } from "@/types";
import { ActionContext, IgnoreAction } from "@/types";
import {
  getProgram,
  getAgentAuthorityKeypair,
  getAgentVault,
  getMiddleEarthAiAuthorityWallet,
} from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";
import { AgentAccount } from "@/types/program";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { mintMearthTokens } from "../utiils";
import { requestAirdrop } from "../utiils";
import { solanaConfig } from "@/config/env";

describe("IgnoreHandler", function () {
  let ignoreHandler: IgnoreHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;
  let activeGame: GameInfo;
  let agent: AgentWithProfile;
  let agentAccount: AgentAccount;
  let targetAgent: AgentWithProfile;
  let targetAgentAccount: AgentAccount;
  let mearthMint: PublicKey;
  const connection = new Connection(solanaConfig.rpcUrl, "confirmed");

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
    agent = activeGame.agents[0].agent;
    agentAccount = activeGame.agents[0].account;
    targetAgent = activeGame.agents[1].agent;
    targetAgentAccount = activeGame.agents[1].account;

    // Get agent keypairs
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.profile.onchainId
    );
    const targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.profile.onchainId
    );

    // Request airdrops for test agents
    await Promise.all([
      requestAirdrop(agentKeypair.publicKey),
      requestAirdrop(targetAgentKeypair.publicKey),
    ]);

    // Mint tokens to agent vaults
    for (const authority of [agentKeypair, targetAgentKeypair]) {
      const agentVault = await getAgentVault(
        Number(authority.publicKey.toBuffer()[0])
      );
      await mintMearthTokens(
        authority,
        gameAuthority.publicKey,
        1000000000,
        mearthMint
      );
    }
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it("should successfully ignore another agent", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.profile.onchainId,
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
        agentId: agent.id,
        ignoredAgentId: targetAgent.id,
        gameId: activeGame.dbGame.id,
      },
    });
    expect(ignore).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent.id,
        type: "Ignore",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "IGNORE",
        initiatorId: agent.id,
        targetId: targetAgent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.profile.xHandle);
  });

  it("should handle ignoring during cooldown period", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.profile.onchainId,
      tweet: "Ignoring during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Ignore",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent.id,
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
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
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
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: targetAgent.profile.onchainId,
      tweet: "Ignoring already ignored agent",
    };

    // Create existing ignore
    await prisma.ignore.create({
      data: {
        agentId: agent.id,
        ignoredAgentId: targetAgent.id,
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
