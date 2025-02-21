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
} from "@solana/spl-token";
import { AgentAccount } from "@/types/program";
import { BN } from "@coral-xyz/anchor";

async function requestAirdrop(publicKey: PublicKey, amount: number = 1) {
  const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log(`Airdropped ${amount} SOL to ${publicKey.toString()}`);
  } catch (error) {
    console.error("Airdrop failed:", error);
    throw error;
  }
}

async function mintMearthTokens(
  authority: Keypair,
  recipient: PublicKey,
  amount: number,
  mintPubkey = new PublicKey("6w1GfoXH9HpGCRTcqLMqGeaLGRiuPfeCMhwXFx92gjEu")
) {
  const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  try {
    // Create mint if not provided
    const mint =
      mintPubkey ||
      (await createMint(
        connection,
        authority,
        authority.publicKey,
        authority.publicKey,
        9 // 9 decimals
      ));

    // Get or create recipient's token account
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      mint,
      recipient
    );

    // Mint tokens
    await mintTo(
      connection,
      authority,
      mint,
      recipientAta.address,
      authority,
      amount
    );

    console.log(`Minted ${amount} MEARTH tokens to ${recipient.toString()}`);
    return { mint, recipientAta };
  } catch (error) {
    console.error("Token minting failed:", error);
    throw error;
  }
}

describe.only("BattleHandler", function () {
  let program: MearthProgram;
  let battleHandler: BattleHandler;
  let prisma: PrismaClient;
  let gameInfo: GameInfo;
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
  let user2 = Keypair.generate();
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

    // Request airdrops for test wallets
    await Promise.all([
      requestAirdrop(user1.publicKey),
      requestAirdrop(user2.publicKey),
      requestAirdrop(gameAuthority.publicKey, 2), // Extra SOL for token operations
    ]);

    // Create MEARTH token mint
    const { mint } = await mintMearthTokens(
      gameAuthority,
      gameAuthority.publicKey,
      1000000000 // Initial supply
    );
    console.log("Mint address: ", mint.toString());
    mearthMint = mint;
  });

  beforeEach(async function () {
    // Create new game and get agents for each test
    gameInfo = await gameManager.createNewGame();
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

    // Request airdrops for agent authorities
    await Promise.all([
      requestAirdrop(agent1AuthorityKeypair.publicKey),
      requestAirdrop(agent2AuthorityKeypair.publicKey),
      requestAirdrop(agent3AuthorityKeypair.publicKey),
      requestAirdrop(agent4AuthorityKeypair.publicKey),
    ]);

    // Mint initial tokens to agent vaults
    // for (const authority of [
    //   agent1AuthorityKeypair,
    //   agent2AuthorityKeypair,
    //   agent3AuthorityKeypair,
    //   agent4AuthorityKeypair,
    // ]) {
    //   await mintMearthTokens(
    //     authority,
    //     gameAuthority.publicKey,
    //     1000000000,
    //     mearthMint
    //   );
    // }
  });

  after(async function () {
    await prisma.$disconnect();
  });

  it.only("should successfully resolve a simple battle between two agents", async () => {
    const stakerAta = await getOrCreateAssociatedTokenAccount(
      new Connection(process.env.SOLANA_RPC_URL!, "confirmed"),
      gameAuthority,
      mearthMint,
      gameAuthority.publicKey
    );
    // // stake tokens on agents
    await program.methods
      .initializeStake(new BN(1000000))
      .accounts({
        agent: agent1.pda,
        authority: gameAuthority.publicKey,
        stakerSource: stakerAta.address,
        agentVault: new PublicKey(agent1.vault),
      })
      .signers([gameAuthority])
      .rpc();
    console.log("Staking tokens...");
    await program.methods
      .stakeTokens(new BN(1000000))
      .accounts({
        agent: agent1.pda,
        authority: gameAuthority.publicKey,
        stakerSource: stakerAta.address,
        agentVault: new PublicKey(agent1.vault),
      })
      .signers([gameAuthority])
      .rpc();

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

  it("should handle battle with non-existent agent", async () => {
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

  it("should handle battle with self", async () => {
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

  it("should handle battle during cooldown period", async () => {
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

  it("should handle alliance vs alliance battle correctly", async () => {
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

  it("should handle agent vs alliance battle correctly", async () => {
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

  it("should handle battle outcome calculations correctly", async () => {
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

  it("should handle database transaction failure gracefully", async () => {
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

  it("should handle onchain transaction failure gracefully", async () => {
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
