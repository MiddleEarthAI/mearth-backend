import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { GenerateContextStringResult } from "@/agent/Agent";
import * as allianceUtils from "@/instructionUtils/alliance";

/**
 * Tool for forming strategic alliances between agents in Middle Earth
 */
export const formAllianceTool = (result: GenerateContextStringResult) =>
  tool({
    description: `This is a tool you(@${result.currentAgent.agentProfile.xHandle}) can use to form alliances with other agents.
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
        .describe("XHandle of the agent to form alliance with"),
    }),

    execute: async ({ targetAgentXHandle }) => {
      const agent = result.currentAgent;

      try {
        // Prevent self-alliance
        if (agent.agentProfile.xHandle === targetAgentXHandle) {
          return {
            message: `Cannot form alliance with oneself. you are @${agent.agentProfile.xHandle} on twitter so don't try to form alliance with your self`,
          };
        }

        // Find target agent by XHandle
        const targetAgent = await prisma.agent.findFirst({
          where: {
            agentProfile: {
              xHandle: targetAgentXHandle,
            },
            gameId: agent.gameId,
          },
          include: {
            location: true,
            currentAlliance: true,
            game: {
              select: {
                gameId: true,
              },
            },
          },
        });

        if (!targetAgent) {
          return {
            success: false,
            message: `Target agent not found. @${targetAgentXHandle} is not a valid agent in middle earth`,
          };
        }

        // Check if agents can form alliance
        const allianceCheck = await allianceUtils.canFormAlliance(
          Number(targetAgent.game.gameId),
          Number(agent.agentId),
          Number(targetAgent.agentId)
        );

        console.log("allianceCheck", allianceCheck);

        if (!allianceCheck.canForm) {
          return {
            success: false,
            message: allianceCheck.reason || "Cannot form alliance",
          };
        }

        // Execute alliance formation
        const result = await allianceUtils.formAlliance(
          Number(targetAgent.game.gameId),
          Number(agent.agentId),
          Number(targetAgent.agentId)
        );

        // Log the action
        logger.info(
          `🤝 Alliance formed between ${agent.agentProfile.xHandle} and ${targetAgentXHandle}`,
          {
            tx: result.tx,
            alliance: result.alliance,
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
              location: {
                initiator: agent.location,
                target: targetAgent.location,
              },
            },
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to form alliance";

        logger.error(`Alliance formation failed: ${message}`, {
          initiator: agent.agentProfile.xHandle,
          target: targetAgentXHandle,
          error,
        });

        throw new Error(message);
      }
    },
  });
