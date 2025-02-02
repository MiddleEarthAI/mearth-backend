import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { BN } from "@coral-xyz/anchor";

import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { getProgramWithWallet } from "@/utils/program";

/**
 * Register a new agent in the game
 * @param gameId - The game ID
 * @param agentId - The ID of the agent to register
 * @param x - Initial X coordinate
 * @param y - Initial Y coordinate
 * @param name - Agent name
 */
export async function registerAgent(
  gameId: number,
  agentId: number,
  x: number,
  y: number,
  name: string
): Promise<{ tx: string; agent: any }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Agent service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

    // Execute registration on-chain
    const tx = await program.methods
      .registerAgent(agentId, x, y, name)
      .accounts({
        game: gamePda,
        agent: agentPda,
        authority: program.provider.publicKey,
      })
      .rpc();

    // Create agent record in database
    const agent = await prisma.agent.create({
      data: {
        agentId,
        publicKey: agentPda.toString(),
        gameId: gameId.toString(),
        agentProfileId: agentId.toString(), // Assuming profile ID matches agent ID
        state: {
          create: {
            isAlive: true,
            lastActionType: "move",
            lastActionTime: new Date(),
            lastActionDetails: `Registered at position (${x}, ${y})`,
            influenceScore: 0,
          },
        },
        location: {
          create: {
            x,
            y,
            terrainType: "Plain",
          },
        },
      },
    });

    // Fetch and verify the on-chain agent account
    const agentAccount = await program.account.agent.fetch(agentPda);

    logger.info(`📝 Agent ${name} (ID: ${agentId}) registered at (${x}, ${y})`);
    return { tx, agent: agentAccount };
  } catch (error) {
    logger.error("Failed to register agent:", error);
    throw error;
  }
}

/**
 * Kill an agent
 * @param gameId - The game ID
 * @param agentId - The ID of the agent to kill
 */
export async function killAgent(
  gameId: number,
  agentId: number
): Promise<{ tx: string; agent: any }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Agent service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

    // Execute kill on-chain
    const tx = await program.methods
      .killAgent()
      .accounts({
        agent: agentPda,
      })
      .rpc();

    // Update agent status in database
    await prisma.agent.update({
      where: {
        agentId_gameId: {
          agentId,
          gameId: gameId.toString(),
        },
      },
      data: {
        state: {
          update: {
            isAlive: false,
            lastActionType: "killed",
            lastActionTime: new Date(),
          },
        },
      },
    });

    // Fetch the updated agent account
    const agentAccount = await program.account.agent.fetch(agentPda);

    logger.info(`💀 Agent ${agentId} has been killed`);
    return { tx, agent: agentAccount };
  } catch (error) {
    logger.error("Failed to kill agent:", error);
    throw error;
  }
}

/**
 * Get agent account data
 * @param gameId - The game ID
 * @param agentId - The ID of the agent
 */
export async function getAgentAccount(
  gameId: number,
  agentId: number
): Promise<any> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Agent service not initialized");
    }

    // Get PDAs
    const [gamePda] = getGamePDA(program.programId, gameId);
    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

    // Fetch agent account data
    const agentAccount = await program.account.agent.fetch(agentPda);
    return agentAccount;
  } catch (error) {
    logger.error("Failed to fetch agent account:", error);
    throw error;
  }
}

/**
 * Verify agent is alive
 * @param gameId - The game ID
 * @param agentId - The ID of the agent
 */
export async function isAgentAlive(
  gameId: number,
  agentId: number
): Promise<boolean> {
  try {
    const agentAccount = await getAgentAccount(gameId, agentId);
    return agentAccount.isAlive;
  } catch (error) {
    logger.error("Failed to check agent status:", error);
    throw error;
  }
}
