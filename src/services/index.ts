import { mountains, plains, rivers } from "@/constants";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { GameService } from "@/services/GameService";

import { TerrainType } from "@prisma/client";
import { logger } from "@/utils/logger";
import type { Program } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";
import { BattleResolutionService } from "./BattleResolutionService";

let gameService: GameService | null = null;

let battleResolutionService: BattleResolutionService | null = null;

/**
 * Initialize all services
 * @param gameId Game ID
 * @param connection Solana connection
 * @param program Middle Earth program
 */
export async function initializeServices(
  connection: Connection,
  program: Program<MiddleEarthAiProgram>
): Promise<void> {
  try {
    gameService = new GameService(program, connection);
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
