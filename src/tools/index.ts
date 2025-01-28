import type { GameService } from "@/services/GameService";
import type { TwitterService } from "@/services/TwitterService";
import { allianceTool } from "./alliance";
import { battleTool } from "./battle";
import { ignoreTool } from "./ignore";
import { moveTool } from "./movement";
import { tweetTool } from "./tweet";
import type { CoreTool } from "ai";

/**
 * Get all tools for an agent with proper service integrations
 */
export const getAgentTools = async (
  gameId: number,
  agentId: number,
  gameService: GameService,
  twitter: TwitterService | null
): Promise<Record<string, CoreTool<any, any>>> => {
  const tools = {
    move: await moveTool(gameId, agentId, gameService),
    battle: await battleTool(gameId, agentId, gameService),
    proposeAlliance: await allianceTool(gameId, agentId, gameService),
    ignore: await ignoreTool(gameId, agentId, gameService),
    tweet: await tweetTool(gameId.toString(), twitter),
  };

  return tools;
};
