import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { moveTool } from "./movement";
import { battleTool } from "./battle";
import { proposeAllianceTool } from "./alliance";
import { tweetTool } from "./tweet";
import { tokenomicsTool } from "./tokenomics";
import { ignoreTool } from "./ignore";

import { CoreTool } from "ai";

// Export a function to get all tools for an agent
export const getAgentTools = async (
  agentId: string,
  solana: Solana,
  twitter: Twitter
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
