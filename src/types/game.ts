export enum AgentType {
  SCOOTLES = "SCOOTLES",
  PURRLOCK_PAWS = "PURRLOCK_PAWS",
  SIR_GULLIHOP = "SIR_GULLIHOP",
  WANDERLEAF = "WANDERLEAF",
}

export enum TerrainType {
  NORMAL = "NORMAL",
  MOUNTAIN = "MOUNTAIN",
  RIVER = "RIVER",
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

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  position: Position;
  tokenBalance: number;
  isAlive: boolean;
  allianceWith?: string; // ID of allied agent
  lastBattleTime?: Date;
  lastAllianceTime?: Date;
  twitterHandle: string;
  characteristics: {
    aggressiveness: number; // 0-100
    alliancePropensity: number; // 0-100
    influenceability: number; // 0-100
  };
}

export interface Battle {
  id: string;
  initiatorId: string;
  defenderId: string;
  timestamp: Date;
  outcome: BattleOutcome;
  tokensBurned: number;
  location: Position;
}

export interface Alliance {
  id: string;
  agent1Id: string;
  agent2Id: string;
  formedAt: Date;
  dissolvedAt?: Date;
}

export interface Movement {
  id: string;
  agentId: string;
  from: Position;
  to: Position;
  terrain: TerrainType;
  timestamp: Date;
  speed: number;
}
