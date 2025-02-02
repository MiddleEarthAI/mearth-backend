import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";

import { getProgramWithWallet } from "@/utils/program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ALLIANCE_COOLDOWN } from "@/types/program";

/**
 * Tool for forming strategic alliances between agents in Middle Earth
 */
export const formAllianceTool = (
  agentId: number,
  gameId: number,
  gameDbId: string,
  currentAgentXHandle: string
) =>
  tool({
    description: `This is a tool you can use to form alliances with other agents.
CONTEXT:
Forming an alliance is a powerful diplomatic action that:
- Combines resources and strategic capabilities
- Requires mutual agreement and token commitment
- Creates lasting diplomatic bonds
- Enables resource sharing and mutual defense
`,
    parameters: z.object({
      targetAgentXHandle: z
        .string()
        .describe(
          "Twitter handle of the agent you want to form alliance with. available agent handles to choose from: 'sirgullihopai' | 'scootlesai' | 'purrlockpawsai' | 'wanderleafai' "
        ),
    }),

    execute: async ({ targetAgentXHandle }) => {
      try {
        const targetAgent = await prisma.agent.findFirst({
          where: {
            gameId: gameDbId,
            agentProfile: {
              xHandle: targetAgentXHandle,
            },
            NOT: {
              agentId: agentId,
            },
          },
          include: {
            agentProfile: true,
          },
        });

        if (!targetAgent) {
          return {
            success: false,
            message: `Target agent not found. @${targetAgentXHandle} is not a valid agent in middle earth`,
          };
        }
        const program = await getProgramWithWallet();
        const [gamePda] = getGamePDA(program.programId, gameId);

        const [targetAgentPda] = getAgentPDA(
          program.programId,
          gamePda,
          targetAgent.agentId
        );
        const [initiatorPda] = getAgentPDA(program.programId, gamePda, agentId);

        const [targetAccount, initiatorAccount] = await Promise.all([
          program.account.agent.fetch(targetAgentPda),
          program.account.agent.fetch(initiatorPda),
        ]);

        if (initiatorAccount.allianceWith) {
          return {
            success: false,
            message: `You already have an alliance. You cannot form an alliance with @${targetAgentXHandle}`,
          };
        }

        if (targetAccount.allianceWith) {
          return {
            success: false,
            message: `Target agent already has an alliance. @${targetAgentXHandle} is already in an alliance`,
          };
        }

        if (
          initiatorAccount.allianceTimestamp + ALLIANCE_COOLDOWN >
          Date.now()
        ) {
          return {
            success: false,
            message: `You are on cooldown. You have to wait ${
              initiatorAccount.allianceTimestamp +
              ALLIANCE_COOLDOWN -
              Date.now()
            } seconds before you can form an alliance with @${targetAgentXHandle}`,
          };
        }

        if (targetAccount.allianceTimestamp + ALLIANCE_COOLDOWN > Date.now()) {
          return {
            success: false,
            message: `@${targetAgentXHandle} is on cooldown. You have to wait ${
              targetAccount.allianceTimestamp + ALLIANCE_COOLDOWN - Date.now()
            } seconds before you can form an alliance with them again`,
          };
        }

        const tx = await program.methods
          .formAlliance()
          .accounts({
            initiator: initiatorPda,
            targetAgent: targetAgentPda,
          })
          .rpc();

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
                  agentId: agentId,
                  gameId: gameDbId,
                },
              },
            },
            alliedAgent: {
              connect: {
                agentId_gameId: {
                  agentId: targetAccount.id,
                  gameId: gameDbId,
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
                agentId: agentId,
                gameId: gameDbId,
              },
            },
            data: {
              state: {
                create: {
                  lastActionType: "alliance",
                  lastActionTime: new Date(),
                  lastActionDetails: `You formed an alliance with @${targetAgentXHandle}. Time: ${new Date().toISOString()}`,
                },
              },
            },
          }),
          prisma.agent.update({
            where: {
              agentId_gameId: {
                agentId: targetAccount.id,
                gameId: gameDbId,
              },
            },
            data: {
              state: {
                create: {
                  lastActionType: "alliance",
                  lastActionTime: new Date(),
                  lastActionDetails: `@${currentAgentXHandle} formed an alliance with you. Time: ${new Date().toISOString()}`,
                },
              },
            },
          }),
        ]);

        return {
          success: true,
          message: `You successfully form an alliance with @${targetAgentXHandle}. That's a huge achievement!`,
          details: {
            transactionId: tx,
            alliance: alliance,
            terms: {
              combinedTokens: alliance.combinedTokens,
            },
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to form alliance";

        logger.error(`Alliance formation failed: ${message}`, {
          initiator: currentAgentXHandle,
          target: targetAgentXHandle,
          error,
        });

        return {
          success: false,
          message: `Failed to form alliance with @${targetAgentXHandle}. Please try again later.`,
        };
      }
    },
  });
