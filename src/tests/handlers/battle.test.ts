import { expect } from "chai";
import { BattleHandler } from "@/agent/actionManager/handlers/battle";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { ActionContext, BattleAction } from "@/types";
import {
  getAgentAuthorityKeypair,
  getMiddleEarthAiAuthorityWallet,
  getProgram,
} from "@/utils/program";
import { test, describe } from "node:test";
import { GameManager } from "@/agent/GameManager";
import { Keypair } from "@solana/web3.js";

describe("BattleHandler", async () => {
  let battleHandler: BattleHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;

  test("setup", async () => {
    prisma = new PrismaClient();
    program = await getProgram();
    battleHandler = new BattleHandler(program, prisma);
    gameManager = new GameManager(program, prisma);
    gameAuthority = (await getMiddleEarthAiAuthorityWallet()).keypair;
  });

  //   test("cleanup", async () => {
  //     await prisma.$disconnect();
  //   });

  test("should successfully initiate a simple battle between two agents", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Initiating battle test",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: attacker.agent.id,
        defenderId: defender.agent.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("Simple");

    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "BATTLE",
        initiatorId: attacker.agent.id,
        targetId: defender.agent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(attacker.agent.profile.xHandle);
    expect(event?.message).to.include(defender.agent.profile.xHandle);
  });

  test("should handle battle with dead agent", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );

    // Mark defender as dead
    await prisma.agent.update({
      where: { id: defender.agent.id },
      data: { isAlive: false },
    });

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Battling dead agent",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("dead agent");
  });

  test("should handle battle with non-existent agent", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: 999, // Non-existent agent
      tweet: "Battling non-existent agent",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("not found");
  });

  test("should handle battle with self", async () => {
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

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent.agent.profile.onchainId, // Same as attacker
      tweet: "Battling self",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("Cannot battle self");
  });

  test("should handle battle during cooldown period", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Battle",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: attacker.agent.id,
        gameId: activeGame.dbGame.id,
      },
    });

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Battling during cooldown",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("cooldown");
  });

  test("should handle alliance vs alliance battle correctly", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );
    const attackerAlly = activeGame.agents[2];
    const attackerAllyKeypair = await getAgentAuthorityKeypair(
      attackerAlly.agent.profile.onchainId
    );
    const defenderAlly = activeGame.agents[3];
    const defenderAllyKeypair = await getAgentAuthorityKeypair(
      defenderAlly.agent.profile.onchainId
    );

    // Create alliances
    await Promise.all([
      program.methods
        .formAlliance()
        .accountsStrict({
          initiator: attacker.agent.pda,
          targetAgent: attackerAlly.agent.pda,
          game: activeGame.dbGame.pda,
          authority: attackerKeypair.publicKey,
        })
        .signers([attackerKeypair])
        .rpc(),
      program.methods
        .formAlliance()
        .accountsStrict({
          initiator: defender.agent.pda,
          targetAgent: defenderAlly.agent.pda,
          game: activeGame.dbGame.pda,
          authority: defenderKeypair.publicKey,
        })
        .signers([defenderKeypair])
        .rpc(),
    ]);

    // Create alliance records
    await Promise.all([
      prisma.alliance.create({
        data: {
          initiatorId: attacker.agent.id,
          joinerId: attackerAlly.agent.id,
          status: "Active",
          gameId: activeGame.dbGame.id,
        },
      }),
      prisma.alliance.create({
        data: {
          initiatorId: defender.agent.id,
          joinerId: defenderAlly.agent.id,
          status: "Active",
          gameId: activeGame.dbGame.id,
        },
      }),
    ]);

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Alliance vs Alliance battle",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: attacker.agent.id,
        defenderId: defender.agent.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("AllianceVsAlliance");
    expect(battle?.attackerAllyId).to.equal(attackerAlly.agent.id);
    expect(battle?.defenderAllyId).to.equal(defenderAlly.agent.id);
  });

  test("should handle agent vs alliance battle correctly", async () => {
    const activeGame = await gameManager.createNewGame();
    const singleAgent = activeGame.agents[0];
    const singleAgentKeypair = await getAgentAuthorityKeypair(
      singleAgent.agent.profile.onchainId
    );
    const allianceLeader = activeGame.agents[1];
    const allianceLeaderKeypair = await getAgentAuthorityKeypair(
      allianceLeader.agent.profile.onchainId
    );
    const alliancePartner = activeGame.agents[2];
    const alliancePartnerKeypair = await getAgentAuthorityKeypair(
      alliancePartner.agent.profile.onchainId
    );

    // Create alliance
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: allianceLeader.agent.pda,
        targetAgent: alliancePartner.agent.pda,
        game: activeGame.dbGame.pda,
        authority: allianceLeaderKeypair.publicKey,
      })
      .signers([allianceLeaderKeypair])
      .rpc();

    // Create alliance record
    await prisma.alliance.create({
      data: {
        initiatorId: allianceLeader.agent.id,
        joinerId: alliancePartner.agent.id,
        status: "Active",
        gameId: activeGame.dbGame.id,
      },
    });

    const ctx: ActionContext = {
      agentId: singleAgent.agent.id,
      agentOnchainId: singleAgent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: allianceLeader.agent.profile.onchainId,
      tweet: "Agent vs Alliance battle",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: singleAgent.agent.id,
        defenderId: allianceLeader.agent.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("AgentVsAlliance");
  });

  test("should handle battle outcome calculations correctly", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Testing battle outcome",
    };

    const result = await battleHandler.handle(ctx, action);
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: attacker.agent.id,
        defenderId: defender.agent.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.tokensStaked).to.be.a("number");
    expect(battle?.tokensStaked).to.be.greaterThan(0);

    // Verify game event metadata
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.dbGame.id,
        eventType: "BATTLE",
        initiatorId: attacker.agent.id,
        targetId: defender.agent.id,
      },
    });
    expect(event).to.not.be.null;
    const metadata = event?.metadata as any;
    expect(metadata.percentageLost).to.be.a("number");
    expect(metadata.percentageLost).to.be.within(20, 30); // As per calculateBattleOutcome implementation
    expect(metadata.tokensAtStake).to.be.a("number");
    expect(metadata.tokensAtStake).to.equal(battle?.tokensStaked);
  });

  test("should handle database transaction failure gracefully", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const defender = activeGame.agents[1];

    // Simulate database error by providing invalid data
    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: "invalid-game-id", // This will cause the transaction to fail
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Testing transaction failure",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");

    // Verify no battle record was created
    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: attacker.agent.id,
        defenderId: defender.agent.id,
      },
    });
    expect(battle).to.be.null;
  });

  test("should handle onchain transaction failure gracefully", async () => {
    const activeGame = await gameManager.createNewGame();
    const attacker = activeGame.agents[0];
    const attackerKeypair = await getAgentAuthorityKeypair(
      attacker.agent.profile.onchainId
    );
    const defender = activeGame.agents[1];
    const defenderKeypair = await getAgentAuthorityKeypair(
      defender.agent.profile.onchainId
    );

    // Create an alliance to test more complex battle resolution
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: attacker.agent.pda,
        targetAgent: defender.agent.pda,
        game: activeGame.dbGame.pda,
        authority: attackerKeypair.publicKey,
      })
      .signers([attackerKeypair])
      .rpc();

    // Create alliance record
    await prisma.alliance.create({
      data: {
        initiatorId: attacker.agent.id,
        joinerId: defender.agent.id,
        status: "Active",
        gameId: activeGame.dbGame.id,
      },
    });

    const ctx: ActionContext = {
      agentId: attacker.agent.id,
      agentOnchainId: attacker.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: defender.agent.profile.onchainId,
      tweet: "Testing onchain failure",
    };

    // Simulate onchain transaction failure by using invalid authority
    const originalGetAuthority = getMiddleEarthAiAuthorityWallet;
    try {
      (getMiddleEarthAiAuthorityWallet as any) = async () => ({
        keypair: Keypair.generate(), // This will cause the transaction to fail
        wallet: null,
      });

      const result = await battleHandler.handle(ctx, action);

      expect(result.success).to.be.false;
      expect(result.feedback?.isValid).to.be.false;
      expect(result.feedback?.error?.type).to.equal("BATTLE");

      // Verify no battle record was created due to rollback
      const battle = await prisma.battle.findFirst({
        where: {
          attackerId: attacker.agent.id,
          defenderId: defender.agent.id,
        },
      });
      expect(battle).to.be.null;
    } finally {
      // Restore original function
      (getMiddleEarthAiAuthorityWallet as any) = originalGetAuthority;
    }
  });
});
