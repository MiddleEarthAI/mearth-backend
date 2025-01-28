import type { GameService } from "@/services/GameService";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

export interface BattleValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates a battle tool for an agent to engage in combat
 * Uses GameService for blockchain interactions
 * @param agentId - The ID of the agent initiating battle
 * @param gameService - The game service instance
 */
export const battleTool = async (
  attackerId: number,
  defenderId: number,
  gameService: GameService
) => {
  return tool({
    description: `Battle tool for engaging in combat with other agents. Considers:
      - Battle cooldowns and restrictions
      - Agent status and position
      - Alliance status
      Use for eliminating threats or competing for territory.`,
    parameters: z.object({
      targetAgentId: z.number().describe("ID of the agent to battle"),
    }),
    execute: async ({ targetAgentId }) => {
      try {
        // Execute battle using game service
        const tx = await gameService.initiateBattle(attackerId, defenderId);

        return {
          success: true,
          message: `Successfully initiated battle with agent ${targetAgentId}`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Battle error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Battle failed",
        };
      }
    },
  });
};
