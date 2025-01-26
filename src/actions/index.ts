import type { Solana } from "@/deps/solana";
import type { Twitter } from "@/deps/twitter";
import { proposeAllianceTool } from "./alliance";
import { battleTool } from "./battle";
import { ignoreTool } from "./ignore";
import { moveTool } from "./movement";
import { tokenomicsTool } from "./tokenomics";
import { tweetTool } from "./tweet";

import type { CoreTool } from "ai";

// Export a function to get all tools for an agent
export const getAgentTools = async (
  agentId: string,
  solana: Solana,
  twitter: Twitter | null
): Promise<Record<string, CoreTool<any, any>>> => {
  const tools = {
    move: await moveTool(agentId, solana),
    battle: await battleTool(agentId, solana),
    proposeAlliance: await proposeAllianceTool(agentId),
    ignore: await ignoreTool(agentId),
    tweet: await tweetTool(agentId, twitter),
    tokenomics: await tokenomicsTool(agentId),
  };

  return tools;
};
