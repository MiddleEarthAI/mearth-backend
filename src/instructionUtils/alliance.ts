import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { Program, BN } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { ALLIANCE_COOLDOWN } from "@/types/program";

/**
 * Form an alliance between two agents
 * @param gameId - The game ID
 * @param initiatorAgentId - The ID of the agent initiating the alliance
 * @param targetAgentId - The ID of the target agent
 */
export async function formAlliance(
  gameId: number,
  initiatorAgentId: number,
  targetAgentId: number
): Promise<{ tx: string; alliance: any }> {
  const program = await getProgramWithWallet();
  try {
    if (!program) {
      throw new Error("Alliance service not initialized");
    }

    // Get game PDA
    const [gamePda] = getGamePDA(program.programId, gameId);

    // Get agent PDAs
    const [initiatorPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(initiatorAgentId)
    );
    const [targetPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(targetAgentId)
    );

    // Verify agents exist and are eligible for alliance
    const game = await prisma.game.findUnique({
      where: {
        gameId: gameId,
      },
    });
    if (!game) {
      throw new Error("Game not found");
    }

    // Execute alliance formation on-chain
    const tx = await program.methods
      .formAlliance()
      .accounts({
        initiator: initiatorPda,
        targetAgent: targetPda,
      })
      .rpc();

    // Update token balances
    const [initiatorAccount, targetAccount] = await Promise.all([
      program.account.agent.fetch(initiatorPda),
      program.account.agent.fetch(targetPda),
    ]);

    // Create alliance record in database
    const alliance = await prisma.alliance.create({
      data: {
        formedAt: new Date(),
        status: "Active",
        combinedTokens:
          initiatorAccount.tokenBalance.toNumber() +
          targetAccount.tokenBalance.toNumber(),
        game: { connect: { gameId: gameId } },
        agent: {
          connect: {
            agentId_gameId: {
              agentId: initiatorAgentId,
              gameId: game?.id,
            },
          },
        },
        alliedAgent: {
          connect: {
            agentId_gameId: {
              agentId: targetAgentId,
              gameId: game?.id,
            },
          },
        },
      },
    });

    // Update agent states in database
    await Promise.all([
      prisma.agent.update({
        where: {
          agentId_gameId: {
            agentId: initiatorAgentId,
            gameId: game.id,
          },
        },
        data: {
          state: {
            update: {
              lastActionType: "alliance",
              lastActionTime: new Date(),
              lastActionDetails: `Formed alliance with ${targetAgentId}`,
            },
          },
        },
      }),
      prisma.agent.update({
        where: {
          agentId_gameId: {
            agentId: targetAgentId,
            gameId: game.id,
          },
        },
        data: {
          state: {
            update: {
              lastActionType: "alliance",
              lastActionTime: new Date(),
              lastActionDetails: `Formed alliance with ${initiatorAgentId}`,
            },
          },
        },
      }),
    ]);

    logger.info(
      `🤝 Alliance formed between agents ${initiatorAgentId} and ${targetAgentId}`
    );

    return { tx, alliance };
  } catch (error) {
    logger.error("Failed to form alliance:", error);
    throw error;
  }
}

/**
 * Break an alliance between two agents
 * @param gameId - The game ID
 * @param initiatorAgentId - The ID of the agent initiating the break
 * @param targetAgentId - The ID of the target agent
 */
export async function breakAlliance(
  gameId: number,
  initiatorAgentId: number,
  targetAgentId: number
): Promise<{ tx: string; details: any }> {
  try {
    const program = await getProgramWithWallet();
    if (!program) {
      throw new Error("Alliance service not initialized");
    }

    // Get game PDA
    const [gamePda] = getGamePDA(program.programId, gameId);

    // Get agent PDAs
    const [initiatorPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(initiatorAgentId)
    );
    const [targetPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(targetAgentId)
    );
    const game = await prisma.game.findUnique({
      where: {
        gameId: gameId,
      },
    });
    if (!game) {
      throw new Error("Game not found");
    }
    const alliance = await prisma.alliance.findFirst({
      where: {
        agent: {
          agentId: initiatorAgentId,
          game: {
            gameId: gameId,
          },
        },
        alliedAgent: {
          agentId: targetAgentId,
          game: {
            gameId: gameId,
          },
        },
      },
      orderBy: {
        formedAt: "desc",
      },
      include: {
        agent: {
          include: {
            agentProfile: true,
          },
        },
        alliedAgent: {
          include: {
            agentProfile: true,
          },
        },
      },
    });

    if (!alliance) {
      throw new Error("Alliance not found");
    }

    // Execute alliance break on-chain
    const tx = await program.methods
      .breakAlliance()
      .accounts({
        initiator: initiatorPda,
        targetAgent: targetPda,
      })
      .rpc();

    // Update alliance status in database
    await prisma.alliance.update({
      where: {
        id: alliance.id,
      },
      data: {
        status: "Broken",
      },
    });

    // Update agent states in database
    await Promise.all([
      prisma.agent.update({
        where: {
          agentId_gameId: {
            agentId: initiatorAgentId,
            gameId: game.id,
          },
        },
        data: {
          state: {
            update: {
              lastActionType: "alliance_break",
              lastActionTime: new Date(),
              lastActionDetails: `Broke alliance with @${alliance.alliedAgent.agentProfile.xHandle}`,
            },
          },
        },
      }),
      prisma.agent.update({
        where: {
          agentId_gameId: {
            agentId: targetAgentId,
            gameId: game.id,
          },
        },
        data: {
          state: {
            update: {
              lastActionType: "alliance_break",
              lastActionTime: new Date(),
              lastActionDetails: `Alliance broken by @${alliance.agent.agentProfile.xHandle}`,
            },
          },
        },
      }),
    ]);

    // Create cooldown records for both agents
    const cooldownEndsAt = new Date();
    cooldownEndsAt.setHours(cooldownEndsAt.getHours() + 24); // 24-hour cooldown

    await Promise.all([
      prisma.cooldown.create({
        data: {
          type: "alliance",
          endsAt: cooldownEndsAt,
          agent: { connect: { id: initiatorAgentId.toString() } },
          targetAgentId: targetAgentId.toString(),
        },
      }),
      prisma.cooldown.create({
        data: {
          type: "alliance",
          endsAt: cooldownEndsAt,
          agent: { connect: { id: targetAgentId.toString() } },
          targetAgentId: initiatorAgentId.toString(),
        },
      }),
    ]);

    logger.info(
      `💔 Alliance broken between agents ${initiatorAgentId} and ${targetAgentId}`
    );

    return {
      tx,
      details: {
        initiatorState: await program.account.agent.fetch(initiatorPda),
        targetState: await program.account.agent.fetch(targetPda),
      },
    };
  } catch (error) {
    logger.error("Failed to break alliance:", error);
    throw error;
  }
}

/**
 * Check if an agent can form an alliance
 * @param gameId - The game ID
 * @param agentId - The ID of the agent to check
 * @param targetAgentId - The ID of the target agent
 */
export async function canFormAlliance(
  gameId: number,
  agentId: number,
  targetAgentId: number
): Promise<{ canForm: boolean; reason: string }> {
  const program = await getProgramWithWallet();
  try {
    // // Check if agents exist
    // const [agent, targetAgent] = await Promise.all([
    //   prisma.agent.findUnique({
    //     where: {
    //       agentId_gameId: {
    //         agentId: agentId,
    //         gameId: dbGameId,
    //       },
    //     },
    //     include: {
    //       currentAlliance: true,
    //       cooldowns: {
    //         where: {
    //           type: "alliance",
    //           endsAt: { gt: new Date() },
    //         },
    //       },
    //     },
    //   }),
    //   prisma.agent.findUnique({
    //     where: {
    //       agentId_gameId: {
    //         agentId: targetAgentId,
    //         gameId: dbGameId,
    //       },
    //     },
    //     include: {
    //       currentAlliance: true,
    //     },
    //   }),
    // ]);
    const [gamePda] = getGamePDA(program.programId, gameId);

    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
    const agentAccount = await program.account.agent.fetch(agentPda);
    const [targetPda] = getAgentPDA(
      program.programId,
      gamePda,
      new BN(targetAgentId)
    );
    const targetAccount = await program.account.agent.fetch(targetPda);

    if (!agentAccount || !targetAccount) {
      return { canForm: false, reason: "One or both agents not found" };
    }

    if (
      agentAccount.lastAlliance + ALLIANCE_COOLDOWN > new Date().getTime() ||
      targetAccount.lastAlliance + ALLIANCE_COOLDOWN > new Date().getTime()
    ) {
      return {
        canForm: false,
        reason:
          "One or both agents are on cooldown. Please wait before forming an alliance.",
      };
    }

    if (agentAccount.allianceWith) {
      return {
        canForm: false,
        reason:
          "You already are in alliance with another agent. You can not have more than one alliance at a time.",
      };
    }

    if (targetAccount.allianceWith) {
      return {
        canForm: false,
        reason:
          "The target agent is already in an alliance. You can not form an alliance with an agent that is already in an alliance. wait for the alliance to break and try again.",
      };
    }

    return {
      canForm: true,
      reason: "You can form an alliance with this agent.",
    };
  } catch (error) {
    logger.error("Error checking alliance eligibility:", error);
    return {
      canForm: false,
      reason: "Error checking alliance eligibility",
    };
  }
}

export async function canBreakAlliance(
  gameId: number,
  agentId: number,
  targetAgentId: number
) {
  const program = await getProgramWithWallet();
  if (!program) {
    throw new Error("Alliance service not initialized");
  }

  const [gamePda] = getGamePDA(program.programId, gameId);
  const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
  const agentAccount = await program.account.agent.fetch(agentPda);
  const [targetPda] = getAgentPDA(
    program.programId,
    gamePda,
    new BN(targetAgentId)
  );
  const targetAccount = await program.account.agent.fetch(targetPda);

  if (!agentAccount || !targetAccount) {
    return { canBreak: false, reason: "One or both agents not found" };
  }

  if (!agentAccount.allianceWith) {
    return { canBreak: false, reason: "You are not in an alliance" };
  }

  if (agentAccount.allianceWith !== targetPda) {
    return {
      canBreak: false,
      reason: "You are not in an alliance with this agent",
    };
  }

  return {
    canBreak: true,
    reason: "You can break an alliance with this agent",
  };
}
