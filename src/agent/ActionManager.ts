import { PublicKey } from "@solana/web3.js";
import { IgnoreAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount, GameAccount } from "@/types/program";
import { PrismaClient } from "@prisma/client";
import { ActionResult } from "@/types";
import { ActionContext } from "@/types";
import { MoveAction, BattleAction, AllianceAction, GameAction } from "@/types";
import { gameConfig } from "@/config/env";

export class ActionManager {
  private readonly program: MearthProgram;
  private readonly gameOnchainId: number;
  private readonly prisma: PrismaClient;

  constructor(
    program: MearthProgram,
    gameOnchainId: number,
    prisma: PrismaClient
  ) {
    this.program = program;
    this.gameOnchainId = gameOnchainId;
    this.prisma = prisma;
    console.log("🎮 Action Manager initialized", { gameOnchainId });
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
      console.log("🔍 Validating game state...");
      const [gamePda] = getGamePDA(this.program.programId, this.gameOnchainId);
      const gameAccount = await this.program.account.game.fetch(gamePda);

      if (!gameAccount.isActive) {
        console.error("❌ Game validation failed - Game is not active");
        throw new Error("Game is not active");
      }

      let result: ActionResult;

      switch (action.type) {
        case "MOVE":
          console.log("🚶 Processing movement action");
          result = await this.handleMove(ctx, action);
          break;
        case "BATTLE":
          console.log("🦋 Processing battle action");
          result = await this.handleBattle(ctx, action);
          break;
        case "ALLIANCE":
          console.log("🤝 Processing ally action");
          result = await this.handleAlliance(ctx, action);
          break;
        case "IGNORE":
          console.log("🚫 Processing ignore action");
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
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("🚶 Processing movement request", {
      agentId: ctx.agentId,
      agentOnchainId: ctx.agentOnchainId,
      x: action.position.x,
      y: action.position.y,
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

      // Validate movement cooldown onchain
      if (agentAccount.nextMoveTime.gt(currentTime)) {
        console.error("⏳ Movement rejected - Agent on cooldown");
        throw new Error("Agent is on movement cooldown onchain");
      }

      // Additional offchain validations
      console.log("🔍 Performing additional movement validations");

      // Execute onchain movement
      console.log("🎯 Executing onchain movement");
      const mapTile = await this.prisma.mapTile.findUnique({
        where: { x_y: { x: action.position.x, y: action.position.y } },
      });
      if (!mapTile) {
        console.error("❌ Movement rejected - Map tile not found");
        throw new Error("Map tile not found");
      }

      // const terrainObject =
      await this.program.methods
        .moveAgent(action.position.x, action.position.y, {
          [mapTile.terrainType]: {},
        })
        .accountsStrict({
          agent: agentPda,
          game: gamePda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      console.log("💾 Updating movement in database");
      await this.prisma.agent.update({
        where: { id: ctx.agentId },
        data: {
          mapTileId: mapTile.id,
        },
      });
      console.log("✅ Updated agent position in database", {
        agentId: ctx.agentId,
        x: action.position.x,
        y: action.position.y,
      });

      console.log("✨ Agent movement completed successfully", {
        agentId: ctx.agentId,
        x: action.position.x,
        y: action.position.y,
      });

      return {
        success: true,
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
    const currentTime = Math.floor(Date.now() / 1000);
    const [gamePda] = getGamePDA(this.program.programId, gameOnchainId);
    const [defenderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      action.targetId
    );
    const defenderAccount = await this.program.account.agent.fetch(defenderPda);

    if (!defenderAccount) {
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

      let tx: string;
      // Handle different battle types based on ally status
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
        if (attackerAccount.allianceWith && !defenderAccount.allianceWith) {
          tx = await this.handleAgentVsAllianceBattle(
            gamePda,
            defenderPda,
            attackerPda,
            attackerAccount.allianceWith
          );
        } else if (
          !attackerAccount.allianceWith &&
          defenderAccount.allianceWith
        ) {
          tx = await this.handleAgentVsAllianceBattle(
            gamePda,
            defenderPda,
            attackerPda,
            defenderAccount.allianceWith
          );
        }
        tx = "No matching arm";
      } else {
        console.log("⚔️ Initiating Simple battle");
        tx = await this.handleSimpleBattle(attackerPda, defenderPda);
      }

      console.log("✨ Battle initiated successfully", {
        attackerId: agentId,
        defenderId: action.targetId,
        transactionHash: tx,
      });

      return {
        success: true,
        // feedback: {},
      };
    } catch (error) {
      console.error("💥 Battle initiation failed", { error, agentId, action });
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

    const attackerAllyPda = attackerAccount.allianceWith;

    const defenderAllyPda = defenderAccount.allianceWith;
    if (!attackerAllyPda || !defenderAllyPda) {
      throw new Error("Invalid game");
    }

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
    singleAgentPda: PublicKey,
    allyLeaderPda: PublicKey,
    allyPartnerPda: PublicKey
  ): Promise<string> {
    if (!allyLeaderPda) throw Error("Alliance partner is null");

    return this.program.methods
      .startBattleAgentVsAlliance()
      .accounts({
        attacker: singleAgentPda,
        allianceLeader: allyLeaderPda,
        alliancePartner: allyPartnerPda,
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
      })
      .rpc();
  }

  /**
   * Handle ally formation with enhanced validation
   */
  private async handleAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<ActionResult> {
    const { gameOnchainId, agentId } = context;
    console.log("🤝 Processing ally request", {
      initiatorId: agentId,
      joinerId: action.targetId,
    });
    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, gameOnchainId);
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
      console.log("🔍 Validating ally participants");
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.program.account.agent.fetch(initiatorPda),
        this.program.account.agent.fetch(joinerPda),
      ]);

      // Validate ally status onchain
      if (initiatorAccount.allianceWith !== null) {
        console.error("🚫 Alliance rejected - Initiator already allied");
        throw new Error("Initiator already has an ally");
      }
      if (joinerAccount.allianceWith !== null) {
        console.error("🚫 Alliance rejected - Joiner already allied");
        throw new Error("Joiner already has an ally");
      }

      // Execute onchain ally
      console.log("🎯 Executing onchain ally formation");
      await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      console.log("💾 Updating ally in database");
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

      console.log("✨ Alliance formed successfully", {
        initiatorId: agentId,
        joinerId: action.targetId,
      });

      return {
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }
}
