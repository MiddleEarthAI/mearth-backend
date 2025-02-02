import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { logger } from "@/utils/logger";
import { Program } from "@coral-xyz/anchor";
import type { AnchorProvider } from "@coral-xyz/anchor";
import { mountains, rivers } from "@/constants";
import { TerrainType } from "@prisma/client";
import { plains } from "@/constants";
import { prisma } from "@/config/prisma";

export function getAgentConfigById(id: number) {
  logger.info(`Getting agent config for id ${id}`);

  const config = {
    username: process.env[`${id}_USERNAME`] ?? "",
    password: process.env[`${id}_PASSWORD`] ?? "",
    email: process.env[`${id}_EMAIL`] ?? "",
    twitter2faSecret: process.env[`${id}_2FA_SECRET`] ?? "",
  };

  if (Object.values(config).some((value) => value === "")) {
    throw new Error(`Agent config for id ${id} is missing required fields`);
  }

  return config;
}

/**
 * Get the Middle Earth program instance
 */
export async function getProgram(
  provider: AnchorProvider
): Promise<Program<MiddleEarthAiProgram>> {
  try {
    const program = new Program<MiddleEarthAiProgram>(
      mearthIdl as MiddleEarthAiProgram,
      provider
    );
    return program;
  } catch (error) {
    logger.error("Failed to get program:", error);
    throw error;
  }
}

/**
 * Generates a unique game ID that fits within u16 constraints
 * Uses a combination of timestamp and random number to ensure uniqueness
 * @returns {number} A unique game ID as a number (u16 compatible)
 */
export async function generateGameId(): Promise<number> {
  // Get last 8 bits of current timestamp
  const timestamp = Date.now() & 0xff;

  // Generate 8 random bits
  const random = Math.floor(Math.random() * 0xff);

  // Combine timestamp (8 bits) and random (8 bits)
  // This ensures we stay within u16 (16-bit unsigned integer) bounds
  const gameId = (timestamp << 8) | random;

  return gameId >>> 0; // Ensure unsigned integer
}

/**
 * Utility function to validate if a game ID is within u16 bounds
 * @param {number} gameId - The game ID to validate
 * @returns {boolean} Whether the game ID is valid
 */
export function isValidGameId(gameId: number): boolean {
  if (typeof gameId !== "number") return false;
  if (!Number.isInteger(gameId)) return false;
  if (gameId < 0) return false;
  if (gameId >= 2 ** 16) return false;
  return true;
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

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbError) {
    logger.error("💥 Database connection check failed:", dbError);
    throw dbError;
  }
}
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
