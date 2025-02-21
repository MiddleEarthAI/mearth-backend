import { expect } from "chai";
import { AllianceHandler } from "@/agent/actionManager/handlers/alliance";
import { Agent, Game, PrismaClient } from "@prisma/client";
import { AgentWithProfile, GameInfo, MearthProgram } from "@/types";
import {
  ActionContext,
  FormAllianceAction,
  BreakAllianceAction,
} from "@/types";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAgentAuthorityKeypair,
  getProgram,
  getAgentVault,
  getMiddleEarthAiAuthorityWallet,
} from "@/utils/program";
import { GameManager } from "@/agent/GameManager";
import { describe, it, before, after } from "mocha";
import { AgentAccount } from "@/types/program";
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";

async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 1
) {
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
  connection: Connection,
  authority: Keypair,
  recipient: PublicKey,
  amount: number,
  mintPubkey?: PublicKey
) {
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

describe("AllianceHandler", function () {
  let allianceHandler: AllianceHandler;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let gameManager: GameManager;
  let gameAuthority: Keypair;
  let activeGame: GameInfo;
  let agent: AgentWithProfile;
  let agentAccount: AgentAccount;
  let agentKeypair: Keypair;
  let targetAgent: AgentWithProfile;
  let targetAgentAccount: AgentAccount;
  let targetAgentKeypair: Keypair;
  let mearthMint: PublicKey;
  const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");

  before(async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    allianceHandler = new AllianceHandler(program, prisma);
    gameManager = new GameManager(program, prisma);

    // Get game authority
    const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();
    gameAuthority = gameAuthorityWallet.keypair;

    // Request airdrop for game authority
    await requestAirdrop(connection, gameAuthority.publicKey, 2);

    // Create MEARTH token mint
    const { mint } = await mintMearthTokens(
      connection,
      gameAuthority,
      gameAuthority.publicKey,
      1000000000 // Initial supply
    );
    mearthMint = mint;
  });

  after(async function () {
    await prisma.$disconnect();
  });

  beforeEach("setup", async function () {
    activeGame = await gameManager.createNewGame();
    agent = activeGame.agents[0].agent;
    agentAccount = activeGame.agents[0].account;
    agentKeypair = await getAgentAuthorityKeypair(agent.profile.onchainId);
    targetAgent = activeGame.agents[1].agent;
    targetAgentAccount = activeGame.agents[1].account;
    targetAgentKeypair = await getAgentAuthorityKeypair(
      targetAgent.profile.onchainId
    );

    // Request airdrops for test keypairs
    await Promise.all([
      requestAirdrop(connection, agentKeypair.publicKey),
      requestAirdrop(connection, targetAgentKeypair.publicKey),
    ]);

    // Mint tokens to agent vaults
    for (const authority of [agentKeypair, targetAgentKeypair]) {
      const agentVault = await getAgentVault(
        Number(authority.publicKey.toBuffer()[0])
      );
      await mintMearthTokens(
        connection,
        gameAuthority,
        agentVault.address,
        1000000000,
        mearthMint
      );
    }
  });

  it("should successfully form an alliance between two agents", async function () {
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };
    const formAllianceAction: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: targetAgent.profile.onchainId,
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
        joinerId: targetAgent.id,
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
        gameId: activeGame.dbGame.id,
        eventType: "ALLIANCE_FORM",
        initiatorId: ctx.agentId,
        targetId: targetAgent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.profile.xHandle);
  });

  it("should successfully break an existing alliance", async function () {
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };
    const formAllianceAction: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: targetAgent.profile.onchainId,
      tweet: "Forming alliance",
    };
    const breakAllianceAction: BreakAllianceAction = {
      type: "BREAK_ALLIANCE",
      targetId: targetAgent.profile.onchainId,
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
        joinerId: targetAgent.id,
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
        gameId: activeGame.dbGame.id,
        eventType: "ALLIANCE_BREAK",
        initiatorId: ctx.agentId,
        targetId: targetAgent.id,
      },
    });
    expect(event).to.not.be.null;
    expect(event?.message).to.include(agent.profile.xHandle);
    expect(event?.message).to.include(targetAgent.profile.xHandle);
  });

  it("should handle alliance formation during cooldown period", async function () {
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: targetAgent.profile.onchainId,
      tweet: "Forming alliance during cooldown",
    };

    // Create active cooldown
    await prisma.coolDown.create({
      data: {
        type: "Alliance",
        endsAt: new Date(Date.now() + 3600000), // 1 hour from now
        cooledAgentId: ctx.agentId,
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

  it("should handle breaking non-existent alliance", async function () {
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
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

  it("should handle attempting to form alliance with self", async function () {
    const ctx: ActionContext = {
      agentId: agent.id,
      agentOnchainId: agent.profile.onchainId,
      gameId: activeGame.dbGame.id,
      gameOnchainId: activeGame.dbGame.onchainId,
    };

    const action: FormAllianceAction = {
      type: "FORM_ALLIANCE",
      targetId: agent.profile.onchainId, // Same as initiator
      tweet: "Attempting to ally with self",
    };

    // Attempt to form alliance with self
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "Cannot form alliance with self"
    );
  });

  it("should handle attempting to form alliance with already allied agent", async function () {
    // Setup test data
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

    // Attempt to form second alliance
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "already in an alliance"
    );
  });

  it("should handle breaking alliance with wrong authority", async function () {
    // Setup test data
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

    // Attempt to break alliance with wrong authority
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("BREAK_ALLIANCE");
    expect(result.feedback?.error?.message).to.include(
      "not part of this alliance"
    );
  });

  it("should handle alliance formation with non-existent agent", async function () {
    // Setup test data
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

    // Attempt to form alliance with non-existent agent
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("Agent not found");
  });

  it("should handle alliance formation with dead agent", async function () {
    // Setup test data
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

    // Attempt to form alliance with dead agent
    const result = await allianceHandler.handle(ctx, action);

    // Assertions
    expect(result.success).to.be.false;
    expect(result.feedback?.isValid).to.be.false;
    expect(result.feedback?.error?.type).to.equal("FORM_ALLIANCE");
    expect(result.feedback?.error?.message).to.include("dead agent");
  });
});
