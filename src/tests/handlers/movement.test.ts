import { expect } from "chai";
import { MovementHandler } from "@/agent/actionManager/handlers/movement";
import { Game, PrismaClient } from "@prisma/client";
import { AgentWithProfile, MearthProgram } from "@/types";
import { ActionContext, MoveAction } from "@/types";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getAgentAuthorityKeypair,
  getMiddleEarthAiAuthorityWallet,
  getProgram,
} from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";
import { AgentAccount, GameAccount } from "@/types/program";
import { requestAirdrop } from "../utiils";

describe("MovementHandler", function () {
  let movementHandler: MovementHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameAuthorityWallet: Keypair;
  let gameManager: GameManager;
  let activeGame: Game;
  let activeGameAccount: GameAccount;
  let agent1: AgentWithProfile;
  let agent1Account: AgentAccount;
  let agent1Keypair: Keypair;

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    movementHandler = new MovementHandler(program, prisma);
    gameAuthorityWallet = (await getMiddleEarthAiAuthorityWallet()).keypair;
    gameManager = new GameManager(program, prisma);

    //  airdrop authority wallets
    await requestAirdrop(gameAuthorityWallet.publicKey, 5);
    for (const agent of [1, 2, 3, 4]) {
      const agentKp = await getAgentAuthorityKeypair(agent);
      await requestAirdrop(agentKp.publicKey, 5);
    }
  });

  after(async function () {
    await prisma.$disconnect();
  });

  beforeEach("setup", async function () {
    await prisma.mapTile.updateMany({
      data: {
        agentId: null,
      },
    });
    const gameInfo = await gameManager.createNewGame();
    activeGame = gameInfo.dbGame;
    activeGameAccount = gameInfo.gameAccount;
    agent1 = gameInfo.agents[0].agent;
    agent1Account = gameInfo.agents[0].account;
    //      agent1Keypair = await getAgentAuthorityKeypair(agent1.profile.onchainId);
    //      agent2 = gameInfo.agents[1].agent;
    //      agent2Account = gameInfo.agents[1].account;
    //      agent2Keypair = await getAgentAuthorityKeypair(agent2.profile.onchainId);
  });

  it("should successfully move agent to adjacent tile", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
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
      where: { id: agent1.id },
    });
    expect(updatedAgent?.mapTileId).to.equal(mapTile.id);

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent1.id,
        type: "Move",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.id,
        eventType: "MOVE",
        initiatorId: agent1.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent1.profile.xHandle);
    expect(event?.message).to.include(
      `(${action.position.x}, ${action.position.y})`
    );
  });

  it("should handle movement during cooldown period", async function () {
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
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
        cooledAgentId: agent1.id,
        gameId: activeGame.id,
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
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
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
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
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
