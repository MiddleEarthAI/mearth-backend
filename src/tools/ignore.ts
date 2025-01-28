import type { GameService } from "@/services/GameService";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

export interface IgnoreValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates an ignore tool for an agent to ignore other agents
 * Uses GameService for blockchain interactions
 * @param gameId - The ID of the game
 * @param agentId - The ID of the agent ignoring others
 * @param gameService - The game service instance
 */
export const ignoreTool = async (
  gameId: number,
  agentId: number,
  gameService: GameService
) => {
  return tool({
    description: `Ignore tool for temporarily ignoring other agents. Considers:
      - Ignore cooldowns and limits
      - Agent status validation
      Use for avoiding unwanted interactions or battles.`,
    parameters: z.object({
      targetAgentId: z.number().describe("ID of the agent to ignore"),
    }),
    execute: async ({ targetAgentId }) => {
      try {
        const tx = await gameService.ignoreAgent(agentId, targetAgentId);

        return {
          success: true,
          message: `Successfully ignored agent ${targetAgentId}`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Ignore action error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Ignore action failed",
        };
      }
    },
  });
};
