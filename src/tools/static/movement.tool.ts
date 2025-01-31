import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";
import { MOVE_COOLDOWN_MS, getTerrainTypeByCoordinates } from "@/constants";

/**
 * Tool for agents to navigate the Middle Earth map
 */
export const movementTool = (context: { gameId: number; agentId: number }) => {
  const { gameId, agentId } = context;
  const gameStateService = getGameStateService();
  const gameService = getGameService();

  return tool({
    description: `Movement System for navigating Middle Earth's terrain.

Features:
- Move to specific coordinates
- Navigate different terrains (plains, mountains, rivers)
- Calculate movement costs
- Handle movement cooldowns
- Avoid obstacles and other agents
- Strategic positioning`,

    parameters: z.object({
      destination: z
        .object({
          x: z.number().describe("X coordinate to move to"),
          y: z.number().describe("Y coordinate to move to"),
        })
        .describe("Target coordinates"),
      strategy: z
        .enum(["cautious", "direct", "stealth"])
        .describe("Movement strategy affecting speed and visibility")
        .optional(),
    }),

    execute: async ({ destination, strategy = "direct" }) => {
      try {
        // Get current agent state
        const agent = await prisma.agent.findUnique({
          where: { agentId },
          include: {
            location: true,
            battles: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        const agentAccount = await gameStateService.getAgent(agentId, gameId);

        // Check cooldown
        const lastMove = agentAccount?.lastMove || new Date(0);
        const canMove = lastMove.getTime() + MOVE_COOLDOWN_MS < Date.now();

        if (!canMove) {
          const waitTime = Math.ceil(
            (lastMove.getTime() + MOVE_COOLDOWN_MS - Date.now()) / 1000
          );
          return {
            success: false,
            message: `Movement on cooldown. Wait ${waitTime} seconds.`,
          };
        }

        const terrainType = getTerrainTypeByCoordinates(
          destination.x,
          destination.y
        );

        // Execute movement
        const result = await gameService.moveAgent(
          gameId,
          agentId,
          destination.x,
          destination.y,
          terrainType
        );

        return {
          success: true,
          newPosition: destination,
          transactionId: result,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Movement failed"
        );
      }
    },
  });
};
