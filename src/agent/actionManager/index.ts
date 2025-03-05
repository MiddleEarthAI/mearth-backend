import { ActionResult, MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { ActionContext, GameAction } from "@/types";

import { BattleHandler } from "./handlers/battle";
import { MovementHandler } from "./handlers/movement";
import { AllianceHandler } from "./handlers/alliance";
import { IgnoreHandler } from "./handlers/ignore";
import { getGamePDA } from "@/utils/pda";

/**
 * Manages the execution and validation of game actions
 */

export class ActionManager {
  private readonly battleHandler: BattleHandler;
  private readonly movementHandler: MovementHandler;
  private readonly allianceHandler: AllianceHandler;
  private readonly ignoreHandler: IgnoreHandler;

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

    console.info("🎮 Action Manager initialized");
  }

  /**
   * Execute a game action with validation and feedback
   */
  async executeAction(
    ctx: ActionContext,
    action: GameAction
  ): Promise<ActionResult> {
    console.info(`Agent ${ctx.agentId} executing ${action.type}`, {
      gameId: ctx.gameId,
      onchainGameId: ctx.gameOnchainId,
      onchainAgentId: ctx.agentOnchainId,
      actionType: action.type,
    });

    try {
      // Validate game state
      await this.validateGameState(ctx);

      // Execute appropriate action
      // if there is no action specified, that means the agent wants to make a tweet and not take any action
      if (!action.type) {
        return {
          success: true,
          feedback: {
            isValid: true,
            error: undefined,
          },
        };
      }
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
        default:
          throw new Error(
            `Invalid action type: ${(action as GameAction).type}`
          );
      }
    } catch (error) {
      console.error(`Action execution failed for agent ${ctx.agentId}`, {
        error,
        actionType: action.type,
        gameId: ctx.gameId,
        agentId: ctx.agentId,
      });

      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: action.type,
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
    console.debug("🔍 Validating game state...", {
      gameId: ctx.gameId,
      onchainGameId: ctx.gameOnchainId,
    });

    try {
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const gameAccount = await this.program.account.game.fetch(gamePda);

      if (!gameAccount.isActive) {
        console.error("❌ Game validation failed - Game is not active", {
          gameId: ctx.gameId,
          onchainGameId: ctx.gameOnchainId,
        });
        throw new Error("Game is not active");
      }

      // Additional validations could be added here
      // - Check if agent is alive
      // - Check if agent has required tokens
      // - Check cooldowns
      // etc.
    } catch (error) {
      console.error("❌ Game state validation failed", {
        error,
        gameId: ctx.gameId,
        onchainGameId: ctx.gameOnchainId,
      });
      throw error;
    }
  }
}
