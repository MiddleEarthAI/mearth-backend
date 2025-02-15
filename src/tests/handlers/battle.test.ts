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

  // test("should successfully initiate a simple battle between two agents", async () => {
  //   const activeGame = await gameManager.createNewGame();
  //   const attacker = activeGame.agents[0];
  //   const defender = activeGame.agents[1];
  //   // Setup test data
  //   const ctx: ActionContext = {
  //     agentId: attacker.agent.id,
  //     agentOnchainId: attacker.agent.profile.onchainId,
  //     gameId: activeGame.dbGame.id,
  //     gameOnchainId: activeGame.dbGame.onchainId,
  //   };

  //   const action: BattleAction = {
  //     type: "BATTLE",
  //     targetId: defender.agent.profile.onchainId,
  //     tweet: "Initiating battle test",
  //   };

  //   // Execute battle
  //   const result = await battleHandler.handle(ctx, action);

  //   // Assertions
  //   expect(result.success).to.be.true;
  //   expect(result.feedback?.isValid).to.be.true;

  //   // Verify battle record
  //   const battle = await prisma.battle.findFirst({
  //     where: {
  //       attackerId: attacker.agent.id,
  //       defenderId: defender.agent.id,
  //     },
  //   });
  //   expect(battle).to.not.be.null;
  //   expect(battle?.type).to.equal("Simple");

  //   // Verify game event
  //   const event = await prisma.gameEvent.findFirst({
  //     where: {
  //       gameId: activeGame.dbGame.id,
  //       eventType: "BATTLE",
  //       initiatorId: attacker.agent.id,
  //       targetId: defender.agent.id,
  //     },
  //   });
  //   expect(event).to.not.be.null;
  //   expect(event?.message).to.include(attacker.agent.profile.xHandle);
  //   expect(event?.message).to.include(defender.agent.profile.xHandle);
  // });

  // test("should handle battle initiation failure gracefully", async () => {
  //   const ctx: ActionContext = {
  //     agentId: "nonexistent-agent",
  //     agentOnchainId: 999,
  //     gameId: "nonexistent-game",
  //     gameOnchainId: 999,
  //   };

  //   const action: BattleAction = {
  //     type: "BATTLE",
  //     targetId: 998,
  //     tweet: "This battle should fail",
  //   };

  //   const result = await battleHandler.handle(ctx, action);

  //   expect(result.success).to.be.false;
  //   expect(result.feedback?.isValid).to.be.false;
  //   expect(result.feedback?.error?.type).to.equal("BATTLE");
  //   expect(result.feedback?.error?.message).to.include(
  //     "Account does not exist"
  //   );
  // });

  // test("should handle alliance vs alliance battle correctly", async () => {
  //   const activeGame = await gameManager.createNewGame();
  //   const attacker = activeGame.agents[0];
  //   const attackerKeypair = await getAgentAuthorityKeypair(
  //     attacker.agent.profile.onchainId
  //   );
  //   const defender = activeGame.agents[1];
  //   const defenderKeypair = await getAgentAuthorityKeypair(
  //     defender.agent.profile.onchainId
  //   );
  //   const attackerAlly = activeGame.agents[2];
  //   const attackerAllyKeypair = await getAgentAuthorityKeypair(
  //     attackerAlly.agent.profile.onchainId
  //   );
  //   const defenderAlly = activeGame.agents[3];
  //   const defenderAllyKeypair = await getAgentAuthorityKeypair(
  //     defenderAlly.agent.profile.onchainId
  //   );

  //   const gamePda = activeGame.dbGame.pda;

  //   // Setup test data for alliance battle
  //   const ctx: ActionContext = {
  //     agentId: attacker.agent.id,
  //     agentOnchainId: attacker.agent.profile.onchainId,
  //     gameId: activeGame.dbGame.id,
  //     gameOnchainId: activeGame.dbGame.onchainId,
  //   };

  //   // Create alliances - first for attacker and attackerAlly
  //   await program.methods
  //     .formAlliance()
  //     .accountsStrict({
  //       initiator: attacker.agent.pda,
  //       targetAgent: attackerAlly.agent.pda,
  //       game: gamePda,
  //       authority: attackerKeypair.publicKey,
  //     })
  //     .signers([attackerKeypair])
  //     .rpc();

  //   // Then for defender and defenderAlly
  //   await program.methods
  //     .formAlliance()
  //     .accountsStrict({
  //       initiator: defender.agent.pda,
  //       targetAgent: defenderAlly.agent.pda,
  //       game: gamePda,
  //       authority: defenderKeypair.publicKey,
  //     })
  //     .signers([defenderKeypair])
  //     .rpc();

  //   // Create alliance records in database
  //   await Promise.all([
  //     prisma.alliance.create({
  //       data: {
  //         initiatorId: attacker.agent.id,
  //         joinerId: attackerAlly.agent.id,
  //         status: "Active",
  //         gameId: activeGame.dbGame.id,
  //       },
  //     }),
  //     prisma.alliance.create({
  //       data: {
  //         initiatorId: defender.agent.id,
  //         joinerId: defenderAlly.agent.id,
  //         status: "Active",
  //         gameId: activeGame.dbGame.id,
  //       },
  //     }),
  //   ]);

  //   const action: BattleAction = {
  //     type: "BATTLE",
  //     targetId: defender.agent.profile.onchainId,
  //     tweet: "Alliance battle test",
  //   };

  //   // Execute battle
  //   const result = await battleHandler.handle(ctx, action);

  //   // Assertions
  //   expect(result.success).to.be.true;
  //   expect(result.feedback?.isValid).to.be.true;

  //   // Verify battle record
  //   const battle = await prisma.battle.findFirst({
  //     where: {
  //       attackerId: attacker.agent.id,
  //       defenderId: defender.agent.id,
  //     },
  //   });
  //   expect(battle).to.not.be.null;
  //   expect(battle?.type).to.equal("AllianceVsAlliance");
  //   expect(battle?.attackerAllyId).to.equal(attackerAlly.agent.id);
  //   expect(battle?.defenderAllyId).to.equal(defenderAlly.agent.id);
  // });

  test("should handle agent vs alliance battle correctly", async () => {
    const activeGame = await gameManager.createNewGame();
    const singleAgent = activeGame.agents[0];
    const singleAgentKeypair = await getAgentAuthorityKeypair(
      singleAgent.agent.profile.onchainId
    );
    const allianceLeaderAgent = activeGame.agents[1];
    const allianceLeaderAgentKeypair = await getAgentAuthorityKeypair(
      allianceLeaderAgent.agent.profile.onchainId
    );
    const alliancePartnerAgent = activeGame.agents[2];
    const alliancePartnerAgentKeypair = await getAgentAuthorityKeypair(
      alliancePartnerAgent.agent.profile.onchainId
    );

    // Create alliance
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: allianceLeaderAgent.agent.pda,
        targetAgent: alliancePartnerAgent.agent.pda,
        game: activeGame.dbGame.pda,
        authority: allianceLeaderAgentKeypair.publicKey,
      })
      .signers([allianceLeaderAgentKeypair])
      .rpc();
    // Setup test data for agent vs alliance battle
    const ctx: ActionContext = {
      agentId: singleAgent.agent.id,
      agentOnchainId: singleAgent.agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: allianceLeaderAgent.agent.profile.onchainId,
      tweet: "Agent vs Alliance battle test",
    };

    // Execute battle
    const result = await battleHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    // Verify battle record
    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: singleAgent.agent.id,
        defenderId: allianceLeaderAgent.agent.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("AgentVsAlliance");
    expect(battle?.attackerAllyId).to.equal(singleAgent.agent.id);
    expect(battle?.defenderAllyId).to.equal(allianceLeaderAgent.agent.id);
  });

  // test("should validate token stakes correctly", async () => {
  //   const activeGame = await gameManager.createNewGame();
  //   const attacker = activeGame.agents[0];
  //   const defender = activeGame.agents[1];

  //   const ctx: ActionContext = {
  //     agentId: attacker.agent.id,
  //     agentOnchainId: attacker.agent.profile.onchainId,
  //     gameId: activeGame.dbGame.id,
  //     gameOnchainId: activeGame.dbGame.onchainId,
  //   };

  //   const action: BattleAction = {
  //     type: "BATTLE",
  //     targetId: defender.agent.profile.onchainId,
  //     tweet: "Token stake test",
  //   };

  //   // Execute battle
  //   const result = await battleHandler.handle(ctx, action);

  //   // Assertions
  //   expect(result.success).to.be.true;
  //   expect(result.feedback?.isValid).to.be.true;

  //   // Verify battle record and token calculations
  //   const battle = await prisma.battle.findFirst({
  //     where: {
  //       attackerId: attacker.agent.id,
  //       defenderId: defender.agent.id,
  //     },
  //   });
  //   expect(battle).to.not.be.null;
  //   expect(battle?.tokensStaked).to.be.greaterThan(0);
  //   expect(battle?.tokensStaked).to.equal(150); // Total tokens at stake
  // });
});
