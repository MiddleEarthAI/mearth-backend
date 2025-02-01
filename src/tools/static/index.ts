import type { CoreTool } from "ai";

// Social tools
import { tweetTool } from "./tweet.tool";

// World interaction tools
import { movementTool } from "./movement.tool";

import { formAllianceTool } from "./formAlliance.tool";
import { breakAllianceTool } from "./breakAlliance.tool";
import { TwitterApi } from "twitter-api-v2";

export interface ToolContext {
  agentId: number;
  gameId: number;
  twitterApi: TwitterApi;
}

/**
 * Get all AI tools for an agent with proper service integrations
 */
export const getAgentTools = async (
  context: ToolContext
): Promise<Record<string, CoreTool>> => {
  const { agentId, gameId, twitterApi } = context;

  return {
    // Social interaction tools
    tweet: await tweetTool({ agentId, gameId, twitterApi }),
    // World interaction tools
    move: movementTool({ gameId, agentId }),
    formAlliance: await formAllianceTool({ gameId, agentId }),
    breakAlliance: await breakAllianceTool({ gameId, agentId }),
  };
};

// Re-export tool types and enums
export * from "./tweet.tool";
export * from "./movement.tool";
export * from "./battle.tool";
export * from "./breakAlliance.tool";
export * from "./formAlliance.tool";
