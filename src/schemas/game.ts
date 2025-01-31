import { z } from "zod";

/**
 * Schema for game initialization request
 */
export const initializeGameSchema = z.object({
  gameId: z.number().int().positive(),
  authority: z.string().min(32).max(44), // Base58 encoded public key
  tokenMint: z.string().min(32).max(44), // Base58 encoded public key
  rewardsVault: z.string().min(32).max(44), // Base58 encoded public key
  mapDiameter: z.number().int().positive(),
  dailyRewardTokens: z.number().nonnegative(),
});

/**
 * Schema for game state update request
 */
export const updateGameStateSchema = z.object({
  gameId: z.number().int().positive(),
  isActive: z.boolean(),
  lastUpdate: z.date(),
});

/**
 * Schema for daily rewards update request
 */
export const updateDailyRewardsSchema = z.object({
  gameId: z.number().int().positive(),
  dailyRewardTokens: z.number().nonnegative(),
});
