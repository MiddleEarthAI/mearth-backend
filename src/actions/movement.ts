import { logger } from "@/utils/logger";
import { TerrainType } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { z } from "zod";
import { Solana } from "@/deps/solana";
import { tool } from "ai";

interface MoveValidationResult {
  success: boolean;
  message: string;
  terrain?: TerrainType;
  deathRisk?: number;
  movementCost?: number;
}

export const moveTool = async function (agentId: string, solana: Solana) {
  /**
   * Validates if a move to the specified coordinates is possible
   * Checks location existence, distance, and movement restrictions
   */
  async function validateMove(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    toLocation: { terrain: TerrainType }
  ): Promise<MoveValidationResult> {
    // Calculate distance and movement parameters
    const distance = calculateDistance(fromX, fromY, toX, toY);
    const { speed, deathRisk, movementCost } = calculateMovementSpeed(
      toLocation.terrain,
      distance
    );

    // Check if agent has moved recently
    const lastMove = await prisma.movement.findFirst({
      where: { agentId },
      orderBy: { timestamp: "desc" },
    });

    if (lastMove) {
      const cooldownTime = 3600; // 1 hour in seconds
      const timeSinceLastMove = Math.floor(
        (Date.now() - lastMove.timestamp.getTime()) / 1000
      );

      if (timeSinceLastMove < cooldownTime) {
        return {
          success: false,
          message: `Movement cooldown: ${Math.ceil(
            (cooldownTime - timeSinceLastMove) / 60
          )} minutes remaining`,
        };
      }
    }

    return {
      success: true,
      message: `Valid move to ${toLocation.terrain} terrain at (${toX},${toY})`,
      terrain: toLocation.terrain,
      deathRisk,
      movementCost,
    };
  }

  /**
   * Executes the movement if validation passes
   * Handles movement records, death chance, and token costs
   */
  async function executeMove(
    fromLocation: { id: string; x: number; y: number },
    toLocation: { id: string; x: number; y: number; terrain: TerrainType },
    validation: MoveValidationResult
  ) {
    // Check death chance
    if (validation.deathRisk && Math.random() < validation.deathRisk) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: "DEFEATED" },
      });
      return {
        success: false,
        message: "Agent perished during the journey",
        fatal: true,
      };
    }

    // Create movement record
    const movement = await prisma.movement.create({
      data: {
        agentId,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        speed: validation.movementCost || 1,
      },
    });

    // Update agent's location
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        locationId: toLocation.id,
        lastActionTime: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully moved to (${toLocation.x},${toLocation.y})`,
      movement,
    };
  }

  return tool({
    description: `Strategic movement tool for navigating the Middle Earth map. Considers:
      - Terrain effects (mountains slow movement by 50%, rivers by 70%)
      - Death risk (5% in mountains/rivers)
      - Movement cooldown (1 hour between moves)
      - Valid coordinate validation
      Use for tactical positioning, forming alliances, or avoiding threats.`,
    parameters: z.object({
      x: z.number().describe("Target X coordinate on the map"),
      y: z.number().describe("Target Y coordinate on the map"),
    }),
    execute: async ({ x, y }) => {
      try {
        // Get current location and agent
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            currentLocation: true,
          },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        // Find target location
        const targetLocation = await prisma.location.findFirst({
          where: { x, y },
        });

        if (!targetLocation) {
          return {
            success: false,
            message: `Invalid coordinates: No location exists at (${x},${y})`,
          };
        }

        // Validate move
        const validation = await validateMove(
          agent.currentLocation.x,
          agent.currentLocation.y,
          x,
          y,
          targetLocation
        );

        if (!validation.success) {
          return validation;
        }

        // Execute move
        return await executeMove(
          agent.currentLocation,
          targetLocation,
          validation
        );
      } catch (error) {
        logger.error("Movement error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : `Movement failed: ${error}`,
        };
      }
    },
  });
};
interface MovementCalculation {
  speed: number;
  deathRisk: number;
  movementCost: number;
}

/**
 * Calculates the Euclidean distance between two points
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculates movement speed and risks based on terrain and distance
 */
export function calculateMovementSpeed(
  terrain: TerrainType,
  distance: number
): MovementCalculation {
  let speed = 1.0; // Base speed
  let deathRisk = 0;
  let movementCost = distance;

  switch (terrain) {
    case TerrainType.MOUNTAINS:
      speed *= 0.5; // 50% slower in mountains
      deathRisk = 0.05; // 5% death risk
      movementCost *= 2; // Double movement cost
      break;
    case TerrainType.RIVER:
      speed *= 0.3; // 70% slower in rivers
      deathRisk = 0.05; // 5% death risk
      movementCost *= 3; // Triple movement cost
      break;
    case TerrainType.PLAINS:
      // No modifications for plains
      break;
  }

  return {
    speed,
    deathRisk,
    movementCost: Math.ceil(movementCost), // Round up movement cost
  };
}
