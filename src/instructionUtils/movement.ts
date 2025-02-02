import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { BN } from "@coral-xyz/anchor";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { getProgramWithWallet } from "@/utils/program";
import { getTerrainTypeByCoordinates } from "@/constants";

/**
 * Move an agent to a new position
 * @param gameId - The game ID
 * @param agentId - The ID of the agent to move
 * @param newX - The new X coordinate
 * @param newY - The new Y coordinate
 * @param terrainType - The type of terrain at the destination
 */
export async function moveAgent(
  gameId: number,
  agentId: number,
  newX: number,
  newY: number,
  terrainType: { plain: {} } | { river: {} } | { mountain: {} }
): Promise<{ tx: string }> {
  const program = await getProgramWithWallet();
  try {
    if (!program) {
      throw new Error("Movement service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

    // Verify agent exists and is alive
    const agent = await program.account.agent.fetch(agentPda);
    if (!agent.isAlive) {
      throw new Error("Cannot move a dead agent");
    }

    // Execute movement on-chain
    const tx = await program.methods
      .moveAgent(newX, newY, terrainType)
      .accounts({
        agent: agentPda,
        authority: program.provider.publicKey,
      })
      .rpc();

    // Update agent location in database
    await prisma.agent.update({
      where: {
        agentId_gameId: {
          agentId,
          gameId: gameId.toString(),
        },
      },
      data: {
        location: {
          update: {
            x: newX,
            y: newY,
          },
        },
      },
    });

    logger.info(
      `🚶 Agent ${agentId} moved to (${newX}, ${newY}) on ${
        Object.keys(terrainType)[0]
      } terrain`
    );
    return { tx };
  } catch (error) {
    logger.error("Failed to move agent:", error);
    throw error;
  }
}

// /**
//  * Kill an agent
//  * @param gameId - The game ID
//  * @param agentId - The ID of the agent to kill
//  */
// export async function killAgent(
//   gameId: number,
//   agentId: number
// ): Promise<{ tx: string }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Movement service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

//     // Execute kill on-chain
//     const tx = await program.methods
//       .killAgent()
//       .accounts({
//         agent: agentPda,
//       })
//       .rpc();

//     // Update agent status in database
//     await prisma.agent.update({
//       where: {
//         agentId_gameId: {
//           agentId,
//           gameId: gameId.toString(),
//         },
//       },
//       data: {
//         state: {
//           update: {
//             isAlive: false,
//             lastActionType: "killed",
//             lastActionTime: new Date(),
//           },
//         },
//       },
//     });

//     logger.info(`💀 Agent ${agentId} has been killed`);
//     return { tx };
//   } catch (error) {
//     logger.error("Failed to kill agent:", error);
//     throw error;
//   }
// }

// /**
//  * Register a new agent
//  * @param gameId - The game ID
//  * @param agentId - The ID of the agent to register
//  * @param x - Initial X coordinate
//  * @param y - Initial Y coordinate
//  * @param name - Agent name
//  */
// export async function registerAgent(
//   gameId: number,
//   agentId: number,
//   x: number,
//   y: number,
//   name: string
// ): Promise<{ tx: string }> {
//   try {
//     const program = await getProgramWithWallet();
//     if (!program) {
//       throw new Error("Movement service not initialized");
//     }

//     // Get PDAs
//     const [gamePda] = getGamePDA(program.programId, gameId);
//     const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
//     const terrainType = getTerrainTypeByCoordinates(x, y);

//     // Execute registration on-chain
//     const tx = await program.methods
//       .registerAgent(agentId, x, y, name)
//       .accounts({
//         game: gamePda,
//         agent: agentPda,
//         authority: program.provider.publicKey,
//       })
//       .rpc();

//     // Create agent record in database
//     await prisma.agent.create({
//       data: {
//         agentId,
//         publicKey: agentPda.toString(),
//         gameId: gameId.toString(),
//         agentProfileId: agentId.toString(), // Assuming profile ID matches agent ID
//         state: {
//           create: {
//             isAlive: true,
//             lastActionType: "registered",
//             lastActionDetails: "Agent registered",
//             lastActionTime: new Date(),
//             influenceScore: 0,
//           },
//         },
//         location: {
//           create: {
//             x,
//             y,
//             terrainType:
//               Object.keys(terrainType)[0].toLowerCase() == "mountain"
//                 ? "Mountain"
//                 : Object.keys(terrainType)[0].toLowerCase() == "river"
//                 ? "River"
//                 : "Plain",
//           },
//         },
//       },
//     });

//     logger.info(`📝 Agent ${name} (ID: ${agentId}) registered at (${x}, ${y})`);
//     return { tx };
//   } catch (error) {
//     logger.error("Failed to register agent:", error);
//     throw error;
//   }
// }
