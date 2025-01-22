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

export interface AgentCharacteristics {
  aggressiveness: number; // 0-100
  alliancePropensity: number; // 0-100
  influenceability: number; // 0-100
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  twitterHandle: string;
  position: Position;
  tokenBalance: number;
  isAlive: boolean;
  characteristics: AgentCharacteristics;
  allianceWith?: string; // ID of allied agent
  lastBattleTime?: Date;
  lastAllianceTime?: Date;
}

export interface Battle {
  id: string;
  initiatorId: string;
  defenderId: string;
  outcome: BattleOutcome;
  tokensBurned: number;
  timestamp: Date;
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
  speed: number;
  timestamp: Date;
}

export interface CommunityFeedback {
  sentiment: number; // 0-100
  suggestions: string[];
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  influentialUsers: {
    handle: string;
    followerCount: number;
    sentiment: number;
  }[];
}

export interface GameState {
  agents: Agent[];
  battles: Battle[];
  alliances: Alliance[];
  movements: Movement[];
  communityFeedback: Record<string, CommunityFeedback>; // Keyed by agent ID
}

export interface BattleStrategy {
  shouldFight: boolean;
  reason: string;
  estimatedSuccess: number; // 0-100
  suggestedTokenBurn: number; // Percentage to burn if lost
}

export interface AgentDecision {
  action: "MOVE" | "BATTLE" | "ALLIANCE" | "WAIT";
  target?: Agent;
  position?: Position;
  reason: string;
  confidence: number; // 0-100
  communityAlignment: number; // How much this aligns with community suggestions (0-100)
}
