import type { GameService } from "@/services/GameService";
import { TerrainType } from "@/types/program";
import { logger } from "@/utils/logger";
import { TerrainType as prismaTerrainType } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";

export interface MoveValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates a movement tool for an agent to navigate the Middle Earth map
 * Uses GameService for blockchain interactions
 * @param agentId - The ID of the agent making the move
 * @param gameService - The game service instance
 */
export const moveTool = async (
  gameId: number,
  agentId: number,
  gameService: GameService
) => {
  return tool({
    description: `Strategic movement tool for navigating the Middle Earth map. Considers:
      - Terrain effects (plains = normal speed, rivers = 70% slower, mountains = 50% slower)
      - Movement cooldown based on distance and terrain
      - Map boundaries and battle state validation
      Use for tactical positioning, forming alliances, or avoiding threats.`,
    parameters: z.object({
      x: z.number().describe("Target X coordinate on the map"),
      y: z.number().describe("Target Y coordinate on the map"),
      terrain: z
        .enum(["PLAINS", "RIVER", "MOUNTAINS"])
        .describe("Terrain type at the target location"),
    }),
    execute: async ({ x, y, terrain }) => {
      try {
        // Execute move using game service
        const tx = await gameService.moveAgent(
          gameId,
          agentId,
          x,
          y,
          terrain === "PLAINS"
            ? TerrainType.Plains
            : terrain === "RIVER"
            ? TerrainType.Rivers
            : TerrainType.Mountains
        );

        return {
          success: true,
          message: `Successfully moved to (${x},${y})`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Movement error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Movement failed",
        };
      }
    },
  });
};
