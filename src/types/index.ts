export type Position = {
  x: number;
  y: number;
};

import type { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";

import type { Twitter } from "@/services/twitter";
import type { AnthropicProvider } from "@ai-sdk/anthropic";
import type * as anchor from "@coral-xyz/anchor";

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;

export interface ITwitter {
  postTweet(content: string, agentUsername: string): Promise<void>;
}

export type IAgent = {
  anthropic: AnthropicProvider;

  twitter: Twitter | null;

  start(): Promise<void>;
  processQuery(query: string): Promise<void>;
  stop(): void;
};
