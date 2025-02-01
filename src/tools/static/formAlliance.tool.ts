import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getGameService } from "@/services";
import { logger } from "@/utils/logger";

/**
 * Tool for forming strategic alliances between agents in Middle Earth
 */
export const formAllianceTool = async ({
  gameId,
  agentId,
}: {
  gameId: number;
  agentId: number;
}) => {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
  });

  return tool({
    description: `This is a tool you(@${agent?.xHandle}) can use to form alliances with other agents.

CONTEXT:
Forming an alliance is a powerful diplomatic action that:
- Combines resources and strategic capabilities
- Requires mutual agreement and token commitment
- Creates lasting diplomatic bonds
- Enables resource sharing and mutual defense

REQUIREMENTS:
- Neither agent can be in an existing alliance
- Both agents must be alive and active
- Agents must have sufficient tokens to stake
- Cannot form alliance with oneself
- Must be within proximity for alliance formation

BENEFITS:
- Combined token power for greater influence
- Shared resource access
- Mutual defense capabilities
- Enhanced strategic positioning

CONSIDERATIONS:
- Choose allies carefully - breaking alliances has consequences
- Consider the combined token strength
- Evaluate strategic alignment
- Assess geographical proximity
- Review potential ally's reputation

EFFECTS:
- Pools resources between agents
- Establishes diplomatic ties
- Updates both agents' status
- Records alliance on-chain`,

    parameters: z.object({
      targetAgentXHandle: z
        .string()
        .describe("XHandle of the agent to form alliance with"),
    }),

    execute: async ({ targetAgentXHandle }) => {
      const gameService = getGameService();

      try {
        // Prevent self-alliance
        if (agent?.xHandle === targetAgentXHandle) {
          throw new Error("Cannot form alliance with oneself");
        }

        const targetAgent = await prisma.agent.findUnique({
          where: { xHandle: targetAgentXHandle },
        });
        if (!targetAgent) {
          throw new Error("Target agent not found");
        }
        // Check existing alliances
        const existingAlliances = await prisma.alliance.findMany({
          where: {
            OR: [
              { agentId: agentId.toString() },
              { agentId: targetAgent.id },
              { alliedAgentId: agentId.toString() },
              { alliedAgentId: targetAgent.id },
            ],
            status: "Active",
          },
        });

        if (existingAlliances.length > 0) {
          throw new Error("One or both agents are already in an alliance");
        }

        // // Check proximity if both have locations
        // if (initiator.location && target.location) {
        //   const distance = calculateDistance(
        //     initiator.location,
        //     target.location
        //   );
        //   if (distance > 2) {
        //     throw new Error(
        //       "Agents too far apart to form alliance (max 2 units)"
        //     );
        //   }
        // }

        // Execute alliance formation
        const result = await gameService.formAlliance(
          gameId,
          agentId,
          targetAgent.agentId
        );

        // Log the action
        logger.info(
          `Alliance formed between ${agentId} and ${targetAgent.agentId}`,
          {
            tx: result.tx,
          }
        );

        return {
          success: true,
          message: "Alliance successfully formed",
          details: {
            transactionId: result.tx,
            alliance: result.alliance,
            terms: {
              combinedTokens: result.alliance.combinedTokens,
            },
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to form alliance";

        logger.error(`Alliance formation failed: ${message}`, {
          agentId,
          targetAgentXHandle,
          error,
        });

        throw new Error(message);
      }
    },
  });
};
