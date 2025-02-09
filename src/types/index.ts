import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";

import type * as anchor from "@coral-xyz/anchor";

export interface Position {
  x: number;
  y: number;
}

export type ActionType =
  | "MOVE"
  | "BATTLE"
  | "FORM_ALLIANCE"
  | "BREAK_ALLIANCE"
  | "IGNORE";

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
  position: { x: number; y: number };
  terrain: { [key: string]: {} };
  tweet: string;
}

export interface BattleAction {
  type: "BATTLE";
  targetId: number;
  tweet: string;
}

export interface FormAllianceAction {
  type: "FORM_ALLIANCE";
  targetId: number;
  tweet: string;
}

export interface BreakAllianceAction {
  type: "BREAK_ALLIANCE";
  targetId: number;
  tweet: string;
}

export interface IgnoreAction {
  type: "IGNORE";
  targetId: number;
  tweet: string;
}

export type GameAction =
  | MoveAction
  | BattleAction
  | FormAllianceAction
  | BreakAllianceAction
  | IgnoreAction;

export interface ActionContext {
  gameId: string;
  gameOnchainId: anchor.BN;
  agentId: string;
  agentOnchainId: number;
}
