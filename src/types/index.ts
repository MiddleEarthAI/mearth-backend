export type Position = {
  x: number;
  y: number;
};
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import * as anchor from "@coral-xyz/anchor";

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;
import { Keypair } from "@solana/web3.js";

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

export interface IAgent {}

export interface ISolana {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  processBattle(
    initiatorId: string,
    defenderId: string,
    tokenBurn: number
  ): Promise<string>;
  processAlliance(agentId1: string, agentId2: string): Promise<string>;
  processMovement(agentId: string, x: number, y: number): Promise<string>;
  getTokenBalance(agentId: string): Promise<number>;
  burnTokens(agentId: string, amount: number): Promise<string>;
  transferTokens(
    fromAgentId: string,
    toAgentId: string,
    amount: number
  ): Promise<string>;
}
