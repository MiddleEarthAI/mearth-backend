import { generateGameId } from "@/utils";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { BN } from "@coral-xyz/anchor";
import { profiles } from "../config/game-data";
import { Game, Agent, PrismaClient } from "@prisma/client";
import { Program } from "@coral-xyz/anchor";
import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { GameAccount, AgentAccount } from "@/types/program";
import { gameConfig, solanaConfig } from "../config/env";
import { PublicKey } from "@solana/web3.js";

interface GameInitResult {
  dbGame: Game;
  agents: Array<{
    account: AgentAccount;
    agent: Agent;
  }>;
  gameAccount: GameAccount;
  tx: string;
}
interface GameResult {
  dbGame: Game;
  gameAccount: GameAccount;
  agents: Array<{
    account: AgentAccount;
    agent: Agent;
  }>;
}

interface IGameManager {
  createNewGame(): Promise<GameInitResult>;
  endGame(gameId: string): Promise<void>;
  getOrCreateActiveGame(): Promise<GameResult>;
  getActiveGame(): Promise<GameResult>;
  resetGameState(gameId: string): Promise<void>;
}

export class GameManager implements IGameManager {
  constructor(
    readonly program: Program<MiddleEarthAiProgram>,
    readonly prisma: PrismaClient
  ) {}
  /**
   * Gets the currently active game or creates a new one if none exists
   */
  public async getOrCreateActiveGame(): Promise<GameResult> {
    console.info("🔍 Searching for active game...");
    const dbGame = await this.prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        agents: true,
      },
    });

    // If no active game exists, create a new one
    if (!dbGame) {
      console.info("❌ No active game found");
      console.info("🎲 Initiating new game creation process...");
      const newGame = await this.createNewGame();
      console.info("✨ New game successfully created and initialized");
      return {
        dbGame: newGame.dbGame,
        gameAccount: newGame.gameAccount,
        agents: newGame.agents,
      };
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
    };
  }

  /**
   * Gets the currently active game. Throws error if no active game exists.
   * @throws Error when no active game is found
   */
  public async getActiveGame(): Promise<GameResult> {
    console.info("🔍 Searching for active game...");
    const dbGame = await this.prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        agents: true,
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
    };
  }

  /**
   * Ends a specific game
   */
  public async endGame(gameOnchainId: BN): Promise<void> {
    console.info(`🔄 Initiating end game process for game ${gameOnchainId}`);
    const [gamePda] = getGamePDA(this.program.programId, gameOnchainId);
    await this.program.methods
      .endGame()
      .accounts({
        game: gamePda,
      })
      .rpc();

    await this.prisma.game.update({
      where: { id: gameOnchainId },
      data: { isActive: false },
    });
    console.info(`🏁 Game ${gameOnchainId} successfully ended`);
  }

  /**
   * Resets game state for a specific game
   */
  public async resetGameState(gameId: string): Promise<void> {
    console.info(`🔄 Initiating game state reset for game ${gameId}`);
    await this.prisma.$transaction([
      this.prisma.agent.updateMany({
        where: { gameId },
        data: { health: 100, isAlive: true },
      }),
      this.prisma.coolDown.deleteMany({
        where: { gameId },
      }),
      this.prisma.battle.deleteMany({
        where: { gameId },
      }),
    ]);
    console.info(`✅ Game ${gameId} state successfully reset`);
  }

  /**
   * Creates a new game instance with all required components
   */
  public async createNewGame(): Promise<GameInitResult> {
    console.info(`🎮 Initializing new game world`);
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          console.info("🔄 Deactivating any existing active games...");
          await this.prisma.game.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          });

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
            .rpc();

          const gameAccount = await this.program.account.game.fetch(gamePda);
          console.info("✅ Game account fetched from chain");

          console.info("💾 Creating game record in database...");
          const dbGame = await this.prisma.game.create({
            data: {
              onchainId: nextGameId,
              authority: gameAccount.authority.toString(),
              tokenMint: solanaConfig.tokenMint,
              rewardsVault: gameAccount.rewardsVault.toString(),
              mapDiameter: gameConfig.mapDiameter,
              bump: bump,
              dailyRewardTokens: gameConfig.dailyRewardTokens,
              isActive: true,
              lastUpdate: new Date(gameAccount.lastUpdate.toNumber() * 1000),
            },
          });

          console.info("👥 Initializing game agents...");
          const agents = await this.initializeAgents(
            gamePda,
            nextGameId,
            dbGame
          );
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

  private async initializeAgents(
    gamePda: PublicKey,
    nextGameId: number,
    dbGame: Game
  ) {
    console.info("🎭 Starting agent initialization process...");
    return Promise.all(
      profiles.map(async (profile) => {
        console.info(`👤 Initializing agent for profile: ${profile.name}`);
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          new BN(profile.onchainId)
        );

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
        await this.program.methods
          .registerAgent(
            new BN(profile.onchainId + nextGameId),
            new BN(spawnTile.x),
            new BN(spawnTile.y),
            profile.name
          )
          .accounts({
            game: gamePda,
            agent: agentPda,
          })
          .rpc();

        const agentAccount = await this.program.account.agent.fetch(agentPda);

        console.info(`💾 Creating agent database record...`);
        const agentDb = await this.prisma.agent.create({
          data: {
            onchainId: profile.onchainId,
            gameId: dbGame.id,
            mapTileId: spawnTile.id,
            profileId: profile.id,
            authority: agentAccount.authority.toString(),
            health: 100,
            isAlive: true,
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
