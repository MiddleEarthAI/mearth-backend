import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { ActionContext, GameAction } from "@/types";
import { ActionResult } from "./types/feedback";
import { BattleHandler } from "./handlers/battle";
import { MovementHandler } from "./handlers/movement";
import { AllianceHandler } from "./handlers/alliance";
import { IgnoreHandler } from "./handlers/ignore";
import { getGamePDA } from "@/utils/pda";
// Import other handlers as they are created

/**
 * Manages the execution and validation of game actions
 */
export class ActionManager {
  private readonly battleHandler: BattleHandler;
  private readonly movementHandler: MovementHandler;
  private readonly allianceHandler: AllianceHandler;
  private readonly ignoreHandler: IgnoreHandler;
  // Add other handlers as they are created

  /**
   * Creates an instance of ActionManager
   * @param program - The Mearth program instance
   * @param prisma - Prisma client instance for database operations
   */
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {
    this.battleHandler = new BattleHandler(program, prisma);
    this.movementHandler = new MovementHandler(program, prisma);
    this.allianceHandler = new AllianceHandler(program, prisma);
    this.ignoreHandler = new IgnoreHandler(program, prisma);
    // Initialize other handlers
    console.log("🎮 Action Manager initialized");
  }

  /**
   * Execute a game action with validation and feedback
   */
  async executeAction(
    ctx: ActionContext,
    action: GameAction
  ): Promise<ActionResult> {
    console.info(
      `Agent ${ctx.agentId} executing ${action.type} | Game: ${ctx.gameId} | OnchainGame: ${ctx.gameOnchainId} | OnchainAgent: ${ctx.agentOnchainId}`
    );

    try {
      // Validate game state
      await this.validateGameState(ctx);

      // Execute appropriate action
      switch (action.type) {
        case "BATTLE":
          return this.battleHandler.handle(ctx, action);
        case "MOVE":
          return this.movementHandler.handle(ctx, action);
        case "FORM_ALLIANCE":
        case "BREAK_ALLIANCE":
          return this.allianceHandler.handle(ctx, action);
        case "IGNORE":
          return this.ignoreHandler.handle(ctx, action);
        // Add other action types as handlers are created
        default:
          throw new Error(
            `Invalid action type: ${(action as GameAction).type}`
          );
      }
    } catch (error) {
      console.error(`Action execution failed for agent ${ctx.agentId}`, {
        error,
      });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: (action as GameAction).type,
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  /**
   * Validate game state before executing actions
   */
  private async validateGameState(ctx: ActionContext): Promise<void> {
    console.log("🔍 Validating game state...");
    const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
    const gameAccount = await this.program.account.game.fetch(gamePda);

    if (!gameAccount.isActive) {
      console.error("❌ Game validation failed - Game is not active");
      throw new Error("Game is not active");
    }
  }
}
