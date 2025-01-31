import { logger } from "@/utils/logger";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, SystemProgram, Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "@/utils";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { prisma } from "./prisma";
import { initializeServices } from "@/services";
import { AgentManager } from "@/agent/AgentManager";
import { GameAccount } from "@/types/program";
import { BN } from "@coral-xyz/anchor";
import { TerrainType } from "@prisma/client";
import { gameData } from "./game-data";
import { MearthProgram } from "@/types";

import { Prisma } from "@prisma/client";

type PrismaAgent = Prisma.AgentGetPayload<{
  include: {
    location: true;
    personality: true;
    state: true;
    community: true;
  };
}>;

type PrismaGame = Prisma.GameGetPayload<{
  include: {
    agents: {
      include: {
        location: true;
        personality: true;
        state: true;
        community: true;
      };
    };
  };
}>;

interface WalletError extends Error {
  message: string;
}

interface ChainError extends Error {
  logs?: string[];
}

/**
 * Initialize the application and set up all required services and connections.
 * This function handles the complete initialization flow including:
 * 1. Setting up Solana connection with proper configuration
 * 2. Initializing wallet and program instance
 * 3. Managing game state (finding active or creating new)
 * 4. Registering and syncing agents across chain and database
 * 5. Starting core services and agent management system
 *
 * @throws {Error} If required environment variables are missing
 * @throws {Error} If any initialization step fails
 * @returns {Promise<void>}
 */
export async function setup(): Promise<void> {
  try {
    logger.info("🚀 Starting application initialization...");

    // Validate environment variables
    const rpcUrl = process.env.SOLANA_RPC_URL;
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;

    if (!rpcUrl || !privateKeyString) {
      logger.error("❌ Missing environment variables!", {
        rpcUrl: !!rpcUrl,
        privateKeyPresent: !!privateKeyString,
      });
      throw new Error(
        "Missing required environment variables: SOLANA_RPC_URL or WALLET_PRIVATE_KEY"
      );
    }

    logger.info("✅ Environment variables validated", {
      rpcUrl: rpcUrl.substring(0, 20) + "...",
    });

    // Initialize Solana connection with optimized settings
    const connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
    logger.info("🌐 Solana connection established", {
      endpoint: rpcUrl.substring(0, 20) + "...",
      commitment: "confirmed",
    });

    // Initialize wallet with error handling
    let keypair: Keypair;

    try {
      const privateKey = bs58.decode(privateKeyString);
      keypair = Keypair.fromSecretKey(privateKey);
      logger.info("🔑 Authority wallet initialized", {
        publicKey: keypair.publicKey.toBase58(),
      });
    } catch (error) {
      const walletError = error as WalletError;
      logger.error("❌ Wallet initialization failed", {
        error: walletError.message,
      });
      throw new Error(`Failed to initialize wallet: ${walletError.message}`);
    }

    // Set up Anchor with optimized configuration
    const wallet = new anchor.Wallet(keypair);

    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    logger.info("⚓ Anchor provider configured", {
      commitment: provider.connection.commitment,
      wallet: wallet.publicKey.toBase58(),
    });

    const program = await getProgram(provider);
    logger.info("📦 Program initialized successfully", {
      programId: program.programId.toBase58(),
    });

    // Fetch and manage game accounts
    const gameAccounts = await program.account.game.all();
    logger.info(`🎮 Found existing games`, {
      count: gameAccounts.length,
      gameIds: gameAccounts.map((g) => g.account.gameId.toString()),
    });

    // Find active game or create new one
    logger.info("🔍 Looking for active game or creating new one...");
    const { mostRecentActiveGame, dbGame } = await getOrCreateGame(
      program,
      gameAccounts,
      keypair
    );

    logger.info("✅ Game setup complete", {
      gameId: mostRecentActiveGame.account.gameId.toString(),
      publicKey: mostRecentActiveGame.publicKey.toBase58(),
      dbId: dbGame.id,
    });

    const [gamePda] = getGamePDA(
      program.programId,
      mostRecentActiveGame.account.gameId
    );

    // First verify agent registration state
    logger.info("🔄 Verifying agent registration state...", {
      gamePda: gamePda.toBase58(),
      totalAgents: gameData.agents.length,
    });

    const registeredAgents = await prisma.agent.findMany({
      where: {
        gameId: mostRecentActiveGame.account.gameId.toString(),
      },
      include: {
        location: true,
        state: true,
      },
    });

    // Check for unregistered agents
    const unregisteredAgents = gameData.agents.filter(
      (agent) =>
        !registeredAgents.some(
          (registered) => registered.agentId === agent.agentId
        )
    );

    if (unregisteredAgents.length > 0) {
      logger.info("🔄 Found unregistered agents, starting sync...", {
        totalAgents: gameData.agents.length,
        registered: registeredAgents.length,
        unregistered: unregisteredAgents.length,
      });

      await syncAgents(program, gamePda, dbGame, keypair);
    } else {
      logger.info("✅ All agents already registered", {
        totalAgents: registeredAgents.length,
      });
    }

    // Initialize services and agent manager
    logger.info("🔧 Initializing core services...");
    await initializeServices(connection, program);

    const agentManager = AgentManager.getInstance();
    await agentManager.initializeAndStartAgents(mostRecentActiveGame.account);
    logger.info("✨ Core services initialized", {
      activeAgents: agentManager.getActiveAgents(),
    });

    logger.info("🎉 Application initialization completed successfully");
  } catch (error) {
    const appError = error as Error;
    logger.error("💥 Critical initialization failure", {
      error: appError.message,
      stack: appError.stack,
    });
    throw new Error(`Initialization failed: ${appError.message}`);
  }
}

/**
 * Helper function to get existing or create new game
 */
async function getOrCreateGame(
  program: MearthProgram,
  gameAccounts: { publicKey: PublicKey; account: GameAccount }[],
  keypair: Keypair
) {
  logger.info("🎲 Processing game accounts", {
    totalAccounts: gameAccounts.length,
    accounts: gameAccounts.map((g) => ({
      id: g.account.gameId.toString(),
      publicKey: g.publicKey.toBase58(),
      isActive: g.account.isActive,
    })),
  });

  // Sort games by ID in descending order to get the most recent first
  const sortedGames = gameAccounts.sort((a, b) =>
    b.account.gameId.sub(a.account.gameId).toNumber()
  );

  // Find the most recent active game
  const mostRecentActiveGame = sortedGames.find((g) => g.account.isActive);

  if (!mostRecentActiveGame) {
    logger.info("🆕 No active games found, creating new game");
    return await createNewGame(program, sortedGames, keypair);
  }

  logger.info("🔍 Looking up game in database", {
    gameId: mostRecentActiveGame.account.gameId.toString(),
    isActive: mostRecentActiveGame.account.isActive,
  });

  // Check if game exists in database
  let dbGame = await prisma.game.findUnique({
    where: { gameId: mostRecentActiveGame.account.gameId.toNumber() },
    include: {
      agents: {
        include: {
          location: true,
          personality: true,
          state: true,
          community: true,
        },
      },
    },
  });

  // If game exists on-chain but not in DB, create DB record
  if (!dbGame) {
    logger.info("🔄 Game exists on-chain but not in database, syncing...", {
      gameId: mostRecentActiveGame.account.gameId.toString(),
    });

    try {
      // Calculate bump for existing PDA
      const [_, bump] = getGamePDA(
        program.programId,
        mostRecentActiveGame.account.gameId
      );

      dbGame = await createGameInDB(
        mostRecentActiveGame,
        mostRecentActiveGame.account.gameId,
        keypair,
        bump
      );

      logger.info("✅ Game synced to database successfully", {
        gameId: dbGame.gameId,
        chainPublicKey: mostRecentActiveGame.publicKey.toBase58(),
      });
    } catch (error) {
      logger.error("❌ Failed to sync on-chain game to database", {
        error: (error as Error).message,
        gameId: mostRecentActiveGame.account.gameId.toString(),
      });
      throw new Error(
        `Failed to sync game to database: ${(error as Error).message}`
      );
    }
  }

  return { mostRecentActiveGame, dbGame };
}

/**
 * Helper function to create a new game both on-chain and in database
 */
async function createNewGame(
  program: MearthProgram,
  existingGames: { publicKey: PublicKey; account: GameAccount }[],
  keypair: Keypair
) {
  // Calculate new game ID
  const gameId =
    existingGames.length > 0
      ? existingGames[0].account.gameId.add(new BN(1))
      : new BN(1);

  logger.info("🆕 Creating new game", { gameId: gameId.toString() });

  // Get PDA for new game
  const [gamePda, bump] = getGamePDA(program.programId, gameId);

  try {
    // Verify the PDA is not already in use
    const existingAccount = await program.provider.connection.getAccountInfo(
      gamePda
    );
    if (existingAccount) {
      logger.error("❌ Game PDA already in use", {
        pda: gamePda.toBase58(),
        gameId: gameId.toString(),
      });
      throw new Error("Game PDA already in use");
    }

    // Initialize game on-chain
    await program.methods
      .initializeGame(gameId, bump)
      .accounts({ authority: keypair.publicKey })
      .rpc();

    logger.info("✅ Game initialized on chain", {
      gamePda: gamePda.toBase58(),
      bump,
    });

    // Fetch the newly created game account
    const gameAccount = await program.account.game.fetch(gamePda);

    // Verify the game is active
    if (!gameAccount.isActive) {
      logger.error("❌ Newly created game is not active!");
      throw new Error("Failed to create active game");
    }

    const mostRecentActiveGame = {
      publicKey: gamePda,
      account: gameAccount,
    };

    logger.info("💾 Creating game record in database...");
    const dbGame = await createGameInDB(
      mostRecentActiveGame,
      gameId,
      keypair,
      bump
    );

    logger.info("✅ Game created successfully", {
      dbId: dbGame.id,
      gameId: dbGame.gameId,
      isActive: gameAccount.isActive,
    });

    return { mostRecentActiveGame, dbGame };
  } catch (error) {
    logger.error("❌ Failed to create new game", {
      error: (error as Error).message,
      gameId: gameId.toString(),
    });
    throw new Error(`Failed to create new game: ${(error as Error).message}`);
  }
}

/**
 * Helper function to sync agents between chain and database
 */
async function syncAgents(
  program: MearthProgram,
  gamePda: PublicKey,
  dbGame: PrismaGame,
  keypair: Keypair
) {
  logger.info("🔄 Starting agent synchronization process", {
    totalAgents: gameData.agents.length,
    existingAgents: dbGame.agents.length,
  });

  for (const agent of gameData.agents as PrismaAgent[]) {
    // Check if the agent is already in the database
    if (!dbGame.agents.find((a) => a.agentId === agent.agentId)) {
      logger.info(`👤 Processing new agent`, {
        name: agent.name,
        agentId: agent.agentId,
      });

      const agentKeypair = Keypair.generate();

      const walletInfo = `${bs58.encode(
        agentKeypair.secretKey
      )},${agentKeypair.publicKey.toBase58()}`;

      await registerAgentOnChain(program, gamePda, agent, keypair);

      await createAgentInDB(agent, dbGame.id.toString(), walletInfo);
      logger.info(`✅ Agent synchronized successfully`, {
        name: agent.name,
        publicKey: agentKeypair.publicKey.toBase58(),
      });
    }
  }
}

/**
 * Helper function to create game record in database
 */
async function createGameInDB(
  mostRecentActiveGame: any,
  gameId: BN,
  keypair: Keypair,
  bump: number
): Promise<PrismaGame> {
  logger.info("📝 Creating game record in database", {
    gameId: gameId.toString(),
    authority: keypair.publicKey.toBase58(),
  });

  const game = await prisma.game.create({
    data: {
      gameId: gameId.toNumber(),
      authority: keypair.publicKey.toBase58(),
      tokenMint: mostRecentActiveGame.account.tokenMint.toBase58(),
      rewardsVault: mostRecentActiveGame.account.rewardsVault.toBase58(),
      mapDiameter: mostRecentActiveGame.account.mapDiameter,
      isActive: mostRecentActiveGame.account.isActive,
      bump,
      dailyRewardTokens:
        mostRecentActiveGame.account.dailyRewardTokens.toNumber(),
    },
    include: {
      agents: {
        include: {
          location: true,
          personality: true,
          state: true,
          community: true,
        },
      },
    },
  });

  logger.info("✅ Game record created", {
    id: game.id,
    gameId: game.gameId,
    tokenMint: game.tokenMint,
    isActive: game.isActive,
  });

  return game;
}

/**
 * Helper function to register agent on chain
 */
async function registerAgentOnChain(
  program: MearthProgram,
  gamePda: PublicKey,
  agent: PrismaAgent,
  keypair: Keypair
) {
  logger.info(`⛓️ Registering agent on chain`, {
    name: agent.name,
    agentId: agent.agentId,
    gamePda: gamePda.toBase58(),
  });

  const agentId = new anchor.BN(agent.id);

  const [agentPda] = getAgentPDA(program.programId, gamePda, agentId);

  try {
    await program.methods
      .registerAgent(
        agentId,
        new BN(agent.location?.x || 0),
        new BN(agent.location?.y || 0),
        agent.name
      )
      .accountsStrict({
        authority: keypair.publicKey,
        game: gamePda,
        agent: agentPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    logger.info(`✅ Agent registered on chain`, {
      name: agent.name,
      pda: agentPda.toBase58(),
      location: { x: agent.location?.x || 0, y: agent.location?.y || 0 },
    });
  } catch (error) {
    const chainError = error as ChainError;
    if (!chainError.logs?.some((log) => log.includes("already in use"))) {
      logger.error(`❌ Failed to register agent on chain`, {
        name: agent.name,
        error: chainError.message,
        logs: chainError.logs,
      });
      throw error;
    }
    logger.warn(`⚠️ Agent already exists on chain`, {
      name: agent.name,
      pda: agentPda.toBase58(),
    });
  }
}

/**
 * Helper function to create agent record in database
 */
async function createAgentInDB(
  agent: PrismaAgent,
  gameId: string,
  walletInfo: string
) {
  logger.info(`💾 Creating database record for agent`, {
    name: agent.name,
    agentId: agent.agentId,
    gameId,
  });

  const createdAgent = await prisma.agent.create({
    data: {
      agentId: agent.agentId,
      name: agent.name,
      xHandle: agent.xHandle,
      publicKey: walletInfo,
      bio: agent.bio,
      lore: agent.lore,
      characteristics: agent.characteristics,
      knowledge: agent.knowledge,
      gameId,
      location: {
        create: {
          x: agent.location?.x || 0,
          y: agent.location?.y || 0,
          terrainType: agent.location?.terrainType || TerrainType.Plain,
          stuckTurnsRemaining: agent.location?.stuckTurnsRemaining || 0,
        },
      },
      personality: {
        create: {
          aggressiveness: agent.personality?.aggressiveness || 0,
          trustworthiness: agent.personality?.trustworthiness || 0,
          manipulativeness: agent.personality?.manipulativeness || 0,
          intelligence: agent.personality?.intelligence || 0,
          adaptability: agent.personality?.adaptability || 0,
          baseInfluence: agent.personality?.baseInfluence || 0,
          followerMultiplier: agent.personality?.followerMultiplier || 0,
          engagementMultiplier: agent.personality?.engagementMultiplier || 0,
          consensusMultiplier: agent.personality?.consensusMultiplier || 0,
        },
      },
      state: {
        create: {
          isAlive: agent.state?.isAlive ?? true,
          health: agent.state?.health ?? 100,
          lastActionType: agent.state?.lastActionType || "spawn",
          lastActionDetails: agent.state?.lastActionDetails || "Initial spawn",
        },
      },
      community: {
        create: {
          followers: 0,
          averageEngagement: 0,
          supporterCount: 0,
        },
      },
    },
  });

  logger.info(`✅ Database record created for agent`, {
    name: agent.name,
    id: createdAgent.id,
    location: { x: agent.location?.x || 0, y: agent.location?.y || 0 },
    health: agent.state?.health ?? 100,
  });
}
