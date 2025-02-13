import { ActionContext, GameAction } from "@/types";

export interface ValidationFeedback {
  isValid: boolean;
  error?: {
    type: string;
    message: string;
    context?: {
      currentState: ActionContext;
      attemptedAction: GameAction;
    };
  };
  data?: {
    transactionHash?: string;
    message?: string;
  };
}

export interface ActionResult {
  success: boolean;
  feedback: ValidationFeedback;
}
