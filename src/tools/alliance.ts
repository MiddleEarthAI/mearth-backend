import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";
import { calculateDistance } from "./utils";

export interface AllianceValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates an alliance tool for diplomatic interactions
 * Uses GameService for blockchain interactions and alliance mechanics
 */
export const allianceTool = async (gameId: number, agentId: number) => {
  const gameStateService = getGameStateService();
  const gameService = getGameService();
  const allianceInfo = await gameStateService.getAllianceInfo(agentId, gameId);

  const agent = await prisma.agent.findUnique({
    where: {
      agentId: agentId,
    },
  });

  const contextualDescription = `🤝 Alliance System for @${agent?.xHandle},

Current Diplomatic Status:
👥 Active Alliances:

🤔 Recent Relations:

Alliance Mechanics:
• Alliances require mutual trust
• Combined token staking available
• Shared battle rewards
• Territory control bonuses
• Cooldown after dissolution


Strategic Benefits:
• Pooled resources for battles
• Shared intelligence network
• Coordinated movements
• Defensive partnerships
• Market trading advantages
• Reputation effects

Current Position: (${allianceInfo?.agent.x ?? "-"}, ${
    allianceInfo?.agent.y ?? "-"
  })
Token Balance: ${allianceInfo?.agent.tokenBalance ?? "-"} MEARTH


Choose allies carefully, @${
    agent?.xHandle ?? "-"
  }. Trust is earned, not given.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      allyXHandle: z
        .string()
        .describe("Twitter handle of the agent to form alliance with"),
      reason: z
        .string()
        .describe(
          "Reason for forming alliance and the benefits of taking this decision"
        ),
    }),

    execute: async ({ allyXHandle, reason }) => {
      if (!allianceInfo) {
        return {
          success: false,
          message: "Agent or ally not found",
        };
      }

      if (allianceInfo.isActive) {
        return {
          success: false,
          message: "Agent already has an active alliance",
        };
      }

      const ally = await prisma.agent.findUnique({
        where: {
          xHandle: allyXHandle,
        },
      });

      if (!agent || !ally) {
        return {
          success: false,
          message: "Agent or ally not found in database",
        };
      }
      try {
        // Calculate distance
        const distance = calculateDistance(
          allianceInfo.agent.x,
          allianceInfo.agent.y,
          allianceInfo.ally.x,
          allianceInfo.ally.y
        );

        if (distance > 2) {
          return {
            success: false,
            message:
              "The agent you want to form alliance with is too far for the alliance to be formed",
          };
        }

        // Execute alliance formation
        const tx = await gameService.formAlliance(agentId, ally.agentId);

        return {
          success: true,
          message: `You @${
            agent.xHandle
          } have successfully formed an alliance with Agent ${allyXHandle} with the combined token stake of ${
            allianceInfo.agent.tokenBalance + allianceInfo.ally.tokenBalance
          } MEARTH. ${reason} Date: ${new Date().toISOString()}`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Alliance error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Alliance formation failed",
        };
      }
    },
  });
};
