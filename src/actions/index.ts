import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { moveTool } from "./movement";
import { battleTool } from "./battle";
import { proposeAllianceTool } from "./alliance";
import { tweetTool } from "./tweet";
import { scanTerrainTool } from "./terrain";
import { tokenomicsTool } from "./tokenomics";
import { ignoreTool } from "./ignore";
import { analyzeSentimentTool } from "./actions";
import { calculateRewardsTool } from "./actions";
import { analyzeTokenomicsTool, predictEncountersTool } from "./actions";
import { checkDistanceTool } from "./actions";

export interface AgentTools {
  moveTool: ReturnType<typeof moveTool>;
  battleTool: ReturnType<typeof battleTool>;
  proposeAllianceTool: ReturnType<typeof proposeAllianceTool>;
  tweetTool: ReturnType<typeof tweetTool>;
  scanTerrainTool: ReturnType<typeof scanTerrainTool>;
  tokenomicsTool: ReturnType<typeof tokenomicsTool>;
  ignoreTool: ReturnType<typeof ignoreTool>;
}

// Export a function to get all tools for an agent
export const getAgentTools = (
  agentId: string,
  solana: Solana,
  twitter: Twitter
) => ({
  moveTool: moveTool(agentId, solana),
  scanTerrainTool: scanTerrainTool(agentId),
  checkDistanceTool: checkDistanceTool(agentId),
  predictEncountersTool: predictEncountersTool(agentId),
  battleTool: battleTool(agentId),
  proposeAllianceTool: proposeAllianceTool(agentId),
  analyzeTokenomicsTool: analyzeTokenomicsTool(agentId),
  calculateRewardsTool: calculateRewardsTool(agentId),
  analyzeSentimentTool: analyzeSentimentTool(agentId),
  ignoreTool: ignoreTool(agentId),
  tweetTool: tweetTool(agentId, twitter),
  tokenomicsTool: tokenomicsTool(agentId),
});

export * from "./telegram";
