import { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

export enum TerrainType {
  Plain = 0,
  Mountain = 1,
  River = 2,
}

export enum BattleResult {
  Victory = 0,
  Defeat = 1,
  Draw = 2,
}

export interface GameAccount {
  authority: PublicKey;
  alliances: Alliance[];
  lastUpdate: BN;
  gameId: BN;
  tokenMint: PublicKey;
  rewardsVault: PublicKey;
  mapDiameter: BN;
  isActive: boolean;
  bump: BN;
  totalStakeAccounts: BN;
  agents: AgentInfo[];
}

export interface AgentInfo {
  key: PublicKey;
  name: string;
  bump: number;
}

export interface AgentAccount {
  game: PublicKey;
  authority: PublicKey;
  id: BN;
  x: BN;
  y: BN;
  isAlive: boolean;
  lastMove: BN;
  lastBattle: BN;
  currentBattleStart: BN | null;
  allianceWith: PublicKey | null;
  tokenBalance: BN;
  nextMoveTime: BN;
  vaultBump: number;
}

export interface StakeInfo {
  agent: PublicKey;
  staker: PublicKey;
  amount: BN;
  shares: BN;
  lastRewardTimestamp: BN;
  cooldownEndsAt: BN;
  isInitialized: boolean;
}

export interface Alliance {
  agent: AgentAccount;
  ally: AgentAccount;
  pastAlly: AgentAccount | null;
  isActive: boolean;
  formedAt: BN;
}

export interface AllianceInfo {
  agent: AgentAccount;
  ally: AgentAccount;
  pastAlly: AgentAccount | null;
  isActive: boolean;
  formedAt: BN;
}

export interface BattleAccount {
  attacker: PublicKey;
  defender: PublicKey;
  startTime: BN;
  endTime: BN | null;
  result: BattleResult | null;
  tokensBurned: BN;
  isActive: boolean;
}

export interface ProgramError {
  code: number;
  name: string;
  msg: string;
}

export interface AgentMovedEvent {
  agentId: BN;
  oldX: BN;
  oldY: BN;
  newX: BN;
  newY: BN;
  terrain: TerrainType;
  timestamp: BN;
}

export interface BattleInitiatedEvent {
  attackerId: BN;
  defenderId: BN;
  attackerTokens: BN;
  defenderTokens: BN;
  timestamp: BN;
}

export interface BattleResolvedEvent {
  battleId: PublicKey;
  winnerId: BN;
  loserId: BN;
  tokensBurned: BN;
  deathOccurred: boolean;
  timestamp: BN;
}

export interface AllianceEvent {
  agent1Id: BN;
  agent2Id: BN;
  isFormation: boolean;
  timestamp: BN;
}

export interface StakeEvent {
  agentId: BN;
  amount: BN;
  isStake: boolean;
  shares: BN;
  timestamp: BN;
}
