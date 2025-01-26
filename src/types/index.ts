export type Position = {
  x: number;
  y: number;
};

export enum TerrainType {
  PLAIN = "PLAIN",
  MOUNTAIN = "MOUNTAIN",
  RIVER = "RIVER",
}

import type { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { AnthropicProvider } from "@ai-sdk/anthropic";
import type * as anchor from "@coral-xyz/anchor";

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;
import type { Keypair, Message } from "@solana/web3.js";

export interface IKeyManagerService {
  rotateKeypair(agentId: string): Promise<void>;
  getPublicKey(agentId: string): Promise<string>;
  getEncryptedPrivateKey(agentId: string): Promise<{
    encryptedKey: string;
    iv: Buffer;
    tag: Buffer;
  }>;
  getKeypair(agentId: string): Promise<Keypair>;
}

export interface IKeyManager {
  rotateKeypair(agentId: string): Promise<void>;
  getPublicKey(agentId: string): Promise<string>;
  getEncryptedPrivateKey(agentId: string): Promise<{
    encryptedKey: string;
    iv: Buffer;
    tag: Buffer;
  }>;
  getKeypair(agentId: string): Promise<Keypair>;
}

export interface ITwitter {
  postTweet(content: string): Promise<void>;
}

export type IAgent = {
  anthropic: AnthropicProvider;
  solana: Solana;
  twitter: Twitter | null;

  start(): Promise<void>;
  processQuery(query: string): Promise<void>;
  stop(): void;
};

export interface ISolana {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;

  // Movement
  processMoveAgent(
    agentId: string,
    x: number,
    y: number,
    terrain: TerrainType
  ): Promise<string>;

  // Alliance management
  processFormAlliance(agentId1: string, agentId2: string): Promise<string>;
  processBreakAlliance(agentId1: string, agentId2: string): Promise<string>;
  processIgnoreAgent(agentId: string, targetAgentId: string): Promise<string>;
}

export interface ITelegram {
  init(): Promise<void>;
  sendMessage(chatId: string, text: string): Promise<void>;
  replyToMessage(
    chatId: string,
    messageId: string,
    text: string
  ): Promise<void>;
  getCommunityFeedback(): Promise<
    {
      suggestedAction: "move" | "battle" | "alliance" | "ignore";
      targetAgent?: string;
      coordinates?: { x: number; y: number };
      confidence: number;
      influence: {
        memberCount: number;
        messageViews: number;
        reactions: number;
        replies: number;
        influencerImpact: number;
        sentiment: "positive" | "negative" | "neutral";
      };
      reasoning?: string;
    }[]
  >;
}
