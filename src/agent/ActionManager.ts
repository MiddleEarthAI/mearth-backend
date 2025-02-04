import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { logger } from "@/utils/logger";
import {
  AgentAccount,
  GameAccount,
  MOVEMENT_COOLDOWN,
  ALLIANCE_COOLDOWN,
} from "@/types/program";
import { PrismaClient } from "@prisma/client";
import { INTERACTION_DISTANCE } from "@/constants";
import { ValidationFeedback, ActionResult } from "@/types";
import { ActionContext } from "@/types";
import { MoveAction, BattleAction, AllianceAction, GameAction } from "@/types";

const CURRENT_TIMESTAMP = () => new BN(Math.floor(Date.now() / 1000)); // 1 second precision

export class ActionManager {
  private readonly program: MearthProgram;
  private readonly gameOnchainId: BN;
  private readonly prisma: PrismaClient;

  constructor(program: MearthProgram, gameOnchainId: BN, prisma: PrismaClient) {
    this.program = program;
    this.gameOnchainId = gameOnchainId;
    this.prisma = prisma;
    logger.info("🎮 Action Manager initialized", { gameOnchainId });
  }

  /**
   * Fetch and validate game state
   */
  private async validateGameState(): Promise<GameAccount> {
    logger.info("🔍 Validating game state...");
    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(this.gameOnchainId)
    );
    const gameAccount = await this.program.account.game.fetch(gamePda);

    if (!gameAccount.isActive) {
      logger.error("❌ Game validation failed - Game is not active");
      throw new Error("Game is not active");
    }

    logger.info("✅ Game state validated successfully");
    return gameAccount;
  }

  /**
   * Fetch and validate agent state
   */
  private async validateAgentState(
    agentPda: PublicKey,
    context: string
  ): Promise<AgentAccount> {
    logger.info("🔍 Validating agent state");
    logger.info(`🔍 Validating agent state for ${context}...`);
    try {
      // const [gamePda] = getGamePDA(this.program.programId, this.gameOnchainId);
      // const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

      const agentAccount = await this.program.account.agent.fetch(agentPda);

      if (!agentAccount.isAlive) {
        logger.error(
          `❌ Agent validation failed - ${context}: Agent is not alive`
        );
        throw new Error(`${context}: Agent is not alive`);
      }

      if (agentAccount.currentBattleStart !== null) {
        logger.error(
          `❌ Agent validation failed - ${context}: Agent is in battle`
        );
        throw new Error(`${context}: Agent is currently in battle`);
      }

      logger.info(`✅ Agent state validated successfully for ${context}`);
      return agentAccount;
    } catch (error) {
      logger.error(`❌ Failed to validate agent state: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a game action with optimized validation and feedback
   */
  async executeAction(
    ctx: ActionContext,
    action: GameAction
  ): Promise<ActionResult> {
    logger.info("🎯 Executing game action", {
      agentId: ctx.agentId,
      agentOnchainId: ctx.agentOnchainId,
      actionType: action.type,
    });

    try {
      // Validate game state first
      await this.validateGameState();

      let result: ActionResult;

      switch (action.type) {
        case "MOVE":
          logger.info("🚶 Processing movement action");
          result = await this.handleMove(ctx, action);
          break;
        case "BATTLE":
          result = await this.handleBattle(ctx, action);
          break;
        case "ALLY":
          result = await this.handleAlliance(ctx, action);
          break;
        default:
          throw new Error("Invalid action type");
      }

      if (!result.success && result.feedback) {
        logger.info("🔄 Action validation failed, providing feedback", {
          feedback: result.feedback,
          actionType: action.type,
        });
      }

      return result;
    } catch (error) {
      logger.error("💥 Failed to execute action", {
        agentId: ctx.agentId,
        action,
        error,
      });

      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: action.type,
            message: error instanceof Error ? error.message : String(error),
            context: {
              currentState: ctx,
              attemptedAction: action,
            },
          },
        },
      };
    }
  }

  /**
   * Handle agent movement with enhanced validation
   */
  private async handleMove(
    ctx: ActionContext,
    action: MoveAction
  ): Promise<ActionResult> {
    const currentTime = CURRENT_TIMESTAMP();

    logger.info("🚶 Processing movement request", {
      agentId: ctx.agentId,
      agentOnchainId: ctx.agentOnchainId,
      x: action.x,
      y: action.y,
    });

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [agentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );

      // Fetch and validate agent state
      logger.info("🔍 Validating agent state for movement");
      const agentAccount = await this.validateAgentState(agentPda, "Move");

      // Validate movement cooldown onchain
      if (agentAccount.nextMoveTime.gt(currentTime)) {
        logger.error("⏳ Movement rejected - Agent on cooldown");
        throw new Error("Agent is on movement cooldown onchain");
      }

      // Validate coordinates against game map
      logger.info("🗺️ Validating movement coordinates");
      const gameAccount = await this.program.account.game.fetch(gamePda);

      if (
        action.x < 0 ||
        action.y < 0 ||
        action.x >= gameAccount.mapDiameter ||
        action.y >= gameAccount.mapDiameter
      ) {
        logger.error("🚫 Movement rejected - Invalid coordinates");
        throw new Error("Invalid coordinates: Out of map bounds");
      }

      // Additional offchain validations
      logger.info("🔍 Performing additional movement validations");
      const moveValidationResult = await this.validateMove(ctx, action);

      // Execute onchain movement
      logger.info("🎯 Executing onchain movement");
      await this.program.methods
        .moveAgent(new BN(action.x), new BN(action.y))
        .accounts({
          agent: agentPda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update database if prisma is available

      logger.info("💾 Updating movement in database");
      await this.updateMoveInDatabase(ctx, action, ctx.agentId);

      logger.info("✨ Agent movement completed successfully", {
        agentId: ctx.agentId,
        x: action.x,
        y: action.y,
      });

      return {
        success: true,
        feedback: moveValidationResult,
      };
    } catch (error) {
      logger.error("💥 Movement failed", {
        error,
        agentId: ctx.agentId,
        action,
      });
      throw error;
    }
  }

  /**
   * Handle battle initiation with enhanced validation
   */
  private async handleBattle(
    context: ActionContext,
    action: BattleAction
  ): Promise<ActionResult> {
    const { gameOnchainId, agentId, agentOnchainId } = context;
    const currentTime = CURRENT_TIMESTAMP();
    const targetAccount = await this.getAgentAccount(action.targetId);

    if (!targetAccount) {
      logger.error(
        "❌ Battle validation failed - Target agent not found onchain"
      );
      throw new Error("Target agent not found onchain");
    }

    logger.info("⚔️ Processing battle request", {
      attackerId: agentId,
      defenderId: action.targetId,
    });

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, gameOnchainId);

      const [attackerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        agentOnchainId
      );

      const defenderPda = targetAccount.agentPda;

      // Fetch and validate both agents' states
      logger.info("🔍 Validating combatants' states");
      const [attackerAccount, defenderAccount] = await Promise.all([
        this.validateAgentState(attackerPda, "Battle-Attacker"),
        this.validateAgentState(defenderPda, "Battle-Defender"),
      ]);

      // Validate battle cooldowns onchain
      if (attackerAccount.lastBattle.gt(currentTime)) {
        logger.error("⏳ Battle rejected - Attacker on cooldown");
        throw new Error("Attacker is on battle cooldown onchain");
      }
      if (defenderAccount.lastBattle.gt(currentTime)) {
        logger.error("⏳ Battle rejected - Defender on cooldown");
        throw new Error("Defender is on battle cooldown onchain");
      }

      // Additional offchain validations
      logger.info("🔍 Performing additional battle validations");
      const battleValidationResult = await this.validateBattle(context, action);

      let tx: string;

      // Handle different battle types based on alliance status
      logger.info("⚔️ Determining battle type");
      if (attackerAccount.allianceWith && defenderAccount.allianceWith) {
        logger.info("🤝 Initiating Alliance vs Alliance battle");
        tx = await this.handleAllianceVsAllianceBattle(
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else if (attackerAccount.allianceWith || defenderAccount.allianceWith) {
        logger.info("⚔️ Initiating Agent vs Alliance battle");
        tx = await this.handleAgentVsAllianceBattle(
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else {
        logger.info("⚔️ Initiating Simple battle");
        tx = await this.handleSimpleBattle(attackerPda, defenderPda);
      }

      // Update database if prisma is available

      // logger.info("💾 Updating battle in database");
      // await this.updateBattleInDatabase(
      //   context,
      //   action,
      //   attackerAccount,
      //   defenderAccount
      // );

      logger.info("✨ Battle initiated successfully", {
        attackerId: agentId,
        defenderId: action.targetId,
        battleType: this.determineBattleType(attackerAccount, defenderAccount),
        transactionHash: tx,
      });

      return {
        success: true,
        feedback: battleValidationResult,
      };
    } catch (error) {
      logger.error("💥 Battle initiation failed", { error, agentId, action });
      throw error;
    }
  }

  /**
   * Handle alliance formation with enhanced validation
   */
  private async handleAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<ActionResult> {
    const { gameOnchainId, agentId } = context;
    logger.info("🤝 Processing alliance request", {
      initiatorId: agentId,
      joinerId: action.targetId,
    });

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(
        this.program.programId,
        new BN(gameOnchainId)
      );
      const [initiatorPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        context.agentOnchainId
      );
      const [joinerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      // Fetch and validate both agents' states
      logger.info("🔍 Validating alliance participants");
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.validateAgentState(initiatorPda, "Alliance-Initiator"),
        this.validateAgentState(joinerPda, "Alliance-Joiner"),
      ]);

      // Validate alliance status onchain
      if (initiatorAccount.allianceWith !== null) {
        logger.error("🚫 Alliance rejected - Initiator already allied");
        throw new Error("Initiator already has an alliance");
      }
      if (joinerAccount.allianceWith !== null) {
        logger.error("🚫 Alliance rejected - Joiner already allied");
        throw new Error("Joiner already has an alliance");
      }

      // Additional offchain validations
      logger.info("🔍 Performing additional alliance validations");
      const allianceValidationResult = await this.validateAlliance(
        context,
        action
      );

      // Execute onchain alliance
      logger.info("🎯 Executing onchain alliance formation");
      await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      logger.info("💾 Updating alliance in database");
      await this.updateAllianceInDatabase(context, action);

      logger.info("✨ Alliance formed successfully", {
        initiatorId: agentId,
        joinerId: action.targetId,
      });

      return {
        success: true,
        feedback: allianceValidationResult,
      };
    } catch (error) {
      logger.error("💥 Alliance formation failed", { error, agentId, action });
      throw error;
    }
  }

  // Helper methods for battle handling
  private async handleAllianceVsAllianceBattle(
    gamePda: PublicKey,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    logger.info("⚔️ Setting up Alliance vs Alliance battle");

    if (!attackerAccount.allianceWith || !defenderAccount.allianceWith) {
      throw new Error(
        "Alliance with is null for Alliance vs Alliance battle handler"
      );
    }

    const attackerAllyPda = attackerAccount.allianceWith;

    const defenderAllyPda = defenderAccount.allianceWith;

    // const allyAccount = await this.program.account.agent.fetch(defenderAllyPda);
    // const defenderAllyAccount = await this.program.account.agent.fetch(
    //   defenderAllyPda
    // );

    return this.program.methods
      .startBattleAlliances()
      .accounts({
        leaderA: attackerPda,
        partnerA: attackerAllyPda,
        leaderB: defenderPda,
        partnerB: defenderAllyPda,
      })
      .rpc();
  }

  private async handleAgentVsAllianceBattle(
    gamePda: PublicKey,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    logger.info("⚔️ Setting up Agent vs Alliance battle");
    const allianceLeaderPda = attackerAccount.allianceWith
      ? attackerPda
      : defenderPda;
    const alliancePartnerPda = attackerAccount.allianceWith
      ? attackerAccount.allianceWith
      : defenderAccount.allianceWith;
    const singleAgentPda = attackerAccount.allianceWith
      ? defenderPda
      : attackerPda;

    if (!alliancePartnerPda) throw Error("Alliance partner is null");

    return this.program.methods
      .startBattleAgentVsAlliance()
      .accounts({
        attacker: singleAgentPda,
        allianceLeader: allianceLeaderPda,
        alliancePartner: alliancePartnerPda,
        authority: this.program.provider.publicKey,
      })
      .rpc();
  }

  private async handleSimpleBattle(
    attackerPda: PublicKey,
    defenderPda: PublicKey
  ): Promise<string> {
    logger.info("⚔️ Setting up Simple battle");
    return this.program.methods
      .startBattleSimple()
      .accounts({
        winner: attackerPda,
        loser: defenderPda,
        authority: this.program.provider.publicKey,
      })
      .rpc();
  }

  // Helper methods for database updates
  private async updateMoveInDatabase(
    context: ActionContext,
    action: MoveAction,
    agentId: string
  ): Promise<void> {
    logger.info("💾 Updating movement data in database", { agentId });
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        mapTiles: {
          connect: {
            x_y: {
              x: action.x,
              y: action.y,
            },
          },
        },
      },
    });

    await this.prisma.coolDown.create({
      data: {
        type: "Move",
        endsAt: new Date(Date.now() + MOVEMENT_COOLDOWN),
        cooledAgentId: context.agentId,
        gameId: context.gameId,
      },
    });
  }

  /**
   * Validate movement action with detailed feedback
   */
  private async validateMove(
    context: ActionContext,
    action: MoveAction
  ): Promise<ValidationFeedback> {
    logger.info("🔍 Validating movement constraints");

    // Check if tile is occupied
    const occupiedTile = await this.prisma.mapTile.findFirst({
      where: {
        x: action.x,
        y: action.y,
        occupiedBy: {
          not: null,
        },
      },
    });

    if (occupiedTile) {
      return {
        isValid: false,
        error: {
          type: "MOVE",
          message: "Tile is already occupied",
          context: {
            currentState: { occupiedTile },
            attemptedAction: action,
            suggestedFix: "Choose an unoccupied adjacent tile",
          },
        },
      };
    }

    // Check if agent is on cooldown
    const activeCooldown = await this.prisma.coolDown.findFirst({
      where: {
        cooledAgentId: context.agentId,
        type: "Move",
        endsAt: {
          gt: new Date(),
        },
      },
    });

    if (activeCooldown) {
      return {
        isValid: false,
        error: {
          type: "MOVE",
          message: "Agent is on movement cooldown",
          context: {
            currentState: { cooldownEndsAt: activeCooldown.endsAt },
            attemptedAction: action,
            suggestedFix: `Wait until ${activeCooldown.endsAt} before moving again`,
          },
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate battle action
   * Checks for battle range, agent existence, and battle cooldowns
   */
  private async validateBattle(
    context: ActionContext,
    action: BattleAction
  ): Promise<ValidationFeedback> {
    logger.info("🔍 Validating battle constraints");
    if (this.prisma) {
      // Check if agents are in range
      const [attacker, defender] = await Promise.all([
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: context.agentOnchainId,
              gameId: context.gameId,
            },
          },
          include: { mapTiles: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: context.gameId,
            },
          },
          include: { mapTiles: true },
        }),
      ]);

      if (!attacker || !defender) {
        logger.error("❌ Battle validation failed - Agents not found");
        throw new Error("One or both agents not found in database");
      }

      if (!attacker.mapTiles[0] || !defender.mapTiles[0]) {
        logger.error("❌ Battle validation failed - Missing positions");
        throw new Error("One or both agents have no map position");
      }

      const distance = Math.sqrt(
        Math.pow(attacker.mapTiles[0].x - defender.mapTiles[0].x, 2) +
          Math.pow(attacker.mapTiles[0].y - defender.mapTiles[0].y, 2)
      );

      if (distance > INTERACTION_DISTANCE) {
        logger.error("🎯 Battle rejected - Target out of range");
        throw new Error(
          `Target is out of range. Maximum range is ${INTERACTION_DISTANCE}`
        );
      }

      // Check if any involved agent is on cooldown
      const involvedAgents = [context.agentId, action.targetId];

      // if (action.allyId) {
      //   involvedAgents.push(action.allyId);
      // }

      const activeCooldown = await this.prisma.coolDown.findFirst({
        where: {
          cooledAgent: {
            onchainId: { in: [context.agentOnchainId, action.targetId] },
          },
          type: "Battle",
          endsAt: {
            gt: new Date(),
          },
        },
      });

      if (activeCooldown) {
        logger.error("⏳ Battle rejected - Agent on cooldown");
        throw new Error("One of the agents is on battle cooldown");
      }
    }

    return { isValid: true };
  }

  /**
   * Validate alliance action
   * Checks for existing alliances and alliance cooldowns
   */
  private async validateAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<ValidationFeedback> {
    logger.info("🔍 Validating alliance constraints");

    // Check if agents already have an alliance
    const existingAlliance = await this.prisma.alliance.findFirst({
      where: {
        OR: [
          {
            initiatorId: context.agentId,
            joiner: {
              onchainId: action.targetId,
            },
          },
          {
            initiator: {
              onchainId: action.targetId,
            },
            joiner: {
              onchainId: context.agentOnchainId,
            },
          },
        ],
        status: "Active",
      },
    });

    if (existingAlliance) {
      logger.error("🤝 Alliance rejected - Already exists");
      throw new Error("Alliance already exists between these agents");
    }

    // Check if either agent is on cooldown
    const activeCooldown = await this.prisma.coolDown.findFirst({
      where: {
        cooledAgent: {
          onchainId: { in: [context.agentOnchainId, action.targetId] },
        },
        type: "Alliance",
        endsAt: {
          gt: new Date(),
        },
      },
    });

    if (activeCooldown) {
      logger.error("⏳ Alliance rejected - Agent on cooldown");
      throw new Error("One of the agents is on alliance cooldown");
    }

    return { isValid: true };
  }

  private async updateBattleInDatabase(
    context: ActionContext,
    action: BattleAction,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<void> {
    logger.info("💾 Updating battle data in database");
    const game = await this.prisma.game.findUnique({
      where: { onchainId: context.gameOnchainId },
    });

    if (!game) {
      logger.error("❌ Game not found in database");
      throw new Error("Game not found in database");
    }

    const battleType = this.determineBattleType(
      attackerAccount,
      defenderAccount
    );

    // await this.prisma.battle.create({
    //   data: {
    //     attackerId: context.agentId,
    //     defenderId: action.targetId,
    //     attackerAllyId: attackerAccount.allianceWith,
    //     defenderAllyId: defenderAccount.allianceWith,
    //     tokensStaked: action.tokensToStake,
    //     type: battleType,
    //     gameId: game.id,
    //     status: "Active",
    //     startTime: new Date(),
    //   },
    // });

    // const involvedAgents = [
    //   context.agentId,
    //   action.targetId,
    //   attackerAccount.allianceWith,
    //   defenderAccount.allianceWith,
    // ].filter(Boolean) as string[];

    // await Promise.all(
    //   involvedAgents.map((id) =>
    //     this.prisma.coolDown.create({
    //       data: {
    //         type: "Battle",
    //         endsAt: new Date(Date.now() + BATTLE_COOLDOWN),
    //         cooledAgentId: id,
    //         gameId: game.id,
    //       },
    //     })
    //   )
    // );
  }

  private async updateAllianceInDatabase(
    context: ActionContext,
    action: AllianceAction
  ): Promise<void> {
    logger.info("💾 Updating alliance data in database");
    const game = await this.prisma.game.findUnique({
      where: { onchainId: context.gameOnchainId },
      include: {
        agents: {
          where: {
            onchainId: {
              in: [context.agentOnchainId, action.targetId],
            },
          },
        },
      },
    });

    if (!game) {
      logger.error("❌ Game not found in database");
      throw new Error("Game not found in database");
    }
    const joiner = await this.prisma.agent.findUnique({
      where: {
        onchainId_gameId: {
          onchainId: action.targetId,
          gameId: game.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!joiner) {
      logger.error("❌ Joiner not found in database");
      throw new Error("Joiner not found in database");
    }

    await this.prisma.alliance.create({
      data: {
        // combinedTokens: game,
        gameId: game.id,
        initiatorId: context.agentId,
        joinerId: joiner.id,
        status: "Active",
        timestamp: new Date(),
      },
    });

    await Promise.all([
      this.prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + ALLIANCE_COOLDOWN),
          cooledAgentId: context.agentId,
          gameId: game.id,
        },
      }),
      this.prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + ALLIANCE_COOLDOWN),
          cooledAgentId: joiner.id,
          gameId: game.id,
        },
      }),
    ]);
  }

  // Utility methods
  private determineBattleType(
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): "AllianceVsAlliance" | "AgentVsAlliance" | "Simple" {
    return attackerAccount.allianceWith && defenderAccount.allianceWith
      ? "AllianceVsAlliance"
      : attackerAccount.allianceWith || defenderAccount.allianceWith
      ? "AgentVsAlliance"
      : "Simple";
  }

  /**
   * Get current agent state
   */
  async getAgentAccount(agentId: number): Promise<{
    account: AgentAccount;
    agentPda: PublicKey;
  } | null> {
    logger.info("🔍 Fetching agent account", { agentId });
    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(this.gameOnchainId)
    );
    const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

    try {
      const account = await this.program.account.agent.fetch(agentPda);
      logger.info("✅ Agent account fetched successfully");
      return { account, agentPda };
    } catch (error) {
      logger.error("❌ Failed to fetch agent account", { error, agentId });
      return null;
    }
  }

  /**
   * Get current game state
   */
  async getGameState(
    gameOnchainId: number = this.gameOnchainId
  ): Promise<GameAccount> {
    logger.info("🔍 Fetching game state");
    const [gamePda] = getGamePDA(this.program.programId, new BN(gameOnchainId));

    try {
      const state = await this.program.account.game.fetch(gamePda);
      logger.info("✅ Game state fetched successfully");
      return state;
    } catch (error) {
      logger.error("❌ Failed to fetch game state", { error });
      throw error;
    }
  }
}
