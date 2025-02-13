import { AgentAccount } from "@/types/program";
import { PublicKey } from "@solana/web3.js";

/**
 * Represents a participant in a battle
 */
export interface BattleParticipant {
  agent: {
    id: string;
    onchainId: number;
    authority: PublicKey;
  };
  agentAccount: AgentAccount;
  tokenBalance: number;
}

/**
 * Represents a group of agents in battle
 */
export interface BattleGroup {
  id: string;
  type: "Simple" | "AgentVsAlliance" | "AllianceVsAlliance";
  sideA: BattleParticipant[];
  sideB: BattleParticipant[];
  startTime: number;
  cooldownDuration: number;
}

/**
 * Battle outcome calculation result
 */
export interface BattleOutcome {
  sideAWins: boolean;
  percentLoss: number;
}
