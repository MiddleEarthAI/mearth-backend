import { TerrainType } from "@prisma/client";

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

interface MovementCalculation {
  speed: number;
  deathRisk: number;
  movementCost: number;
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
