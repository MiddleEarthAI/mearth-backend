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
import { FieldType } from "@prisma/client";
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
    // Validate environment variables
    const rpcUrl = process.env.SOLANA_RPC_URL;
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;

    if (!rpcUrl || !privateKeyString) {
      throw new Error(
        "Missing required environment variables: SOLANA_RPC_URL or WALLET_PRIVATE_KEY"
      );
    }

    // Initialize Solana connection with optimized settings
    const connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });

    // Initialize wallet with error handling
    let keypair: Keypair;
    try {
      const privateKey = bs58.decode(privateKeyString);
      keypair = Keypair.fromSecretKey(privateKey);
      logger.info("Authority initialized:", keypair.publicKey.toBase58());
    } catch (error) {
      const walletError = error as WalletError;
      throw new Error(`Failed to initialize wallet: ${walletError.message}`);
    }

    // Set up Anchor with optimized configuration
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });

    const program = await getProgram(provider);
    logger.info("Program initialized successfully");

    // Fetch and manage game accounts
    const gameAccounts = await program.account.game.all();
    logger.debug(`Found ${gameAccounts.length} existing games`);

    // Find active game or create new one with optimized logic
    const { activeGame, dbGame } = await getOrCreateGame(
      program,
      gameAccounts,
      keypair
    );

    // Register and sync agents
    const [gamePda] = getGamePDA(program.programId, new BN(dbGame.gameId));
    await syncAgents(program, gamePda, dbGame, keypair);

    // Initialize core services and agent manager
    await initializeServices(connection, program);
    const agentManager = AgentManager.getInstance();
    await agentManager.initializeAndStartAgents(
      activeGame.account as GameAccount
    );

    logger.info("Application initialization completed successfully");
  } catch (error) {
    const appError = error as Error;
    logger.error("Critical initialization failure:", appError);
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
  console.log("gameAccounts", JSON.stringify(gameAccounts, null, 2));

  let activeGame = gameAccounts.sort((a, b) =>
    b.account.gameId.sub(a.account.gameId).toNumber()
  )[0];

  let dbGame = activeGame
    ? await prisma.game.findUnique({
        where: { gameId: activeGame.account.gameId.toNumber() },
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
      })
    : null;

  if (!activeGame || !dbGame) {
    const gameId =
      gameAccounts.length > 0
        ? gameAccounts[0].account.gameId.add(new BN(1))
        : new BN(1);

    const [gamePda, bump] = getGamePDA(program.programId, gameId);

    await program.methods
      .initializeGame(gameId, bump)
      .accounts({ authority: keypair.publicKey })
      .rpc();

    activeGame = {
      publicKey: gamePda,
      account: await program.account.game.fetch(gamePda),
    };

    dbGame = await createGameInDB(activeGame, gameId, keypair, bump);
  }

  return { activeGame, dbGame };
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
  for (const agent of gameData.agents as PrismaAgent[]) {
    if (!dbGame.agents.find((a) => a.agentId === agent.agentId)) {
      const agentKeypair = Keypair.generate();
      const walletInfo = `${bs58.encode(
        agentKeypair.secretKey
      )},${agentKeypair.publicKey.toBase58()}`;

      await registerAgentOnChain(program, gamePda, agent, keypair);
      await createAgentInDB(agent, dbGame.id.toString(), walletInfo);
    }
  }
}

/**
 * Helper function to create game record in database
 */
async function createGameInDB(
  activeGame: any,
  gameId: BN,
  keypair: Keypair,
  bump: number
): Promise<PrismaGame> {
  return prisma.game.create({
    data: {
      gameId: gameId.toNumber(),
      authority: keypair.publicKey.toBase58(),
      tokenMint: activeGame.account.tokenMint.toBase58(),
      rewardsVault: activeGame.account.rewardsVault.toBase58(),
      mapDiameter: activeGame.account.mapDiameter,
      isActive: activeGame.account.isActive,
      bump,
      dailyRewardTokens: activeGame.account.dailyRewardTokens.toNumber(),
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
  const [agentPda] = getAgentPDA(program.programId, gamePda, agent.agentId);
  const agentId = new anchor.BN(agent.id);

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
  } catch (error) {
    const chainError = error as ChainError;
    if (!chainError.logs?.some((log) => log.includes("already in use"))) {
      throw error;
    }
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
  await prisma.agent.create({
    data: {
      agentId: agent.agentId,
      name: agent.name,
      xHandle: agent.xHandle,
      publicKey: walletInfo,
      backstory: agent.backstory,
      characteristics: agent.characteristics,
      gameId,
      location: {
        create: {
          x: agent.location?.x || 0,
          y: agent.location?.y || 0,
          fieldType: agent.location?.fieldType || FieldType.Plain,
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
}
