import { expect } from "chai";
import { AllianceHandler } from "@/agent/actionManager/handlers/alliance";
import { Game, PrismaClient } from "@prisma/client";
import { AgentWithProfile, MearthProgram } from "@/types";
import {
  ActionContext,
  FormAllianceAction,
  BreakAllianceAction,
} from "@/types";
import { Keypair } from "@solana/web3.js";
import { getProgram, getMiddleEarthAiAuthorityWallet } from "@/utils/program";
import { GameManager } from "@/agent/GameManager";
import { describe, it, before, after } from "mocha";
import { AgentAccount, GameAccount } from "@/types/program";

describe("AllianceHandler", function () {
  let allianceHandler: AllianceHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;
  let activeGame: Game;
  let activeGameAccount: GameAccount;
  let agent1: AgentWithProfile;
  let agent1Account: AgentAccount;

  let agent2: AgentWithProfile;
  let agent2Account: AgentAccount;

  let agent3: AgentWithProfile;
  let agent3Account: AgentAccount;

  let agent4: AgentWithProfile;
  let agent4Account: AgentAccount;

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    allianceHandler = new AllianceHandler(program, prisma);
    gameManager = new GameManager(program, prisma);
    const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();
    gameAuthority = gameAuthorityWallet.keypair;

    // airdrop authority wallets
    // await requestAirdrop(gameAuthority.publicKey, 5);
    // for (const agent of [1, 2, 3, 4]) {
    //   const agentKp = await getAgentAuthorityKeypair(agent);
    //   await requestAirdrop(agentKp.publicKey, 5);
    // }
  });

  after(async function () {
    await prisma.$disconnect();
  });

  beforeEach("setup", async function () {
    const gameInfo = await gameManager.createNewGame();
    activeGame = gameInfo.dbGame;
    activeGameAccount = gameInfo.gameAccount;
    agent1 = gameInfo.agents[0].agent;
    agent1Account = gameInfo.agents[0].account;
    agent2 = gameInfo.agents[1].agent;
    agent2Account = gameInfo.agents[1].account;
    agent3 = gameInfo.agents[2].agent;
    agent3Account = gameInfo.agents[2].account;
    agent4 = gameInfo.agents[3].agent;
    agent4Account = gameInfo.agents[3].account;
  });

  it("should successfully form an alliance between two agents", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };
    const formAllianceAction: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Forming alliance",
    };

    // Execute alliance formation
    const result = await allianceHandler.handle(ctx, formAllianceAction);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify alliance record created
    const alliance = await prisma.alliance.findFirst({
      where: {
        initiatorId: ctx.agentId,
        joinerId: agent2.id,
        status: "Active",
      },
    });
    expect(alliance).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: ctx.agentId,
        type: "Alliance",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.id,
        eventType: "ALLIANCE_FORM",
        initiatorId: ctx.agentId,
        targetId: agent2.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent1.profile.xHandle);
    expect(event?.message).to.include(agent2.profile.xHandle);
  });

  it("should successfully break an existing alliance", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };
    const formAllianceAction: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Forming alliance",
    };
    const breakAllianceAction: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Breaking alliance",
    };

    // Execute alliance formation
    await allianceHandler.handle(ctx, formAllianceAction);

    // Execute alliance break
    const result = await allianceHandler.handle(ctx, breakAllianceAction);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify alliance status updated
    const alliance = await prisma.alliance.findFirst({
      where: {
        initiatorId: ctx.agentId,
        joinerId: agent2.id,
      },
    });
    expect(alliance).to.not.be.null;
    expect(alliance?.status).to.equal("Broken");

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: ctx.agentId,
        type: "Alliance",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.id,
        eventType: "ALLIANCE_BREAK",
        initiatorId: ctx.agentId,
        targetId: agent2.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent1.profile.xHandle);
    expect(event?.message).to.include(agent2.profile.xHandle);
  });

  it("should handle alliance formation during cooldown period", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Forming alliance during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Alliance",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: ctx.agentId,
        gameId: activeGame.id,
      },
    });

    // Attempt alliance formation during cooldown
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("cooldown");
  });

  it("should handle breaking non-existent alliance", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Breaking non-existent alliance",
    };

    // Attempt to break non-existent alliance
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BREAK_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "No active alliance found"
    );
  });

  it("should handle attempting to form alliance with self", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent1.profile.onchainId, // Same as initiator
      tweet: "Attempting to ally with self",
    };

    // Attempt to form alliance with self
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "Invalid alliance partner"
    );
  });

  it("should handle attempting to form alliance with already allied agent1", async function () {
    // First form an alliance between initiator and target
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: agent1.pda,
        targetAgent: agent2.pda,
        game: activeGame.pda,
        authority: gameAuthority.publicKey,
      })
      .signers([gameAuthority])
      .rpc();

    // Create alliance record
    await prisma.alliance.create({
      data: {
        initiatorId: agent1.id,
        joinerId: agent2.id,
        status: "Active",
        gameId: activeGame.id,
      },
    });

    const ctx: ActionContext = {
      agentId: agent2.id,
      agentOnchainId: agent2.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent3.profile.onchainId,
      tweet: "Attempting to form second alliance",
    };

    // Attempt to form second alliance
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "An active alliance already exists"
    );
  });

  it("should handle alliance formation with non-existent agent1", async function () {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: 999, // Non-existent agent1 ID
      tweet: "Attempting to ally with non-existent agent1",
    };

    // Attempt to form alliance with non-existent agent1
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("Agent not found");
  });

  it("should handle alliance formation with dead agent1", async function () {
    // Mark target agent1 as dead
    await program.methods
      .killAgent()
      .accounts({
        agent: agent2.pda,
        game: activeGame.pda,
      })
      .signers([gameAuthority]) // only game authority can kill an agent
      .rpc();

    await prisma.agent.update({
      where: { id: agent2.id },
      data: { isAlive: false },
    });

    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent2.profile.onchainId,
      tweet: "Attempting to ally with dead agent1",
    };

    // Attempt to form alliance with dead agent1
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("ConstraintHasOne.");
  });
});
