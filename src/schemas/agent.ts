import { z } from "zod";

/**
 * Schema for agent registration request
 */
export const registerAgentSchema = z.object({
  gameId: z.number().int().positive(),
  agentId: z.number().int().nonnegative(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  name: z.string().min(1).max(32),
  xHandle: z.string().min(1).max(32),
});

/**
 * Schema for agent state update request
 */
export const updateAgentStateSchema = z.object({
  agentId: z.number().int().nonnegative(),
  health: z.number().int().min(0).max(100),
  isAlive: z.boolean(),
  lastActionType: z.enum(["move", "battle", "alliance", "ignore"]),
  lastActionDetails: z.string(),
});

/**
 * Schema for agent personality update request
 */
export const updateAgentPersonalitySchema = z.object({
  agentId: z.number().int().nonnegative(),
  aggressiveness: z.number().int().min(0).max(100),
  trustworthiness: z.number().int().min(0).max(100),
  manipulativeness: z.number().int().min(0).max(100),
  intelligence: z.number().int().min(0).max(100),
  adaptability: z.number().int().min(0).max(100),
  baseInfluence: z.number().nonnegative(),
  followerMultiplier: z.number().nonnegative(),
  engagementMultiplier: z.number().nonnegative(),
  consensusMultiplier: z.number().nonnegative(),
});

/**
 * Schema for agent location update request
 */
export const updateAgentLocationSchema = z.object({
  agentId: z.number().int().nonnegative(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  fieldType: z.enum(["Plain", "Mountain", "River"]),
  stuckTurnsRemaining: z.number().int().min(0),
});
