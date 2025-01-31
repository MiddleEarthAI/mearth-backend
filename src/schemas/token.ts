import { z } from "zod";

/**
 * Schema for token staking request
 */
export const stakeTokensSchema = z.object({
  gameId: z.number().int().positive(),
  agentId: z.number().int().nonnegative(),
  amount: z.number().positive(),
});

/**
 * Schema for token unstaking request
 */
export const unstakeTokensSchema = z.object({
  gameId: z.number().int().positive(),
  agentId: z.number().int().nonnegative(),
  amount: z.number().positive(),
});

/**
 * Schema for staking rewards claim request
 */
export const claimRewardsSchema = z.object({
  gameId: z.number().int().positive(),
  agentId: z.number().int().nonnegative(),
});

/**
 * Schema for stake info request
 */
export const stakeInfoSchema = z.object({
  gameId: z.number().int().positive(),
  agentId: z.number().int().nonnegative(),
});
