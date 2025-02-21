import { expect } from "chai";
import { BattleHandler } from "@/agent/actionManager/handlers/battle";
import { Game, PrismaClient } from "@prisma/client";
import { AgentWithProfile, GameInfo, MearthProgram } from "@/types";
import { ActionContext, BattleAction } from "@/types";
import {
  getAgentAuthorityKeypair,
  getMiddleEarthAiAuthorityWallet,
  getProgram,
  getAgentVault,
} from "@/utils/program";
import { describe, it, before, after } from "mocha";
import { GameManager } from "@/agent/GameManager";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
  Account,
} from "@solana/spl-token";
import { AgentAccount } from "@/types/program";
import { BN } from "@coral-xyz/anchor";
import { gameConfig, solanaConfig } from "@/config/env";
import { mintMearthTokens, requestAirdrop } from "../utiils";

describe("BattleHandler", function () {
  let program: MearthProgram;
  let battleHandler: BattleHandler;
  let prisma: PrismaClient;
  let activeGame: Game;
  let gameAuthority: Keypair;
  let gameManager: GameManager;
  let agent1: AgentWithProfile;
  let agent2: AgentWithProfile;
  let agent3: AgentWithProfile;
  let agent4: AgentWithProfile;
  let agent1Account: AgentAccount;
  let agent2Account: AgentAccount;
  let agent3Account: AgentAccount;
  let agent4Account: AgentAccount;
  let agent1AuthorityKeypair: Keypair;
  let agent2AuthorityKeypair: Keypair;
  let agent3AuthorityKeypair: Keypair;
  let agent4AuthorityKeypair: Keypair;
  let user1 = Keypair.generate();
  let user1Ata: Account;
  let user2 = Keypair.generate();
  let user2Ata: Account;
  let mearthMint: PublicKey;

  before(async function () {
    // Initialize test dependencies
    prisma = new PrismaClient();
    program = await getProgram();
    battleHandler = new BattleHandler(program, prisma);
    gameManager = new GameManager(program, prisma);

    // Get game authority
    const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();
    gameAuthority = gameAuthorityWallet.keypair;

    user1Ata = await getOrCreateAssociatedTokenAccount(
      new Connection(solanaConfig.rpcUrl, "confirmed"),
      user1,
      mearthMint,
      user1.publicKey
    );
    user2Ata = await getOrCreateAssociatedTokenAccount(
      new Connection(solanaConfig.rpcUrl, "confirmed"),
      user2,
      mearthMint,
      user2.publicKey
    );

    // Request airdrops for test wallets
    await Promise.all([
      requestAirdrop(user1.publicKey),
      requestAirdrop(user2.publicKey),
    ]);

    for (const id of [1, 2, 3, 4]) {
      const agentAuthorityKeypair = await getAgentAuthorityKeypair(id);
      await requestAirdrop(agentAuthorityKeypair.publicKey);
    }
    // Create MEARTH token mint
    const { mint } = await mintMearthTokens(
      gameAuthority,
      gameAuthority.publicKey,
      1000000000 // Initial supply
    );
    console.log("Mint address: ", mint.toString());
    mearthMint = new PublicKey(solanaConfig.tokenMint);

    // Mint initial tokens to agent vaults
    for (const authority of [
      agent1AuthorityKeypair,
      agent2AuthorityKeypair,
      agent3AuthorityKeypair,
      agent4AuthorityKeypair,
    ]) {
      await mintMearthTokens(
        authority,
        gameAuthority.publicKey,
        1000000000,
        mearthMint
      );
    }
  });

  beforeEach(async function () {
    // Create new game and get agents for each test
    const gameInfo = await gameManager.createNewGame();
    activeGame = gameInfo.dbGame;

    agent1 = gameInfo.agents[0].agent;
    agent2 = gameInfo.agents[1].agent;
    agent3 = gameInfo.agents[2].agent;
    agent4 = gameInfo.agents[3].agent;

    agent1Account = gameInfo.agents[0].account;
    agent2Account = gameInfo.agents[1].account;
    agent3Account = gameInfo.agents[2].account;
    agent4Account = gameInfo.agents[3].account;

    agent1AuthorityKeypair = await getAgentAuthorityKeypair(1);
    agent2AuthorityKeypair = await getAgentAuthorityKeypair(2);
    agent3AuthorityKeypair = await getAgentAuthorityKeypair(3);
    agent4AuthorityKeypair = await getAgentAuthorityKeypair(4);
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it("should successfully resolve a simple battle between two agents", async () => {
    // // stake tokens on agents
    await program.methods
      .initializeStake(new BN(1000000))
      .accounts({
        agent: agent1.pda,
        authority: user1.publicKey,
        stakerSource: user1Ata.address,
        agentVault: new PublicKey(agent1.vault),
      })
      .signers([user1])
      .rpc();
    // console.log("Staking tokens...");
    // await program.methods
    //   .stakeTokens(new BN(1000000))
    //   .accounts({
    //     agent: agent1.pda,
    //     authority: gameAuthority.publicKey,
    //     stakerSource: stakerAta.address,
    //     agentVault: new PublicKey(agent1.vault),
    //   })
    //   .signers([gameAuthority])
    //   .rpc();

    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Initiating battle test",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: agent1.id,
        defenderId: agent2.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("Simple");

    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.id,
        eventType: "BATTLE",
        initiatorId: agent1.id,
        targetId: agent2.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent1.profile.xHandle);
    expect(event?.message).to.include(agent2.profile.xHandle);
  });

  it("should handle battle with dead agent", async () => {
    program.methods
      .killAgent()
      .accounts({
        agent: agent2.pda,
      })
      .signers([gameAuthority]) // only game authority can kill agent
      .rpc();

    // Mark defender as dead
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

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Battling dead agent",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("dead agent");
  });

  it("should handle battle with non-existent agent", async () => {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
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

  it("should handle battle with self", async () => {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent1.profile.onchainId, // Same as attacker
      tweet: "Battling self",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("Cannot battle self");
  });

  it("should handle battle during cooldown period", async () => {
    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Battle",
        endsAt: new Date(Date.now() + gameConfig.mechanics.cooldowns.battle), // 1 hour from now
        cooledAgentId: agent1.id,
        gameId: activeGame.id,
      },
    });

    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Battling during cooldown",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");
    expect(result.feedback?.error?.message).to.include("cooldown");
  });

  it("should handle alliance vs alliance battle correctly", async () => {
    // Create alliances
    await Promise.all([
      program.methods
        .formAlliance()
        .accountsStrict({
          initiator: agent1.pda,
          targetAgent: agent2.pda,
          game: activeGame.pda,
          authority: agent1AuthorityKeypair.publicKey,
        })
        .signers([agent1AuthorityKeypair])
        .rpc(),
      program.methods
        .formAlliance()
        .accountsStrict({
          initiator: agent2.pda,
          targetAgent: agent3.pda,
          game: activeGame.pda,
          authority: agent2AuthorityKeypair.publicKey,
        })
        .signers([agent2AuthorityKeypair])
        .rpc(),
    ]);

    // Create alliance records
    await Promise.all([
      prisma.alliance.create({
        data: {
          initiatorId: agent1.id,
          joinerId: agent2.id,
          status: "Active",
          gameId: activeGame.id,
        },
      }),
      prisma.alliance.create({
        data: {
          initiatorId: agent2.id,
          joinerId: agent3.id,
          status: "Active",
          gameId: activeGame.id,
        },
      }),
    ]);

    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent3.profile.onchainId,
      tweet: "Alliance vs Alliance battle",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: agent1.id,
        defenderId: agent3.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("AllianceVsAlliance");
    expect(battle?.attackerAllyId).to.equal(agent2.id);
    expect(battle?.defenderAllyId).to.equal(agent3.id);
  });

  it("should handle agent vs alliance battle correctly", async () => {
    // Create alliance
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: agent1.pda,
        targetAgent: agent2.pda,
        game: activeGame.pda,
        authority: agent1AuthorityKeypair.publicKey,
      })
      .signers([agent1AuthorityKeypair])
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
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Agent vs Alliance battle",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: agent1.id,
        defenderId: agent2.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.type).to.equal("AgentVsAlliance");
  });

  it("should handle battle outcome calculations correctly", async () => {
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Testing battle outcome",
    };

    const result = await battleHandler.handle(ctx, action);
    expect(result.success).to.be.true;
    expect(result.feedback?.isValid).to.be.true;

    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: agent1.id,
        defenderId: agent2.id,
      },
    });
    expect(battle).to.not.be.null;
    expect(battle?.tokensStaked).to.be.a("number");
    expect(battle?.tokensStaked).to.be.greaterThan(0);

    // Verify game event metadata
    const event = await prisma.gameEvent.findFirst({
      where: {
        gameId: activeGame.id,
        eventType: "BATTLE",
        initiatorId: agent1.id,
        targetId: agent2.id,
      },
    });
    expect(event).to.not.be.null;
    const metadata = event?.metadata as any;
    expect(metadata.percentageLost).to.be.a("number");
    expect(metadata.percentageLost).to.be.within(20, 30); // As per calculateBattleOutcome implementation
    expect(metadata.tokensAtStake).to.be.a("number");
    expect(metadata.tokensAtStake).to.equal(battle?.tokensStaked);
  });

  it("should handle database transaction failure gracefully", async () => {
    // Simulate database error by providing invalid data
    const ctx: ActionContext = {
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
      tweet: "Testing transaction failure",
    };

    const result = await battleHandler.handle(ctx, action);

    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BATTLE");

    // Verify no battle record was created
    const battle = await prisma.battle.findFirst({
      where: {
        attackerId: agent1.id,
        defenderId: agent2.id,
      },
    });
    expect(battle).to.be.null;
  });

  it("should handle onchain transaction failure gracefully", async () => {
    // Create an alliance to test more complex battle resolution
    await program.methods
      .formAlliance()
      .accountsStrict({
        initiator: agent1.pda,
        targetAgent: agent2.pda,
        game: activeGame.pda,
        authority: agent1AuthorityKeypair.publicKey,
      })
      .signers([agent1AuthorityKeypair])
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
      agentId: agent1.id,
      agentOnchainId: agent1.profile.onchainId,
      gameId: activeGame.id,
      gameOnchainId: activeGame.onchainId,
    };

    const action: BattleAction = {
      type: "BATTLE",
      targetId: agent2.profile.onchainId,
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
          attackerId: agent1.id,
          defenderId: agent2.id,
        },
      });
      expect(battle).to.be.null;
    } finally {
      // Restore original function
      (getMiddleEarthAiAuthorityWallet as any) = originalGetAuthority;
    }
  });
});
