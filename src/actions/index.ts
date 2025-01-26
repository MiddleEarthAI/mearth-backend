import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { moveTool } from "./movement";
import { battleTool } from "./battle";
import { proposeAllianceTool } from "./alliance";
import { tweetTool } from "./tweet";
import { scanTerrainTool } from "./terrain";
import { tokenomicsTool } from "./tokenomics";

export interface AgentTools {
  moveTool: ReturnType<typeof moveTool>;
  battleTool: ReturnType<typeof battleTool>;
  proposeAllianceTool: ReturnType<typeof proposeAllianceTool>;
  tweetTool: ReturnType<typeof tweetTool>;
  scanTerrainTool: ReturnType<typeof scanTerrainTool>;
  tokenomicsTool: ReturnType<typeof tokenomicsTool>;
}

export function getAgentTools(
  agentId: string,
  solana: Solana,
  twitter: Twitter | null
): AgentTools {
  return {
    moveTool: moveTool(agentId, solana),
    battleTool: battleTool(agentId),
    proposeAllianceTool: proposeAllianceTool(agentId),
    tweetTool: tweetTool(agentId, twitter),
    scanTerrainTool: scanTerrainTool(agentId),
    tokenomicsTool: tokenomicsTool(agentId),
  };
}
