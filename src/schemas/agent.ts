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
