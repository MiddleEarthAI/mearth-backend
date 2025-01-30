import type { CoreTool } from "ai";
import { allianceTool } from "./alliance";
import { battleTool } from "./battle";
import { ignoreTool } from "./ignore";
import { movementTool } from "./movement";
import { tweetTool } from "./tweet";

import { TwitterClient } from "@/agent/TwitterClient";

/**
 * Get all tools for an agent with proper service integrations
 * @param gameId - The ID of the game
 * @param agentId - The ID of the agent
 * @returns Record of available tools for the agent
 */
export const getAgentTools = async (
  gameId: number,
  agentId: number,
  twitterClient: TwitterClient | null
): Promise<Record<string, CoreTool<any, any>>> => {
  const toolsMap = {
    movement: await movementTool(gameId, agentId),
    battle: await battleTool(gameId, agentId),
    alliance: await allianceTool(gameId, agentId),
    ignore: await ignoreTool(gameId, agentId),
    tweet: await tweetTool(gameId, twitterClient),
  } satisfies Record<string, CoreTool<any, any>>;

  return toolsMap;
};
