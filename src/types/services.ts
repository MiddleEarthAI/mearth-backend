import {
  Agent,
  Position,
  TerrainType,
  Battle,
  GameState,
  AgentDecision,
} from "./game";
import { Keypair, PublicKey } from "@solana/web3.js";

export interface IGameService {
  initializeDefaultAgents(): Promise<void>;
  processBattle(initiatorId: string, defenderId: string): Promise<void>;
  formAlliance(agent1Id: string, agent2Id: string): Promise<void>;
  breakAlliance(agentId: string): Promise<void>;
  moveAgent(agentId: string, x: number, y: number): Promise<void>;
  findNearbyAgents(agent: Agent, range?: number): Promise<Agent[]>;
  determineTerrainType(position: Position): TerrainType;
  getGameState(): Promise<any>;
}

export interface ILLMService {
  getNextMove(agent: Agent, gameState: any): Promise<any>;
  getBattleStrategy(agent: Agent, opponent: Agent): Promise<any>;
  processCommunityFeedback(feedback: any): Promise<any>;
  generateTweet(agent: Agent, event: string, data: any): Promise<string>;
}

export interface ITwitterService {
  postTweet(agent: Agent, content: string): Promise<void>;
  getAgentFeedback(agent: Agent): Promise<any>;
  announceMovement(agent: Agent, x: number, y: number): Promise<void>;
  announceBattle(
    initiator: Agent,
    defender: Agent,
    outcome: string
  ): Promise<void>;
  announceAlliance(agent1: Agent, agent2: Agent): Promise<void>;
  fetchCommunityFeedback(): Promise<any>;
}

export interface ISolanaService {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  initializeAgent(
    agentId: string,
    name: string,
    agentType: string,
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

export interface IWebSocketService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startMonitoring(): Promise<void>;
  subscribeToProgramEvents(programId: string): Promise<void>;
  onProgramUpdate(callback: (data: any) => void): void;
  onSignatureUpdate(callback: (data: any) => void): void;
  onAccountUpdate(callback: (data: any) => void): void;
}
