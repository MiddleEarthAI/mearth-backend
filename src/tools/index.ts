import type { CoreTool } from "ai";
import { allianceTool } from "./alliance";
import { battleTool } from "./battle";
// import { ignoreTool } from "./ignore";
import { movementTool } from "./movement";
import { tweetTool } from "./tweet";

import { TwitterClient } from "@/agent/TwitterClient";
import { logger } from "@/utils/logger";

/**
 * Get all tools for an agent with proper service integrations
 * @param gameId - The ID of the game
 * @param agentId - The ID of the agent
 * @returns Record of available tools for the agent
 */
export const getAgentTools = async ({
  gameId,
  agentId,
  twitterClient,
}: {
  gameId: number;
  agentId: number;
  twitterClient: TwitterClient | null;
}): Promise<Record<string, CoreTool<any, any>>> => {
  logger.info(
    `Creating tools for agent ${agentId} in game ${gameId} with twitter client ${twitterClient}`
  );
  const toolsMap = {
    // movement: await movementTool({ gameId, agentId }),
    battle: await battleTool({ gameId, agentId }),
    alliance: await allianceTool({ gameId, agentId }),
    // ignore: await ignoreTool(gameId, agentId),
    tweet: await tweetTool({ agentId, gameId, twitterClient }),
  } satisfies Record<string, CoreTool<any, any>>;

  return toolsMap;
};
