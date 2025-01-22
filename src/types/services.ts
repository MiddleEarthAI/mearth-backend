import {
  Agent,
  Position,
  TerrainType,
  Battle,
  GameState,
  AgentDecision,
} from "./game";
import { Keypair } from "@solana/web3.js";

export interface IGameService {
  initializeDefaultAgents(): Promise<void>;
  processBattle(initiatorId: string, defenderId: string): Promise<void>;
  formAlliance(agent1Id: string, agent2Id: string): Promise<void>;
  breakAlliance(agentId: string): Promise<void>;
  moveAgent(
    agentId: string,
    x: number,
    y: number,
    terrain: TerrainType
  ): Promise<void>;
  findNearbyAgents(agent: Agent, range?: number): Promise<Agent[]>;
  determineTerrainType(position: Position): TerrainType;
  getGameState(): Promise<any>;
  initializeAgent(
    agentId: string,
    name: string,
    type: string,
    initialTokens: number
  ): Promise<void>;
}

export interface ILLMService {
  getNextMove(agentId: string): Promise<any>;
  getBattleStrategy(agentId: string, opponentId: string): Promise<any>;
  processCommunityFeedback(feedback: any): Promise<any>;
  generateTweet(agentId: string, event: string): Promise<string>;
}

export interface ITwitterService {
  postTweet(agent: Agent, content: string): Promise<void>;
  getAgentFeedback(agent: Agent): Promise<any>;
  announceMovement(agentId: string, x: number, y: number): Promise<void>;
  announceBattle(
    initiatorId: string,
    defenderId: string,
    outcome: string
  ): Promise<void>;
  announceAlliance(agent1Id: string, agent2Id: string): Promise<void>;
  fetchCommunityFeedback(): Promise<any>;
}

export interface ISolanaService {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  initializeAgent(
    agentId: string,
    name: string,
    type: string,
    initialTokens: number
  ): Promise<string>;
  processBattle(
    initiatorId: string,
    defenderId: string,
    tokensBurned: number
  ): Promise<string>;
  formAlliance(agent1Id: string, agent2Id: string): Promise<string>;
  updateAgentPosition(agentId: string, x: number, y: number): Promise<string>;
}

export interface IKeyManagerService {
  generateKeypair(agentId: string): Promise<Keypair>;
  getKeypair(agentId: string): Promise<Keypair>;
  rotateKeypair(agentId: string): Promise<Keypair>;
}
