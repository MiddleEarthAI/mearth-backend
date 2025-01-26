import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { TerrainType } from "@prisma/client";
import { calculateDistance } from "./utils";

interface TerrainScanResult {
  terrain: TerrainType;
  coordinates: { x: number; y: number };
  occupants: Array<{
    name: string;
    twitterHandle: string;
    status: string;
  }>;
  dangerLevel: number; // 0-1 scale
}

/**
 * Scans terrain within radius of a point
 */
async function scanArea(
  centerX: number,
  centerY: number,
  radius: number
): Promise<TerrainScanResult[]> {
  // Get all locations within radius
  const locations = await prisma.location.findMany({
    where: {
      AND: [
        { x: { gte: centerX - radius, lte: centerX + radius } },
        { y: { gte: centerY - radius, lte: centerY + radius } },
      ],
    },
    include: {
      agents: {
        where: { status: "ACTIVE" },
        select: {
          name: true,
          twitterHandle: true,
          status: true,
        },
      },
    },
  });

  return locations
    .map((location) => {
      // Calculate distance from center
      const distance = calculateDistance(
        centerX,
        centerY,
        location.x,
        location.y
      );
      if (distance > radius) return null;

      // Calculate danger level based on terrain and occupants
      const terrainDanger =
        location.terrain === TerrainType.MOUNTAINS
          ? 0.7
          : location.terrain === TerrainType.RIVER
          ? 0.5
          : 0.2;
      const occupantDanger = location.agents.length * 0.3;
      const dangerLevel = Math.min(1, terrainDanger + occupantDanger);

      return {
        terrain: location.terrain,
        coordinates: { x: location.x, y: location.y },
        occupants: location.agents,
        dangerLevel,
      };
    })
    .filter(Boolean) as TerrainScanResult[];
}

export const scanTerrainTool = function (agentId: string) {
  return tool({
    description: `Advanced terrain scanning tool:
      - Analyzes terrain types in radius
      - Detects agent presence
      - Calculates danger levels
      - Identifies strategic positions
      Essential for tactical movement and battle planning.`,
    parameters: z.object({
      radius: z.number().min(1).max(10).describe("Scan radius (1-10 units)"),
    }),
    execute: async ({ radius }) => {
      try {
        // Get agent's current location
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            currentLocation: true,
          },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        // Scan area around agent
        const scanResults = await scanArea(
          agent.currentLocation.x,
          agent.currentLocation.y,
          radius
        );

        // Calculate summary statistics
        const summary = {
          totalLocations: scanResults.length,
          terrainDistribution: scanResults.reduce((acc, result) => {
            acc[result.terrain] = (acc[result.terrain] || 0) + 1;
            return acc;
          }, {} as Record<TerrainType, number>),
          averageDanger:
            scanResults.reduce((sum, result) => sum + result.dangerLevel, 0) /
            scanResults.length,
          occupiedLocations: scanResults.filter(
            (result) => result.occupants.length > 0
          ).length,
        };

        return {
          success: true,
          message: `Scanned ${scanResults.length} locations within ${radius} units`,
          scan: scanResults,
          summary,
        };
      } catch (error) {
        logger.error("Terrain scan error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Scan failed",
        };
      }
    },
  });
};
