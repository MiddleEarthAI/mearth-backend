import { mountains, rivers } from "@/constants";
import { TerrainType } from "@prisma/client";
import { plains } from "@/constants";
import { prisma } from "@/config/prisma";

export function getAgentConfigById(id: number) {
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
 * Generates a unique game ID that fits within u16 constraints (0-65535)
 * Uses a combination of timestamp and random number to ensure uniqueness
 * Note: u16 range (0-65535) fits safely within JavaScript Number
 * @returns {number} A unique game ID as a number (u16 compatible)
 */
export async function generateGameId(): Promise<number> {
  // Get last 8 bits of current timestamp
  const timestamp = Date.now() & 0xff;

  // Generate 8 random bits
  const random = Math.floor(Math.random() * 0xff);

  // Combine timestamp (8 bits) and random (8 bits)
  // This ensures we stay within u16 (16-bit unsigned integer) bounds (0-65535)
  const gameId = (timestamp << 8) | random;

  return gameId; // Safe since u16 (max 65535) fits within JavaScript Number
}

/**
 * Utility function to validate if a game ID is within u16 bounds (0-65535)
 * @param {number} gameId - The game ID to validate
 * @returns {boolean} Whether the game ID is valid
 */
export function isValidGameId(gameId: number): boolean {
  if (typeof gameId !== "number") return false;
  if (!Number.isInteger(gameId)) return false;
  if (gameId < 0) return false;
  if (gameId >= 2 ** 16) return false; // 65536
  return true;
}

export function getTerrain(x: number, y: number): TerrainType | null {
  if (mountains.coordinates.has(`${x},${y}`)) {
    return TerrainType.mountain;
  } else if (plains.coordinates.has(`${x},${y}`)) {
    return TerrainType.plain;
  } else if (rivers.coordinates.has(`${x},${y}`)) {
    return TerrainType.river;
  }

  return null;
}

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbError) {
    throw dbError;
  }
}
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const formatNumber = (
  number: number,
  options?: Intl.NumberFormatOptions
) => {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return new Intl.NumberFormat("en-US", defaultOptions).format(number);
};
