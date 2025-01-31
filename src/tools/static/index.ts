import type { CoreTool } from "ai";
import type { TwitterClient } from "@/agent/TwitterClient";

// Social tools
import { tweetTool } from "./tweet.tool";

// World interaction tools
import { movementTool } from "./movement.tool";

import { formAllianceTool } from "./formAlliance.tool";
import { breakAllianceTool } from "./breakAlliance.tool";

export interface ToolContext {
  agentId: number;
  gameId: number;
  twitterClient?: TwitterClient | null;
}

/**
 * Get all AI tools for an agent with proper service integrations
 */
export const getAgentTools = async (
  context: ToolContext
): Promise<Record<string, CoreTool>> => {
  const { agentId, gameId, twitterClient } = context;

  return {
    // Social interaction tools
    tweet: tweetTool(twitterClient || null),
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
