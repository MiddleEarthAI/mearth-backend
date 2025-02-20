import { expect } from "chai";
import { MovementHandler } from "@/agent/actionManager/handlers/movement";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { ActionContext, MoveAction } from "@/types";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getAgentAuthorityKeypair,
  getMiddleEarthAiAuthorityWallet,
  getProgram,
} from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";

describe("MovementHandler", function () {
  let movementHandler: MovementHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameAuthorityWallet: Keypair;
  let gameManager: GameManager;

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    movementHandler = new MovementHandler(program, prisma);
    gameAuthorityWallet = (await getMiddleEarthAiAuthorityWallet()).keypair;
    gameManager = new GameManager(program, prisma);
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it("should successfully move agent to adjacent tile", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const mapTile = await prisma.mapTile.findFirst({
      where: {
        agent: null,
      },
    });
    if (!mapTile) {
      throw new Error("No map tile found");
    }

    const action: MoveAction = {
      type: "MOVE",
      position: {
        x: mapTile.x,
        y: mapTile.y,
      },
      terrain: {
        [mapTile.terrainType]: {},
      },
      tweet: "Moving to adjacent tile",
    };

    // Execute movement
    const result = await movementHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify agent position updated
    const updatedAgent = await prisma.agent.findUnique({
      where: { id: agent.agent.id },
    });
    expect(updatedAgent?.mapTileId).to.equal(mapTile.id);

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent.agent.id,
        type: "Move",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "MOVE",
        initiatorId: agent.agent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.agent.profile.xHandle);
    expect(event?.message).to.include(
      `(${action.position.x}, ${action.position.y})`
    );
  });

  it("should handle movement during cooldown period", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: MoveAction = {
      type: "MOVE",
      position: {
        x: 1,
        y: 0,
      },
      terrain: {
        plain: {},
      },
      tweet: "Moving during cooldown",
    };

    // Create map tile
    const currentTile = await prisma.mapTile.create({
      data: {
        x: 0,
        y: 0,
        terrainType: "plain",
      },
    });

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Move",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent.agent.id,
        gameId: activeGame.dbGame.id,
      },
    });

    // Attempt movement during cooldown
    const result = await movementHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("MOVE");
    expect(result.feedback?.error?.message).to.include("cooldown");
  });

  it("should handle movement to non-adjacent tile", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const mapTile = await prisma.mapTile.findFirst({
      where: {
        agent: null,
      },
    });
    if (!mapTile) {
      throw new Error("No map tile found");
    }

    const action: MoveAction = {
      type: "MOVE",
      position: {
        x: mapTile.x,
        y: mapTile.y,
      },
      terrain: {
        plain: {},
      },
      tweet: "Moving to non-adjacent tile",
    };

    // Attempt movement to non-adjacent tile
    const result = await movementHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("MOVE");
    expect(result.feedback?.error?.message).to.include("adjacent");
  });

  it("should handle movement to non-existent tile", async function () {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: MoveAction = {
      type: "MOVE",
      position: {
        x: 10,
        y: 10,
      },
      terrain: {
        plain: {},
      },
      tweet: "Moving to non-existent tile",
    };
    // Attempt movement to non-existent tile
    const result = await movementHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("MOVE");
    expect(result.feedback?.error?.message).to.include("not found");
  });
});
