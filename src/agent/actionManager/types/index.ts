import { ActionContext, ActionResult, GameAction } from "@/types";

/**
 * Base interface for all action handlers
 */
export interface ActionHandler<T extends GameAction> {
  handle(ctx: ActionContext, action: T): Promise<ActionResult>;
}

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
