import { generateGameId } from "@/utils";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { prisma } from "./prisma";
import { getRandomCoordinatesWithTerrainType } from "@/constants";
import { profiles } from "./game-data";

/**
 * Creates a new game instance and initializes all required components
 * Handles both on-chain and database state management atomically
 * @returns Object containing created agents, game account and transaction hash
 */
export const createNextGame = async () => {
  logger.info(`🎮 Initializing new game world`);
  const program = await getProgramWithWallet();

  try {
    return await prisma.$transaction(
      async (prisma) => {
        // Deactivate all existing games
        await prisma.game.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        // Clear all map tile occupants
        await prisma.mapTile.updateMany({
          data: {
            occupiedBy: null,
          },
        });

        const nextGameId = await generateGameId();
        logger.info(`🌟 Creating new game with ID: ${nextGameId}`);

        const [gamePda, bump] = getGamePDA(
          program.programId,
          new BN(nextGameId)
        );
        logger.info(`🎮 Game PDA generated: ${gamePda}`);

        // Initialize game on-chain
        const tx = await program.methods
          .initializeGame(new BN(nextGameId), bump)
          .accounts({})
          .rpc();

        const gameAccount = await program.account.game.fetch(gamePda);

        // Create game record in database with validated data
        const dbGame = await prisma.game.create({
          data: {
            onchainId: nextGameId,
            authority: program.provider.publicKey?.toString() ?? "",
            bump,
            tokenMint: gameAccount.tokenMint.toString(),
            rewardsVault: gameAccount.rewardsVault.toString(),
            mapDiameter: Math.max(gameAccount.mapDiameter || 120, 1), // Ensure positive diameter
            dailyRewardTokens: Math.max(
              gameAccount.dailyRewardTokens.toNumber(),
              0
            ), // Ensure non-negative rewards
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(`✨ Game ${nextGameId} initialized successfully`);

        // Track occupied coordinates to prevent duplicates
        const occupiedCoordinates = new Set();

        const agents = await Promise.all(
          profiles.map(async (profile) => {
            const [agentPda] = getAgentPDA(
              program.programId,
              gamePda,
              new BN(profile.onchainId)
            );

            // Get unique coordinates for each agent
            let coordinates;
            do {
              coordinates = getRandomCoordinatesWithTerrainType();
            } while (
              occupiedCoordinates.has(`${coordinates.x},${coordinates.y}`)
            );

            occupiedCoordinates.add(`${coordinates.x},${coordinates.y}`);

            // Register agent on-chain
            await program.methods
              .registerAgent(
                new BN(profile.onchainId),
                new BN(coordinates.x),
                new BN(coordinates.y),
                profile.name
              )
              .accounts({
                game: gamePda,
                agent: agentPda,
                authority: program.provider.publicKey,
              })
              .rpc();

            const agentAccount = await program.account.agent.fetch(agentPda);

            // Create agent in database with proper error handling
            try {
              const agentDb = await prisma.agent.create({
                data: {
                  onchainId: profile.onchainId,
                  game: { connect: { id: dbGame.id } },
                  mapTiles: {
                    connect: {
                      x_y: {
                        x: coordinates.x,
                        y: coordinates.y,
                      },
                    },
                  },
                  profile: { connect: { id: profile.id } },
                  authority: agentAccount.authority.toString(),
                  health: 100, // Set initial health
                  isAlive: true,
                },
              });

              logger.info(`✅ Agent ${profile.onchainId} created successfully`);

              return {
                account: agentAccount,
                agent: agentDb,
              };
            } catch (error) {
              logger.error(
                `Failed to create agent ${profile.onchainId}:`,
                error
              );
              throw error;
            }
          })
        );

        return {
          agents,
          gameAccount: await program.account.game.fetch(gamePda),
          tx,
        };
      },
      {
        timeout: 60000, // Increased timeout for larger transactions
        maxWait: 65000,
        isolationLevel: "Serializable",
      }
    );
  } catch (error) {
    logger.error(`❌ Game initialization failed:`, error);
    throw error;
  }
};
