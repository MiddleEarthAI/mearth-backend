import { ActionContext, GameAction } from "@/types";
import { ActionResult } from "./feedback";

/**
 * Base interface for all action handlers
 */
export interface ActionHandler<T extends GameAction> {
  handle(ctx: ActionContext, action: T): Promise<ActionResult>;
}
