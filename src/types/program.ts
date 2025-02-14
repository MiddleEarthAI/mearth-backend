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
  // Basic references
  game: PublicKey; // The Game this Agent belongs to
  authority: PublicKey; // Who can control this Agent
  id: BN; // Unique Agent ID

  // Position and state
  x: BN; // X coordinate
  y: BN; // Y coordinate
  isAlive: boolean; // Whether Agent is alive
  lastMove: BN; // Timestamp of last movement
  lastBattle: BN; // Timestamp of last battle

  // Alliance/ignore info
  allianceWith: PublicKey | null; // ID of agent allied with
  allianceTimestamp: BN; // When alliance was formed
  lastAllianceAgent: PublicKey | null; // Pubkey of the last allied agent
  lastAllianceBroken: BN; // When last alliance was broken

  // Token/staking info
  tokenBalance: BN; // Deprecated if querying real-time vault balance
  stakedBalance: BN; // Total tokens staked
  lastRewardClaim: BN; // Last reward claim timestamp
  totalShares: BN; // Total shares representing staking pool ownership

  // Action timestamps
  lastAttack: BN;
  lastIgnore: BN;
  lastAlliance: BN;
  nextMoveTime: BN;
  battleStartTime: BN | null; // Store battle start time (null if not in battle)

  // PDA-related info
  vaultBump: number; // Bump seed for the PDA representing the agent's vault
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
