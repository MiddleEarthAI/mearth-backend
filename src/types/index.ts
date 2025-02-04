import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";

import type * as anchor from "@coral-xyz/anchor";
import { TerrainType } from "@prisma/client";
export interface Position {
  x: number;
  y: number;
}

export type ActionType = "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE";

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;

export interface ValidationFeedback {
  isValid: boolean;
  error?: {
    type: ActionType;
    message: string;
    context: {
      currentState: any;
      attemptedAction: any;
      allowedValues?: any;
      suggestedFix?: string;
    };
  };
}

export interface ActionResult {
  success: boolean;
  feedback?: ValidationFeedback;
  retryContext?: {
    previousAttempt: any;
    failureReason: string;
    maxRetries: number;
    currentRetry: number;
  };
}

export interface MoveAction {
  type: "MOVE";
  x: number;
  y: number;
  terrain?: TerrainType;
}

export interface BattleAction {
  type: "BATTLE";
  targetId: number;
  allyId?: number;
  tokensToStake: number;
}

export interface AllianceAction {
  type: "ALLIANCE";
  targetId: number;
  allyId?: number;
  combinedTokens?: number;
}

export interface IgnoreAction {
  type: "IGNORE";
  targetId?: number;
  allyId?: number;
  position?: Position;
  content?: string;
  tweet?: string;
}

export type GameAction =
  | MoveAction
  | BattleAction
  | AllianceAction
  | IgnoreAction;
