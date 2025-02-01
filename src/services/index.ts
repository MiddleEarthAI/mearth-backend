import { mountains, plains, rivers } from "@/constants";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { GameService } from "@/services/GameService";

import { TerrainType } from "@prisma/client";
import { logger } from "@/utils/logger";
import type { Program } from "@coral-xyz/anchor";
import { BattleResolutionService } from "./BattleResolutionService";
import { getProgramWithWallet } from "@/utils/program";

let gameService: GameService | null = null;

let battleResolutionService: BattleResolutionService | null = null;

/**
 * Initialize all services
 * @param gameId Game ID
 * @param program Middle Earth program
 */
export async function initializeServices(): Promise<void> {
  const program = await getProgramWithWallet();
  try {
    gameService = new GameService(program);
    battleResolutionService = new BattleResolutionService(gameService, program);
    battleResolutionService.start();

    logger.info("Game services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services:", error);
    throw error;
  }
}

/**
 * Get the game service instance
 */
export function getGameService(): GameService {
  if (!gameService) {
    throw new Error("GameService not initialized");
  }
  return gameService;
}

export function getTerrain(x: number, y: number): TerrainType | null {
  if (mountains.coordinates.has(`${x},${y}`)) {
    return TerrainType.Mountain;
  } else if (plains.coordinates.has(`${x},${y}`)) {
    return TerrainType.Plain;
  } else if (rivers.coordinates.has(`${x},${y}`)) {
    return TerrainType.River;
  }

  return null;
}
