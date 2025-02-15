import { expect } from "chai";
import { AllianceHandler } from "@/agent/actionManager/handlers/alliance";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import {
  ActionContext,
  FormAllianceAction,
  BreakAllianceAction,
} from "@/types";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getAgentAuthorityKeypair, getProgram } from "@/utils/program";
import { test, describe } from "node:test";
import { GameManager } from "@/agent/GameManager";

describe("AllianceHandler", async () => {
  let allianceHandler: AllianceHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;

  test("setup", async () => {
    prisma = new PrismaClient();
    program = await getProgram();
    allianceHandler = new AllianceHandler(program, prisma);
    gameManager = new GameManager(program, prisma);
  });

  // test("cleanup", async () => {
  //   await prisma.$disconnect();
  // });

  test("should successfully form an alliance between two agents", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    const targetAgent = activeGame.agents[1];
    const targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Forming alliance",
    };

    // Execute alliance formation
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify alliance record created
    const alliance = await prisma.alliance.findFirst({
      where: {
        initiatorId: agent.agent.id,
        joinerId: targetAgent.agent.id,
        status: "Active",
      },
    });
    expect(alliance).to.not.be.null;

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent.agent.id,
        type: "Alliance",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "ALLIANCE_FORM",
        initiatorId: agent.agent.id,
        targetId: targetAgent.agent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.agent.profile.xHandle);
  });

  test("should successfully break an existing alliance", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    const targetAgent = activeGame.agents[1];
    const targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Breaking alliance",
    };

    // Execute alliance break
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify alliance status updated
    const alliance = await prisma.alliance.findFirst({
      where: {
        initiatorId: agent.agent.id,
        joinerId: targetAgent.agent.id,
      },
    });
    expect(alliance).to.not.be.null;
    expect(alliance?.status).to.equal("Broken");

    // Verify cooldown created
    const cooldown = await prisma.coolDown.findFirst({
      where: {
        cooledAgentId: agent.agent.id,
        type: "Alliance",
      },
    });
    expect(cooldown).to.not.be.null;

    // Verify game event created
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "ALLIANCE_BREAK",
        initiatorId: agent.agent.id,
        targetId: targetAgent.agent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.agent.profile.xHandle);
  });

  test("should handle alliance formation during cooldown period", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    const targetAgent = activeGame.agents[1];
    const targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: targetAgent.agent.profile.onchainId,
      tweet: "Forming alliance during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Alliance",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: agent.agent.id,
        gameId: activeGame.dbGame.id,
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

  test("should handle breaking non-existent alliance", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );
    const targetAgent = activeGame.agents[1];
    const targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.agent.profile.onchainId
    );
    // Setup test data
    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: 2,
      tweet: "Breaking non-existent alliance",
    };

    // Create minimal required data
    const game = await prisma.game.create({
      data: {
        pda: activeGame.dbGame.pda,
        id: activeGame.dbGame.id,
        onchainId: activeGame.dbGame.onchainId,
        authority: new PublicKey(program.programId).toString(),
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        bump: 1,
        dailyRewardTokens: 100,
      },
    });

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

  test("should handle attempting to form alliance with self", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );

    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent.agent.profile.onchainId, // Same as initiator
      tweet: "Attempting to ally with self",
    };

    const result = await allianceHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "Cannot form alliance with self"
    );
  });

  test("should handle attempting to form alliance with already allied agent", async () => {
    const activeGame = await gameManager.createNewGame();
    const initiator = activeGame.agents[0];
    const initiatorKeypair = await getAgentAuthorityKeypair(
      initiator.agent.profile.onchainId
    );
    const target = activeGame.agents[1];
    const targetKeypair = await getAgentAuthorityKeypair(
      target.agent.profile.onchainId
    );
    const thirdAgent = activeGame.agents[2];
    const thirdAgentKeypair = await getAgentAuthorityKeypair(
      thirdAgent.agent.profile.onchainId
    );

    // First form an alliance between initiator and target
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: initiator.agent.pda,
        targetAgent: target.agent.pda,
        game: activeGame.dbGame.pda,
        authority: initiatorKeypair.publicKey,
      })
      .signers([initiatorKeypair])
      .rpc();

    // Create alliance record
    await prisma.alliance.create({
      data: {
        initiatorId: initiator.agent.id,
        joinerId: target.agent.id,
        status: "Active",
        gameId: activeGame.dbGame.id,
      },
    });

    // Now try to form alliance with third agent
    const ctx: ActionContext = {
      agentId: target.agent.id,
      agentOnchainId: target.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: thirdAgent.agent.profile.onchainId,
      tweet: "Attempting to form second alliance",
    };

    const result = await allianceHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "already in an alliance"
    );
  });

  test("should handle breaking alliance with wrong authority", async () => {
    const activeGame = await gameManager.createNewGame();
    const initiator = activeGame.agents[0];
    const initiatorKeypair = await getAgentAuthorityKeypair(
      initiator.agent.profile.onchainId
    );
    const target = activeGame.agents[1];
    const targetKeypair = await getAgentAuthorityKeypair(
      target.agent.profile.onchainId
    );
    const wrongAgent = activeGame.agents[2];
    const wrongAgentKeypair = await getAgentAuthorityKeypair(
      wrongAgent.agent.profile.onchainId
    );

    // Form alliance first
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: initiator.agent.pda,
        targetAgent: target.agent.pda,
        game: activeGame.dbGame.pda,
        authority: initiatorKeypair.publicKey,
      })
      .signers([initiatorKeypair])
      .rpc();

    // Create alliance record
    await prisma.alliance.create({
      data: {
        initiatorId: initiator.agent.id,
        joinerId: target.agent.id,
        status: "Active",
        gameId: activeGame.dbGame.id,
      },
    });

    // Try to break alliance using wrong agent
    const ctx: ActionContext = {
      agentId: wrongAgent.agent.id,
      agentOnchainId: wrongAgent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: target.agent.profile.onchainId,
      tweet: "Attempting to break others' alliance",
    };

    const result = await allianceHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BREAK_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "not part of this alliance"
    );
  });

  test("should handle alliance formation with non-existent agent", async () => {
    const activeGame = await gameManager.createNewGame();
    const agent = activeGame.agents[0];
    const agentKeypair = await getAgentAuthorityKeypair(
      agent.agent.profile.onchainId
    );

    const ctx: ActionContext = {
      agentId: agent.agent.id,
      agentOnchainId: agent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: 999, // Non-existent agent ID
      tweet: "Attempting to ally with non-existent agent",
    };

    const result = await allianceHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("Agent not found");
  });

  test("should handle alliance formation with dead agent", async () => {
    const activeGame = await gameManager.createNewGame();
    const initiator = activeGame.agents[0];
    const initiatorKeypair = await getAgentAuthorityKeypair(
      initiator.agent.profile.onchainId
    );
    const target = activeGame.agents[1];
    const targetKeypair = await getAgentAuthorityKeypair(
      target.agent.profile.onchainId
    );

    // Mark target agent as dead
    await prisma.agent.update({
      where: { id: target.agent.id },
      data: { isAlive: false },
    });

    const ctx: ActionContext = {
      agentId: initiator.agent.id,
      agentOnchainId: initiator.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: target.agent.profile.onchainId,
      tweet: "Attempting to ally with dead agent",
    };

    const result = await allianceHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("dead agent");
  });
});
