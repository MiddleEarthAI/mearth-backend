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
  getActiveGame(): Promise<GameResult | null>;
  resetGameState(gameId: string): Promise<void>;
}

export class GameManager implements IGameManager {
  constructor(
    readonly program: Program<MiddleEarthAiProgram>,
    readonly prisma: PrismaClient
  ) {}
  /**
   * Gets the currently active game
   */
  public async getActiveGame(): Promise<GameResult | null> {
    const dbGame = await this.prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        agents: true,
      },
    });
    if (!dbGame) {
      return null;
    }
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
    console.info(`🏁 Game ${gameOnchainId} ended`);
  }

  /**
   * Resets game state for a specific game
   */
  public async resetGameState(gameId: string): Promise<void> {
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
    console.info(`🔄 Game ${gameId} state reset`);
  }

  /**
   * Creates a new game instance with all required components
   */
  public async createNewGame(): Promise<GameInitResult> {
    console.info(`🎮 Initializing new game world`);
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          await this.prisma.game.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          });

          const nextGameId = await generateGameId();

          const [gamePda, bump] = getGamePDA(
            this.program.programId,
            new BN(nextGameId)
          );

          const tx = await this.program.methods
            .initializeGame(new BN(nextGameId), bump)
            .accounts({})
            .rpc();

          const gameAccount = await this.program.account.game.fetch(gamePda);

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

          const agents = await this.initializeAgents(gamePda, dbGame);

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
    return Promise.all(
      profiles.map(async (profile) => {
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          new BN(profile.onchainId)
        );
        // Get a random plain tile that is not occupied by any agent
        const spawnTile = await this.prisma.mapTile
          .findMany({
            where: {
              agent: null,
            },
            orderBy: {
              // Use random ordering to get a random tile
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

        await this.program.methods
          .registerAgent(
            new BN(profile.onchainId),
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
          `✅ Agent ${profile.onchainId} created at (${spawnTile.x}, ${spawnTile.y})`
        );

        return {
          account: agentAccount,
          agent: agentDb,
        };
      })
    );
  }
}
