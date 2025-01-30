import { prisma } from "@/config/prisma";
import { MOVE_COOLDOWN_MS, MOVE_UNITS_PER_HOUR } from "@/constants";
import { getGameService, getGameStateService } from "@/services";
import { logger } from "@/utils/logger";
import { FieldType } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";
import { calculateDistance } from "./utils";

export interface MoveValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates a movement tool for an agent to navigate the Middle Earth map
 * Uses GameService for blockchain interactions and movement mechanics
 */
export const movementTool = async (gameId: number, agentId: number) => {
  const gameStateService = getGameStateService();
  const gameService = getGameService();
  const agent = await gameStateService.getAgent(agentId, gameId);
  if (!agent) throw new Error("Agent not found onchain");
  //
  const canMove = agent.lastMove.toNumber() + MOVE_COOLDOWN_MS < Date.now();

  // Get agent's current state and nearby context
  const dbAgent = await prisma.agent.findUnique({
    where: { agentId: agentId },
    include: {
      state: true,
      location: true,
    },
  });

  // Get nearby agents within visibility range
  const nearbyAgents = await prisma.agent.findMany({
    where: {
      AND: [
        { id: { not: agentId.toString() } },
        {
          location: {
            x: {
              gte: dbAgent?.location?.x ?? 0 - 5,
              lte: dbAgent?.location?.x ?? 0 + 5,
            },
          },
        },
        {
          location: {
            y: {
              gte: dbAgent?.location?.y ?? 0 - 5,
              lte: dbAgent?.location?.y ?? 0 + 5,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      location: true,
      state: true,
    },
  });

  // Format nearby agents info
  const nearbyInfo = nearbyAgents
    .map((nearby) => {
      const distance = calculateDistance(
        agent.x,
        agent.y,
        nearby.location?.x ?? 0,
        nearby.location?.y ?? 0
      );
      return `- ${nearby.name} at (${nearby.location?.x},${
        nearby.location?.y
      }), ${distance.toFixed(1)} units away`;
    })
    .join("\n");

  const contextualDescription = `🗺️ Movement System for ${
    dbAgent?.name + " @" + dbAgent?.xHandle
  }

Current Position:
📍 Location: (${dbAgent?.location?.x ?? "Unknown Position"}, ${
    dbAgent?.location?.y ?? "Unknown Position"
  })
🌲 Terrain: ${dbAgent?.location?.fieldType ?? "Unknown Terrain"}
⚡ Stuck Turns: ${dbAgent?.location?.stuckTurnsRemaining ?? "Unknown Speed"}x

Status:
❤️ Health: ${dbAgent?.state?.health ?? "Unknown Health"}/100
⚡ Alive: ${dbAgent?.state?.isAlive ? "Yes" : "No"}


Nearby Agents:
${nearbyInfo || "No agents within visible range"}

Terrain Effects:
• PLAINS: Normal movement (10 energy)
• MOUNTAINS: 50% slower (20 energy, 1% death risk)
• RIVERS: 70% slower (15 energy, 1% death risk)

Movement Rules:
• One unit per move (diagonal allowed)
• Energy cost varies by terrain
• Must respect map boundaries
• Cooldown between movements

Strategic Considerations:
• Higher ground advantage in battles
• Resource-rich areas worth controlling
• Safe routes vs. risky shortcuts
• Alliance territories are safe passage
• Weather effects on movement


Choose your path wisely, ${
    dbAgent?.name + "! @" + dbAgent?.xHandle ?? "-"
  }. The journey shapes the warrior.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      x: z.number().describe("Target X coordinate on the map"),
      y: z.number().describe("Target Y coordinate on the map"),
      terrain: z
        .nativeEnum(FieldType)
        .describe("Terrain type at the target location"),
    }),
    execute: async ({ x, y, terrain }) => {
      if (!canMove) {
        return {
          success: false,
          message: "Agent has not moved in the last hour",
        };
      }
      if (!dbAgent) throw new Error("Agent not found in database");

      try {
        // check if the agent is moving more than 2 units
        if (
          Math.abs(x - agent.x) > MOVE_UNITS_PER_HOUR ||
          Math.abs(y - agent.y) > MOVE_UNITS_PER_HOUR
        ) {
          return {
            success: false,
            message: `Can only move ${MOVE_UNITS_PER_HOUR} units at a time`,
          };
        }

        // Execute movement
        const tx = await gameService.moveAgent(gameId, agentId, x, y, null);

        return {
          success: true,
          message: `Successfully moved to (${x},${y}) on ${terrain}`,
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
