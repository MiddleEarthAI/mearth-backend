import { expect } from "chai";
import { IgnoreHandler } from "@/agent/actionManager/handlers/ignore";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { ActionContext, IgnoreAction } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "@/utils/program";
import { test, describe } from "node:test";

describe("IgnoreHandler", async () => {
  let ignoreHandler: IgnoreHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;

  test("setup", async () => {
    prisma = new PrismaClient();
    program = await getProgram();
    ignoreHandler = new IgnoreHandler(program, prisma);
  });

  test("cleanup", async () => {
    await prisma.$disconnect();
  });

  test("should successfully ignore another agent", async () => {
    // Setup test data
    const ctx: ActionContext = {
      agentId: "test-agent-1",
      agentOnchainId: 1,
      gameId: "test-game-1",
      gameOnchainId: 1,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 2,
      tweet: "Ignoring agent",
    };

    // Create test game
    const game = await prisma.game.create({
      data: {
        id: ctx.gameId,
        onchainId: ctx.gameOnchainId,
        authority: new PublicKey(program.programId).toString(),
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        bump: 1,
        dailyRewardTokens: 100,
      },
    });

    // Create agent profiles
    const [initiatorProfile, targetProfile] = await Promise.all([
      prisma.agentProfile.create({
        data: {
          name: "Test Initiator",
          xHandle: "testInitiator",
          onchainId: ctx.agentOnchainId,
          bio: ["Test bio"],
          lore: ["Test lore"],
          characteristics: ["Test characteristics"],
          knowledge: ["Test knowledge"],
          traits: {},
          postExamples: ["Test post"],
        },
      }),
      prisma.agentProfile.create({
        data: {
          name: "Test Target",
          xHandle: "testTarget",
          onchainId: action.targetId,
          bio: ["Test bio"],
          lore: ["Test lore"],
          characteristics: ["Test characteristics"],
          knowledge: ["Test knowledge"],
          traits: {},
          postExamples: ["Test post"],
        },
      }),
    ]);

    // Create map tile
    const mapTile = await prisma.mapTile.create({
      data: {
        x: 0,
        y: 0,
        terrainType: "plain",
      },
    });

    // Create agents
    const [initiator, target] = await Promise.all([
      prisma.agent.create({
        data: {
          id: ctx.agentId,
          onchainId: ctx.agentOnchainId,
          authority: new PublicKey(program.programId).toString(),
          gameId: game.id,
          profileId: initiatorProfile.id,
          mapTileId: mapTile.id,
          authorityAssociatedTokenAddress: "test-ata-1",
        },
      }),
      prisma.agent.create({
        data: {
          id: "test-agent-2",
          onchainId: action.targetId,
          authority: new PublicKey(program.programId).toString(),
          gameId: game.id,
          profileId: targetProfile.id,
          mapTileId: mapTile.id,
          authorityAssociatedTokenAddress: "test-ata-2",
        },
      }),
    ]);

    // Execute ignore action
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify ignore record created
    const ignore = await prisma.ignore.findFirst({
      where: {
        agentId: initiator.id,
        ignoredAgentId: target.id,
        gameId: game.id,
      },
    });
    expect(ignore).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: initiator.id,
        type: "Ignore",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: game.id,
        eventType: "IGNORE",
        initiatorId: initiator.id,
        targetId: target.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(initiatorProfile.xHandle);
    expect(event?.message).to.include(targetProfile.xHandle);
  });

  test("should handle ignoring during cooldown period", async () => {
    // Setup test data
    const ctx: ActionContext = {
      agentId: "test-agent-1",
      agentOnchainId: 1,
      gameId: "test-game-1",
      gameOnchainId: 1,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 2,
      tweet: "Ignoring during cooldown",
    };

    // Create test game
    const game = await prisma.game.create({
      data: {
        id: ctx.gameId,
        onchainId: ctx.gameOnchainId,
        authority: new PublicKey(program.programId).toString(),
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        bump: 1,
        dailyRewardTokens: 100,
      },
    });

    // Create agent profile
    const agentProfile = await prisma.agentProfile.create({
      data: {
        name: "Test Agent",
        xHandle: "testAgent",
        onchainId: ctx.agentOnchainId,
        bio: ["Test bio"],
        lore: ["Test lore"],
        characteristics: ["Test characteristics"],
        knowledge: ["Test knowledge"],
        traits: {},
        postExamples: ["Test post"],
      },
    });

    // Create map tile
    const mapTile = await prisma.mapTile.create({
      data: {
        x: 0,
        y: 0,
        terrainType: "plain",
      },
    });

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        id: ctx.agentId,
        onchainId: ctx.agentOnchainId,
        authority: new PublicKey(program.programId).toString(),
        gameId: game.id,
        profileId: agentProfile.id,
        mapTileId: mapTile.id,
        authorityAssociatedTokenAddress: "test-ata-1",
      },
    });

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Ignore",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent.id,
        gameId: game.id,
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

  test("should handle ignoring non-existent agent", async () => {
    // Setup test data
    const ctx: ActionContext = {
      agentId: "test-agent-1",
      agentOnchainId: 1,
      gameId: "test-game-1",
      gameOnchainId: 1,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 999, // Non-existent agent
      tweet: "Ignoring non-existent agent",
    };

    // Create test game
    const game = await prisma.game.create({
      data: {
        id: ctx.gameId,
        onchainId: ctx.gameOnchainId,
        authority: new PublicKey(program.programId).toString(),
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        bump: 1,
        dailyRewardTokens: 100,
      },
    });

    // Create agent profile
    const agentProfile = await prisma.agentProfile.create({
      data: {
        name: "Test Agent",
        xHandle: "testAgent",
        onchainId: ctx.agentOnchainId,
        bio: ["Test bio"],
        lore: ["Test lore"],
        characteristics: ["Test characteristics"],
        knowledge: ["Test knowledge"],
        traits: {},
        postExamples: ["Test post"],
      },
    });

    // Create map tile
    const mapTile = await prisma.mapTile.create({
      data: {
        x: 0,
        y: 0,
        terrainType: "plain",
      },
    });

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        id: ctx.agentId,
        onchainId: ctx.agentOnchainId,
        authority: new PublicKey(program.programId).toString(),
        gameId: game.id,
        profileId: agentProfile.id,
        mapTileId: mapTile.id,
        authorityAssociatedTokenAddress: "test-ata-1",
      },
    });

    // Attempt to ignore non-existent agent
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("IGNORE");
    expect(result.feedback?.error?.message).to.include("not found");
  });

  test("should handle ignoring already ignored agent", async () => {
    // Setup test data
    const ctx: ActionContext = {
      agentId: "test-agent-1",
      agentOnchainId: 1,
      gameId: "test-game-1",
      gameOnchainId: 1,
    };

    const action: IgnoreAction = {
      type: "IGNORE",
      targetId: 2,
      tweet: "Ignoring already ignored agent",
    };

    // Create test game
    const game = await prisma.game.create({
      data: {
        id: ctx.gameId,
        onchainId: ctx.gameOnchainId,
        authority: new PublicKey(program.programId).toString(),
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        bump: 1,
        dailyRewardTokens: 100,
      },
    });

    // Create agent profiles
    const [initiatorProfile, targetProfile] = await Promise.all([
      prisma.agentProfile.create({
        data: {
          name: "Test Initiator",
          xHandle: "testInitiator",
          onchainId: ctx.agentOnchainId,
          bio: ["Test bio"],
          lore: ["Test lore"],
          characteristics: ["Test characteristics"],
          knowledge: ["Test knowledge"],
          traits: {},
          postExamples: ["Test post"],
        },
      }),
      prisma.agentProfile.create({
        data: {
          name: "Test Target",
          xHandle: "testTarget",
          onchainId: action.targetId,
          bio: ["Test bio"],
          lore: ["Test lore"],
          characteristics: ["Test characteristics"],
          knowledge: ["Test knowledge"],
          traits: {},
          postExamples: ["Test post"],
        },
      }),
    ]);

    // Create map tile
    const mapTile = await prisma.mapTile.create({
      data: {
        x: 0,
        y: 0,
        terrainType: "plain",
      },
    });

    // Create agents
    const [initiator, target] = await Promise.all([
      prisma.agent.create({
        data: {
          id: ctx.agentId,
          onchainId: ctx.agentOnchainId,
          authority: new PublicKey(program.programId).toString(),
          gameId: game.id,
          profileId: initiatorProfile.id,
          mapTileId: mapTile.id,
          authorityAssociatedTokenAddress: "test-ata-1",
        },
      }),
      prisma.agent.create({
        data: {
          id: "test-agent-2",
          onchainId: action.targetId,
          authority: new PublicKey(program.programId).toString(),
          gameId: game.id,
          profileId: targetProfile.id,
          mapTileId: mapTile.id,
          authorityAssociatedTokenAddress: "test-ata-2",
        },
      }),
    ]);

    // Create existing ignore
    await prisma.ignore.create({
      data: {
        agentId: initiator.id,
        ignoredAgentId: target.id,
        gameId: game.id,
      },
    });

    // Attempt to ignore already ignored agent
    const result = await ignoreHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("IGNORE");
    expect(result.feedback?.error?.message).to.include("already ignored");
  });
});
