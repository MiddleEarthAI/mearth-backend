import { AgentAccount } from "@/types/program";
import { BattleType } from "@prisma/client";

/**
 * Represents one side in a battle, containing one or more agents
 */
export interface BattleSide {
  agents: AgentAccount[];
  totalTokens: number;
  profiles?: { xHandle: string }[];
}

export interface BattleParticipants {
  attackerAccount: AgentAccount;
  defenderAccount: AgentAccount;
  attackerAllyAccount?: AgentAccount | null;
  defenderAllyAccount?: AgentAccount | null;
}

export interface BattleMetadata {
  battleType: BattleType;
  tokensAtStake: number;
  timestamp: string;
  attackerHandle: string;
  defenderHandle: string;
}
