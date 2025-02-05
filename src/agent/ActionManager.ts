import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { IgnoreAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount, GameAccount } from "@/types/program";
import { PrismaClient, TerrainType } from "@prisma/client";
import { ValidationFeedback, ActionResult } from "@/types";
import { ActionContext } from "@/types";
import { MoveAction, BattleAction, AllianceAction, GameAction } from "@/types";
import { gameConfig } from "@/config/env";

const CURRENT_TIMESTAMP = () => new BN(Math.floor(Date.now() / 1000)); // 1 second precision

export class ActionManager {
  private readonly program: MearthProgram;
  private readonly gameOnchainId: BN;
  private readonly prisma: PrismaClient;

  constructor(program: MearthProgram, gameOnchainId: BN, prisma: PrismaClient) {
    this.program = program;
    this.gameOnchainId = gameOnchainId;
    this.prisma = prisma;
    console.log("🎮 Action Manager initialized", { gameOnchainId });
  }

  /**
   * Fetch and validate game state
   */
  private async validateGameState(): Promise<GameAccount> {
    console.log("🔍 Validating game state...");
    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(this.gameOnchainId)
    );
    const gameAccount = await this.program.account.game.fetch(gamePda);

    if (!gameAccount.isActive) {
      console.error("❌ Game validation failed - Game is not active");
      throw new Error("Game is not active");
    }

    console.log("✅ Game state validated successfully");
    return gameAccount;
  }

  /**
   * Execute a game action with optimized validation and feedback
   */
  async executeAction(
    ctx: ActionContext,
    action: GameAction
  ): Promise<ActionResult> {
    console.log("🎯 Executing game action", {
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
          console.log("🚶 Processing movement action");
          result = await this.handleMove(ctx, action);
          break;
        case "BATTLE":
          result = await this.handleBattle(ctx, action);
          break;
        case "ALLY":
          result = await this.handleAlliance(ctx, action);
          break;
        case "IGNORE":
          result = await this.handleIgnore(ctx, action);
          break;
        default:
          throw new Error("Invalid action type");
      }

      if (!result.success && result.feedback) {
        console.log("🔄 Action validation failed, providing feedback", {
          feedback: result.feedback,
          actionType: action.type,
        });
      }

      return result;
    } catch (error) {
      console.error("💥 Failed to execute action", {
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
   * Handle ignore action
   */
  private async handleIgnore(
    ctx: ActionContext,
    action: IgnoreAction
  ): Promise<ActionResult> {
    console.log("🚫 Ignoring action", {
      agentId: ctx.agentId,
      actionType: action.type,
    });

    return {
      success: true,
      feedback: { isValid: true },
    };
  }

  /**
   * Handle agent movement with enhanced validation
   */
  private async handleMove(
    ctx: ActionContext,
    action: MoveAction
  ): Promise<ActionResult> {
    const currentTime = CURRENT_TIMESTAMP();

    console.log("🚶 Processing movement request", {
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
      console.log("Getting agent account......");
      const agentAccount = await this.program.account.agent.fetch(agentPda);
      console.log("🔍 Agent account", JSON.stringify(agentAccount, null, 2));

      // Validate movement cooldown onchain
      if (agentAccount.nextMoveTime.gt(currentTime)) {
        console.error("⏳ Movement rejected - Agent on cooldown");
        throw new Error("Agent is on movement cooldown onchain");
      }

      // Validate coordinates against game map
      console.log("🗺️ Validating movement coordinates");
      const gameAccount = await this.program.account.game.fetch(gamePda);
      console.log("🗺️ Game account", JSON.stringify(gameAccount, null, 2));

      // Additional offchain validations
      console.log("🔍 Performing additional movement validations");
      const moveValidationResult = await this.validateMove(ctx, action);

      // Execute onchain movement
      console.log("🎯 Executing onchain movement");
      await this.program.methods
        .moveAgent(action.x, action.y, { river: {} })
        .accountsStrict({
          agent: agentPda,
          game: gamePda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update database if prisma is available

      console.log("💾 Updating movement in database");
      await this.updateMoveInDatabase(ctx, action);

      console.log("✨ Agent movement completed successfully", {
        agentId: ctx.agentId,
        x: action.x,
        y: action.y,
      });

      return {
        success: true,
        feedback: moveValidationResult,
      };
    } catch (error) {
      console.error("💥 Movement failed", {
        error,
        agentId: ctx.agentId,
        action,
      });
      console.log("Error", error);
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
      console.error(
        "❌ Battle validation failed - Target agent not found onchain"
      );
      throw new Error("Target agent not found onchain");
    }

    console.log("⚔️ Processing battle request", {
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
      console.log("🔍 Validating combatants' states");
      const [attackerAccount, defenderAccount] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      // Validate battle cooldowns onchain
      if (attackerAccount.lastBattle.gt(currentTime)) {
        console.error("⏳ Battle rejected - Attacker on cooldown");
        throw new Error("Attacker is on battle cooldown onchain");
      }
      if (defenderAccount.lastBattle.gt(currentTime)) {
        console.error("⏳ Battle rejected - Defender on cooldown");
        throw new Error("Defender is on battle cooldown onchain");
      }

      // Additional offchain validations
      console.log("🔍 Performing additional battle validations");
      const battleValidationResult = await this.validateBattle(context, action);

      let tx: string;

      // Handle different battle types based on alliance status
      console.log("⚔️ Determining battle type");
      if (attackerAccount.allianceWith && defenderAccount.allianceWith) {
        console.log("🤝 Initiating Alliance vs Alliance battle");
        tx = await this.handleAllianceVsAllianceBattle(
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else if (attackerAccount.allianceWith || defenderAccount.allianceWith) {
        console.log("⚔️ Initiating Agent vs Alliance battle");
        tx = await this.handleAgentVsAllianceBattle(
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else {
        console.log("⚔️ Initiating Simple battle");
        tx = await this.handleSimpleBattle(attackerPda, defenderPda);
      }

      // Update database if prisma is available

      // console.log("💾 Updating battle in database");
      // await this.updateBattleInDatabase(
      //   context,
      //   action,
      //   attackerAccount,
      //   defenderAccount
      // );

      console.log("✨ Battle initiated successfully", {
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
      console.error("💥 Battle initiation failed", { error, agentId, action });
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
    console.log("🤝 Processing alliance request", {
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
      console.log("🔍 Validating alliance participants");
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.program.account.agent.fetch(initiatorPda),
        this.program.account.agent.fetch(joinerPda),
      ]);

      // Validate alliance status onchain
      if (initiatorAccount.allianceWith !== null) {
        console.error("🚫 Alliance rejected - Initiator already allied");
        throw new Error("Initiator already has an alliance");
      }
      if (joinerAccount.allianceWith !== null) {
        console.error("🚫 Alliance rejected - Joiner already allied");
        throw new Error("Joiner already has an alliance");
      }

      // Additional offchain validations
      console.log("🔍 Performing additional alliance validations");
      const allianceValidationResult = await this.validateAlliance(
        context,
        action
      );

      // Execute onchain alliance
      console.log("🎯 Executing onchain alliance formation");
      await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      console.log("💾 Updating alliance in database");
      await this.updateAllianceInDatabase(context, action);

      console.log("✨ Alliance formed successfully", {
        initiatorId: agentId,
        joinerId: action.targetId,
      });

      return {
        success: true,
        feedback: allianceValidationResult,
      };
    } catch (error) {
      console.error("💥 Alliance formation failed", { error, agentId, action });
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
    console.log("⚔️ Setting up Alliance vs Alliance battle");

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
    console.log("⚔️ Setting up Agent vs Alliance battle");
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
    console.log("⚔️ Setting up Simple battle");
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
    action: MoveAction
  ): Promise<void> {
    try {
      await this.prisma.mapTile.update({
        where: { x_y: { x: action.x, y: action.y } },
        data: {
          agentId: context.agentId,
        },
      });
      console.log("✅ Updated agent position in database", {
        agentId: context.agentId,
        x: action.x,
        y: action.y,
      });
    } catch (error) {
      console.error("❌ Failed to update agent position in database:", error);
      throw error;
    }
  }

  /**
   * Validate movement action with detailed feedback
   */
  private async validateMove(
    context: ActionContext,
    action: MoveAction
  ): Promise<ValidationFeedback> {
    try {
      // Check if position is already occupied
      const existingTile = await this.prisma.mapTile.findFirst({
        where: {
          x: action.x,
          y: action.y,
          agent: {
            isNot: null,
          },
        },
      });

      if (existingTile) {
        return {
          isValid: false,
          error: {
            type: "MOVE",
            message: "Position is already occupied by another agent",
            context: {
              currentState: { existingTile },
              attemptedAction: action,
              suggestedFix: "Choose an unoccupied position",
            },
          },
        };
      }

      // Get agent's current position
      const agent = await this.prisma.agent.findUnique({
        where: { id: context.agentId },
        include: {
          mapTile: true,
        },
      });

      if (!agent?.mapTile) {
        return {
          isValid: false,
          error: {
            type: "MOVE",
            message: "Agent has no current position",
            context: {
              currentState: { agent },
              attemptedAction: action,
              suggestedFix: "Agent must have a valid position before moving",
            },
          },
        };
      }

      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(action.x - agent.mapTile.x, 2) +
          Math.pow(action.y - agent.mapTile.y, 2)
      );

      // Check if move is within allowed distance
      if (distance > gameConfig.mechanics.movement.speed) {
        return {
          isValid: false,
          error: {
            type: "MOVE",
            message: "Move distance exceeds allowed limit",
            context: {
              currentState: {
                distance,
                maxAllowed: gameConfig.mechanics.movement.speed,
              },
              attemptedAction: action,
              suggestedFix: "Choose a position within movement range",
            },
          },
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("❌ Move validation failed:", error);
      throw error;
    }
  }

  /**
   * Validate battle action
   * Checks for battle range, agent existence, and battle cooldowns
   */
  private async validateBattle(
    context: ActionContext,
    action: BattleAction
  ): Promise<ValidationFeedback> {
    try {
      const [attacker, defender] = await Promise.all([
        this.prisma.agent.findUnique({
          where: {
            id: context.agentId,
          },
          include: {
            mapTile: true,
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: context.gameId,
            },
          },
          include: {
            mapTile: true,
          },
        }),
      ]);

      if (!attacker || !defender) {
        console.error("❌ Battle validation failed - Agent not found");
        throw new Error("One or both agents not found");
      }

      if (!attacker.mapTile || !defender.mapTile) {
        console.error("❌ Battle validation failed - Missing positions");
        throw new Error("One or both agents have no map position");
      }

      const distance = Math.sqrt(
        Math.pow(attacker.mapTile.x - defender.mapTile.x, 2) +
          Math.pow(attacker.mapTile.y - defender.mapTile.y, 2)
      );

      if (distance > gameConfig.mechanics.movement.interactionDistance) {
        return {
          isValid: false,
          error: {
            type: "BATTLE",
            message: "Target is out of battle range",
            context: {
              currentState: {
                distance,
                maxRange: gameConfig.mechanics.movement.interactionDistance,
              },
              attemptedAction: action,
              suggestedFix: "Move closer to target before initiating battle",
            },
          },
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("❌ Battle validation failed:", error);
      throw error;
    }
  }

  /**
   * Validate alliance action
   * Checks for existing alliances and alliance cooldowns
   */
  private async validateAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<ValidationFeedback> {
    console.log("🔍 Validating alliance constraints");

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
      console.error("🤝 Alliance rejected - Already exists");
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
      console.error("⏳ Alliance rejected - Agent on cooldown");
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
    try {
      const attacker = await this.prisma.agent.findUnique({
        where: { id: context.agentId },
        include: {
          mapTile: true,
        },
      });

      const defender = await this.prisma.agent.findUnique({
        where: {
          onchainId_gameId: {
            onchainId: action.targetId,
            gameId: context.gameId,
          },
        },
        include: {
          mapTile: true,
        },
      });

      if (!attacker || !defender) {
        throw new Error("Failed to find battle participants");
      }

      // Create battle record
      await this.prisma.battle.create({
        data: {
          type: "Simple",
          status: "Active",
          tokensStaked: 0,
          startTime: new Date(),
          game: {
            connect: { id: context.gameId },
          },
          attacker: {
            connect: { id: attacker.id },
          },
          defender: {
            connect: { id: defender.id },
          },
        },
      });

      console.log("✅ Created battle record in database", {
        attackerId: attacker.id,
        defenderId: defender.id,
      });
    } catch (error) {
      console.error("❌ Failed to update battle in database:", error);
      throw error;
    }
  }

  private async updateAllianceInDatabase(
    context: ActionContext,
    action: AllianceAction
  ): Promise<void> {
    console.log("💾 Updating alliance data in database");
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
      console.error("❌ Game not found in database");
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
      console.error("❌ Joiner not found in database");
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
          endsAt: new Date(
            Date.now() + gameConfig.mechanics.cooldowns.newAlliance
          ),
          cooledAgentId: context.agentId,
          gameId: game.id,
        },
      }),
      this.prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(
            Date.now() + gameConfig.mechanics.cooldowns.newAlliance
          ),
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
    console.log("🔍 Fetching agent account", { agentId });
    const [gamePda] = getGamePDA(
      this.program.programId,
      new BN(this.gameOnchainId)
    );
    const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

    try {
      const account = await this.program.account.agent.fetch(agentPda);
      console.log("✅ Agent account fetched successfully");
      return { account, agentPda };
    } catch (error) {
      console.error("❌ Failed to fetch agent account", { error, agentId });
      return null;
    }
  }

  /**
   * Get current game state
   */
  async getGameState(
    gameOnchainId: number = this.gameOnchainId
  ): Promise<GameAccount> {
    console.log("🔍 Fetching game state");
    const [gamePda] = getGamePDA(this.program.programId, new BN(gameOnchainId));

    try {
      const state = await this.program.account.game.fetch(gamePda);
      console.log("✅ Game state fetched successfully");
      return state;
    } catch (error) {
      console.error("❌ Failed to fetch game state", { error });
      throw error;
    }
  }
}
