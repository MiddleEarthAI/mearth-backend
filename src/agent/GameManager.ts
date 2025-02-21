import { generateGameId } from "@/utils";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { Game, PrismaClient, Prisma } from "@prisma/client";
import { Program } from "@coral-xyz/anchor";
import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { GameAccount, AgentAccount } from "@/types/program";
import { gameConfig, solanaConfig } from "../config/env";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  getAgentAuthorityAta,
  getAgentAuthorityKeypair,
  getAgentVault,
  getMiddleEarthAiAuthorityWallet,
  getRewardsVault,
} from "@/utils/program";
import { GameInfo } from "@/types";

const { BN } = anchor;

interface IGameManager {
  createNewGame(): Promise<GameInfo>;
  endGame(gameId: string): Promise<void>;
  getOrCreateActiveGame(): Promise<GameInfo>;
  getActiveGame(): Promise<GameInfo>;
}

export class GameManager implements IGameManager {
  constructor(
    readonly program: Program<MiddleEarthAiProgram>,
    readonly prisma: PrismaClient
  ) {}
  /**
   * Gets the currently active game or creates a new one if none exists
   */
  public async getOrCreateActiveGame(): Promise<GameInfo> {
    console.info("🔍 Searching for active game...");
    const dbGame = await this.prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        agents: {
          include: {
            profile: true,
          },
        },
      },
    });

    // If no active game exists, create a new one
    if (!dbGame) {
      console.info("❌ No active game found");
      console.info("🎲 Initiating new game creation process...");
      const newGameInfo = await this.createNewGame();
      console.info("✨ New game successfully created and initialized");
      return newGameInfo;
    }

    console.info(`✅ Found active game with ID: ${dbGame.onchainId}`);
    console.info("🔄 Fetching game and agent data...");

    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(dbGame.onchainId)
    );
    const gameAccount = await this.program.account.game.fetch(gamePda);

    const agents = await Promise.all(
      dbGame.agents.map(async (agent) => {
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          new BN(agent.onchainId)
        );
        const agentAccount = await this.program.account.agent.fetch(agentPda);
        return {
          account: agentAccount,
          agent,
        };
      })
    );

    console.info(`📊 Loaded ${agents.length} agents for active game`);
    return {
      dbGame,
      gameAccount,
      agents,
      tx: "",
    };
  }

  /**
   * Gets the currently active game. Throws error if no active game exists.
   * @throws Error when no active game is found
   */
  public async getActiveGame(): Promise<GameInfo> {
    console.info("🔍 Searching for active game...");
    const dbGame = await this.prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        agents: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!dbGame) {
      console.error("❌ No active game found");
      throw new Error("No active game exists");
    }

    console.info(`✅ Found active game with ID: ${dbGame.onchainId}`);
    console.info("🔄 Fetching game and agent data...");

    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(dbGame.onchainId)
    );
    const gameAccount = await this.program.account.game.fetch(gamePda);

    const agents = await Promise.all(
      dbGame.agents.map(async (agent) => {
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          new BN(agent.onchainId)
        );
        const agentAccount = await this.program.account.agent.fetch(agentPda);
        return {
          account: agentAccount,
          agent,
        };
      })
    );

    console.info(`📊 Loaded ${agents.length} agents for active game`);
    return {
      dbGame,
      gameAccount,
      agents,
      tx: "",
    };
  }

  /**
   * Ends a specific game
   */
  public async endGame(gameOnchainId: typeof BN): Promise<void> {
    const gameAuthWallet = await getMiddleEarthAiAuthorityWallet();
    console.info(`🔄 Initiating end game process for game ${gameOnchainId}`);
    const [gamePda] = getGamePDA(this.program.programId, gameOnchainId);
    await this.program.methods
      .endGame()
      .accounts({
        game: gamePda,
      })
      .signers([gameAuthWallet.keypair])
      .rpc();

    await this.prisma.game.update({
      where: { id: gameOnchainId },
      data: { isActive: false },
    });
    console.info(`🏁 Game ${gameOnchainId} successfully ended`);
  }

  /**
   * Creates a new game instance with all required components
   */
  public async createNewGame(): Promise<GameInfo> {
    console.info(`🎮 Initializing new game world`);
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          console.info("🔄 Deactivating any existing active games...");
          await prisma.game.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          });

          const gameAuthWallet = await getMiddleEarthAiAuthorityWallet();

          const nextGameId = await generateGameId();
          console.info(`🎲 Generated new game ID: ${nextGameId}`);

          const [gamePda, bump] = getGamePDA(
            this.program.programId,
            new BN(nextGameId)
          );

          console.info("🔗 Initializing game on-chain...");
          const tx = await this.program.methods
            .initializeGame(new BN(nextGameId), bump)
            .accounts({})
            .signers([gameAuthWallet.keypair])
            .rpc();

          const gameAccount = await this.program.account.game.fetch(gamePda);
          console.info("✅ Game account fetched from chain");

          console.info("💾 Creating game record in database...");

          const rewardsVault = await getRewardsVault();
          console.info(
            "💰 Rewards vault created",
            rewardsVault.address.toBase58()
          );

          const dbGame = await this.prisma.game.create({
            data: {
              pda: gamePda.toString(),
              onchainId: nextGameId,
              authority: gameAuthWallet.keypair.publicKey.toString(),
              tokenMint: solanaConfig.tokenMint,
              rewardsVault: rewardsVault.address.toBase58(),
              mapDiameter: gameConfig.mapDiameter,
              bump: bump,
              dailyRewardTokens: gameConfig.dailyRewardTokens,
              isActive: true,
              lastUpdate: new Date(gameAccount.lastUpdate * 1000),
            },
            include: {
              agents: {
                include: {
                  profile: true,
                },
              },
            },
          });

          console.info("👥 Initializing game agents...");
          const agents = await this.initializeAgents(gamePda, dbGame);
          console.info(`✅ Successfully initialized ${agents.length} agents`);

          return {
            agents,
            gameAccount,
            dbGame,
            tx,
          };
        },
        {
          timeout: 60000,
          maxWait: 65000,
          isolationLevel: "Serializable",
        }
      );
    } catch (error) {
      console.error(`❌ Game initialization failed:`, error);
      throw error;
    }
  }

  private async initializeAgents(gamePda: PublicKey, dbGame: Game) {
    console.info("🎭 Starting agent initialization process...");
    // clear all map off occupants
    await this.prisma.mapTile.updateMany({
      data: {
        agentId: null,
      },
    });
    const profiles = await this.prisma.agentProfile.findMany();
    return Promise.all(
      profiles.map(async (profile, index) => {
        console.info(`👤 Initializing agent for profile: ${profile.name}`);
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          new BN(profile.onchainId)
        );

        console.log("creating ata...........................................");
        const ata = await getAgentAuthorityAta(profile.onchainId);
        console.info("💰 Agent authority ATA created", ata.address.toBase58());

        console.info("🎯 Finding spawn location...");
        const spawnTile = await this.prisma.mapTile
          .findMany({
            where: {
              agent: null,
            },
            orderBy: {
              id: "asc",
            },
            take: 1,
            skip: Math.floor(
              Math.random() *
                (await this.prisma.mapTile.count({
                  where: {
                    agent: null,
                  },
                }))
            ),
          })
          .then((tiles) => tiles[0]);

        console.info(`🔗 Registering agent on-chain...`);

        const agentAuthKeypair = await getAgentAuthorityKeypair(
          profile.onchainId
        );

        await this.program.methods
          .registerAgent(
            new BN(profile.onchainId),
            new BN(spawnTile.x),
            new BN(spawnTile.y),
            profile.name
          )
          .accountsStrict({
            game: gamePda,
            agent: agentPda,
            authority: agentAuthKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([agentAuthKeypair])
          .rpc();

        const agentAccount = await this.program.account.agent.fetch(agentPda);

        console.info(`💾 Creating agent database record...`);

        const agentVault = await getAgentVault(profile.onchainId);

        const agentDb = await this.prisma.agent.create({
          data: {
            vault: agentVault.address.toString(),
            onchainId: profile.onchainId,
            pda: agentPda.toString(),
            gameId: dbGame.id,
            mapTileId: spawnTile.id,
            profileId: profile.id,
            authority: agentAuthKeypair.publicKey.toString(),
            authorityAssociatedTokenAddress: ata.address.toString(),
            isAlive: true,
          },
          include: {
            profile: true,
          },
        });

        console.info(
          `✅ Agent ${profile.name} (ID: ${profile.onchainId}) created at (${spawnTile.x}, ${spawnTile.y})`
        );

        return {
          account: agentAccount,
          agent: agentDb,
        };
      })
    );
  }
}
