import { generateGameId } from "@/utils";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { prisma } from "./prisma";
import { getRandomCoordinatesWithTerrainType } from "@/constants";
import { profiles } from "./game-data";

export const createNextGame = async () => {
  logger.info(`🎮 Initializing new game world`);

  const program = await getProgramWithWallet();

  try {
    // Execute everything in a single transaction to ensure atomicity
    return await prisma.$transaction(
      async (prisma) => {
        const nextGameId = await generateGameId();
        logger.info(`🌟 Checking for existing game - Game ID: ${nextGameId}`);

        const [gamePda, bump] = getGamePDA(
          program.programId,
          new BN(nextGameId)
        );
        logger.info(`🎮 Game PDA in initializeGame: ${gamePda}`);

        // Initialize game on-chain
        const tx = await program.methods
          .initializeGame(new BN(nextGameId), bump)
          .accounts({})
          .rpc();

        const gameAccount = await program.account.game.fetch(gamePda);

        // Create game record in database
        await prisma.game.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        const dbGame = await prisma.game.create({
          data: {
            onchainId: nextGameId,
            authority: program.provider.publicKey?.toString() ?? "",
            bump: bump,
            tokenMint: gameAccount.tokenMint.toString(),
            rewardsVault: gameAccount.rewardsVault.toString(),
            mapDiameter: gameAccount.mapDiameter || 120,
            dailyRewardTokens: gameAccount.dailyRewardTokens.toNumber(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(`✨ Game ${nextGameId} initialized successfully`);

        const agents = await Promise.all(
          profiles.map(async (profile) => {
            const [agentPda] = getAgentPDA(
              program.programId,
              gamePda,
              new BN(profile.onchainId)
            );
            const { x, y } = getRandomCoordinatesWithTerrainType();
            // Register agent on-chain
            await program.methods
              .registerAgent(
                new BN(profile.onchainId),
                new BN(x),
                new BN(y),
                profile.name
              )
              .accounts({
                game: gamePda,
                agent: agentPda,
                authority: program.provider.publicKey,
              })
              .rpc();
            const agentAccount = await program.account.agent.fetch(agentPda);

            // Create agent in database
            const agentDb = await prisma.agent.create({
              data: {
                onchainId: profile.onchainId,
                game: { connect: { id: dbGame.id } },
                mapTiles: {
                  connect: {
                    x_y: {
                      x,
                      y,
                    },
                  },
                },
                profile: { connect: { id: profile.id } },
                authority: agentAccount.authority.toString(),
              },
            });
            logger.info(
              `✅ Agent ${profile.onchainId} created in database successfully`
            );

            return {
              account: agentAccount,
              agent: agentDb,
            };
          })
        );

        return {
          agents,
          gameAccount: await program.account.game.fetch(gamePda),
          tx,
        };
      },
      {
        timeout: 30000, // 30 second timeout for the entire transaction
        maxWait: 35000, // Maximum time to wait for transaction to start
        isolationLevel: "Serializable", // Highest isolation level for true atomicity
      }
    );
  } catch (error) {
    logger.error(`❌ Game initialization failed:`, error);
    // If anything fails, both database and blockchain operations will be rolled back
    throw error;
  }
};
