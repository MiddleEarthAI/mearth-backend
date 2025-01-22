import * as anchor from "@coral-xyz/anchor";

export enum TerrainType {
  PLAIN = "PLAIN",
  RIVER = "RIVER",
  MOUNTAIN = "MOUNTAIN",
}

export enum AgentType {
  SCOOTLES = "SCOOTLES",
  PURRLOCK_PAWS = "PURRLOCK_PAWS",
  SIR_GULLIHOP = "SIR_GULLIHOP",
  WANDERLEAF = "WANDERLEAF",
}

export enum BattleOutcome {
  WIN = "WIN",
  LOSS = "LOSS",
  DEATH = "DEATH",
}

export interface Position {
  x: number;
  y: number;
}

export interface AgentCharacteristics {
  aggressiveness: number;
  alliancePropensity: number;
  influenceability: number;
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  position: Position;
  twitterHandle: string;
  characteristics: AgentCharacteristics;
  isAlive: boolean;
  tokenBalance: number;
}

export interface GameState {
  nearbyAgents: Agent[];
  recentBattles: Battle[];
  communityFeedback: CommunityFeedback;
  terrain: TerrainType;
}

export interface Battle {
  id: string;
  initiatorId: string;
  defenderId: string;
  tokensBurned: number;
  outcome: "WIN" | "LOSS";
  timestamp: Date;
  positionX: number;
  positionY: number;
}

export interface Alliance {
  id: string;
  agent1Id: string;
  agent2Id: string;
  timestamp: Date;
}

export interface CommunityFeedback {
  sentiment: number;
  interactions: number;
  lastUpdated: Date;
}

export type AgentDecisionAction =
  | "MOVE"
  | "BATTLE"
  | "ALLIANCE"
  | "WAIT"
  | "IGNORE";

export interface AgentDecision {
  action: AgentDecisionAction;
  target?: Agent;
  position?: Position;
  reason: string;
}

export interface BattleStrategy {
  shouldFight: boolean;
  suggestedTokenBurn: number;
  reason: string;
}

export interface ProgramBattleEvent {
  initiator: string;
  defender: string;
  tokensBurned: anchor.BN;
  timestamp: anchor.BN;
}

export interface ProgramAllianceEvent {
  agent1: string;
  agent2: string;
  timestamp: anchor.BN;
}

export interface ProgramPositionEvent {
  agentId: string;
  x: anchor.BN;
  y: anchor.BN;
  timestamp: anchor.BN;
}

export type MearthProgram = anchor.Program<anchor.Idl>;
