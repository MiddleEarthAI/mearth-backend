import type { GameService } from "@/services/GameService";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

export interface AllianceValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates an alliance tool for an agent to form or break alliances
 * Uses GameService for blockchain interactions
 * @param leaderId - The ID of the agent managing alliances
 * @param partnerId - The ID of the agent to form/break alliance with
 * @param gameService - The game service instance
 */
export const allianceTool = async (
  leaderId: number,
  partnerId: number,
  gameService: GameService
) => {
  return tool({
    description: `Alliance management tool for forming or breaking alliances with other agents. Considers:
      - Alliance cooldowns and limits
      - Agent status and position
      - Existing alliance relationships
      Use for strategic cooperation or breaking harmful alliances.`,
    parameters: z.object({
      action: z
        .enum(["FORM", "BREAK"])
        .describe("Whether to form or break an alliance"),
      targetAgentId: z
        .number()
        .describe("ID of the agent to form/break alliance with"),
    }),
    execute: async ({ action, targetAgentId }) => {
      try {
        const tx =
          action === "FORM"
            ? await gameService.formAlliance(leaderId, partnerId)
            : await gameService.breakAlliance(leaderId, partnerId);

        return {
          success: true,
          message: `Successfully ${
            action === "FORM" ? "formed" : "broke"
          } alliance with agent ${targetAgentId}`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Alliance error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Alliance action failed",
        };
      }
    },
  });
};
