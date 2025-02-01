import { generateGameId } from "@/utils";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { prisma } from "./prisma";
import { TerrainType } from "@prisma/client";
import { getRandomCoordinatesWithTerrainType } from "@/constants";
import { profiles } from "./game-data";

export const createNextGame = async () => {
  // await prisma.agentProfile.createMany({
  //   data: profiles,
  // });
  logger.info(`🎮 Initializing new game world`);

  const program = await getProgramWithWallet();

  try {
    const nextGameId = generateGameId();

    logger.info(`🌟 Checking for existing game - Game ID: ${nextGameId}`);

    const [gamePda, bump] = getGamePDA(program.programId, new BN(nextGameId));

    logger.info(`🎮 Game PDA in initializeGame: ${gamePda}`);

    const tx = await program.methods
      .initializeGame(new BN(nextGameId), bump)
      .accounts({})
      .rpc();
    const gameAccount = await program.account.game.fetch(gamePda);

    // Create game record in database
    const dbGame = await prisma.game.create({
      data: {
        gameId: nextGameId,
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

    for (const profile of profiles) {
      const [gamePda] = getGamePDA(program.programId, new BN(nextGameId));
      const [agentPda] = getAgentPDA(
        program.programId,
        gamePda,
        new BN(profile.onchainId)
      );
      const { x, y, terrainType } = getRandomCoordinatesWithTerrainType();
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

      await prisma.agent.create({
        data: {
          agentId: profile.onchainId,
          game: { connect: { id: dbGame.id } },
          location: {
            create: {
              x,
              y,
              terrainType:
                Object.keys(terrainType)[0] == "plain"
                  ? TerrainType.Plain
                  : Object.keys(terrainType)[0] == "mountain"
                  ? TerrainType.Mountain
                  : TerrainType.River,
            },
          },
          agentProfile: { connect: { onchainId: profile.onchainId } },
          publicKey: agentAccount.authority.toString(),
          state: {
            create: {
              isAlive: true,
              lastActionType: "spawn",
              lastActionTime: new Date(),
              lastActionDetails: "Initial spawn",
              influencedByTweet: null,
              influenceScore: 0,
            },
          },
          community: {
            create: {
              followers: 0,
              averageEngagement: 0,
              supporterCount: 0,
              lastInfluenceTime: new Date(),
              influenceScore: 0,
            },
          },
        },
      });
      logger.info(
        `✅ Agent ${profile.onchainId} created in database successfully`
      );
    }
    return {
      tx,
      gameAccount: await program.account.game.fetch(gamePda),
    };
  } catch (error) {
    logger.error(`❌ Game initialization failed for ID ${""}:`, error);
    throw error;
  }
};
