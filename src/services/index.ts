import { mountains, plains, rivers } from "@/constants";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { GameService } from "@/services/GameService";
import { GameStateService } from "@/services/GameStateService";
import { TokenService } from "@/services/TokenService";
import { TerrainType } from "@prisma/client";
import { logger } from "@/utils/logger";
import type { Program } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

let gameService: GameService | null = null;
let gameStateService: GameStateService | null = null;
let tokenService: TokenService | null = null;

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
    gameStateService = new GameStateService(program, connection);
    tokenService = new TokenService(program, connection);

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

/**
 * Get the game state service instance
 */
export function getGameStateService(): GameStateService {
  if (!gameStateService) {
    throw new Error("GameStateService not initialized");
  }
  return gameStateService;
}

/**
 * Get the token service instance
 */
export function getTokenService(): TokenService {
  if (!tokenService) {
    throw new Error("TokenService not initialized");
  }
  return tokenService;
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
