/**
 * @fileoverview Manages game actions and their execution in the Mearth game.
 * Handles movement, battles, alliances, and other game mechanics.
 */

import { PublicKey } from "@solana/web3.js";
import { BreakAllianceAction, IgnoreAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount } from "@/types/program";
import { PrismaClient } from "@prisma/client";
import { ActionResult } from "@/types";
import { ActionContext } from "@/types";
import {
  MoveAction,
  BattleAction,
  FormAllianceAction,
  GameAction,
} from "@/types";
import { gameConfig } from "@/config/env";

/**
 * Manages the execution and validation of game actions
 */
export class ActionManager {
  private readonly program: MearthProgram;
  private readonly gameOnchainId: number;
  private readonly prisma: PrismaClient;

  /**
   * Creates an instance of ActionManager
   * @param program - The Mearth program instance
   * @param gameOnchainId - The on-chain game ID
   * @param prisma - Prisma client instance for database operations
   */
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
   * Execute a game action with validation and feedback
   * @param ctx - Context containing agent and game information
   * @param action - The game action to execute
   * @returns Result of the action execution
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
        case "FORM_ALLIANCE":
          console.log("🤝 Processing alliance formation action");
          result = await this.handleFormAlliance(ctx, action);
          break;
        case "BREAK_ALLIANCE":
          console.log("🤝 Processing alliance breaking action");
          result = await this.handleBreakAlliance(ctx, action);
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
   * Handle ignore action to temporarily block interactions between agents
   * @param ctx - Action ctx containing agent and game info
   * @param action - The ignore action with target agent details
   * @returns ActionResult indicating success/failure with feedback
   */
  private async handleIgnore(
    ctx: ActionContext,
    action: IgnoreAction
  ): Promise<ActionResult> {
    console.log("🚫 Processing ignore action", {
      agentId: ctx.agentId,
      targetAgentId: action.targetId,
    });

    try {
      // Get the agent doing the ignoring
      const agent = await this.prisma.agent.findUnique({
        where: { id: ctx.agentId },
      });
      const targetAgent = await this.prisma.agent.findUnique({
        where: {
          onchainId_gameId: {
            onchainId: action.targetId,
            gameId: ctx.gameId,
          },
        },
      });

      if (!agent || !targetAgent) {
        throw new Error("Agent not found");
      }

      // Check if ignore relationship already exists
      const existingIgnore = await this.prisma.ignore.findUnique({
        where: {
          agentId_ignoredAgentId: {
            agentId: ctx.agentId,
            ignoredAgentId: targetAgent.id,
          },
        },
      });

      if (existingIgnore) {
        throw new Error("Already ignoring this agent");
      }

      // Create new ignore relationship
      await this.prisma.ignore.create({
        data: {
          agentId: ctx.agentId,
          ignoredAgentId: targetAgent.id,
          gameId: ctx.gameId,
          timestamp: new Date(),
          duration: 14400, // 4 hours in seconds
        },
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error("Failed to process ignore action", error);
      return {
        success: false,
        feedback: {
          isValid: false,
        },
      };
    }
  }

  /**
   * Handle agent movement with validation
   * @param ctx - Action ctx containing agent and game info
   * @param action - Movement action with target position
   * @returns Result of movement execution
   */
  private async handleMove(
    ctx: ActionContext,
    action: MoveAction
  ): Promise<ActionResult> {
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

      // offchain validations
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

      // create a cool down
      await this.prisma.coolDown.create({
        data: {
          type: "Move",
          endsAt: new Date(
            Date.now() + gameConfig.mechanics.cooldowns.movement * 1000
          ),
          cooledAgentId: ctx.agentId,
          gameId: ctx.gameId,
        },
      });

      console.log("✅ Agent movement completed successfully", {
        agentId: ctx.agentId,
        x: action.position.x,
        y: action.position.y,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error("💥 Movement failed", {
        error,
        agentId: ctx.agentId,
        action,
      });
      console.log("Error", error);
      return {
        success: false,
        feedback: {
          isValid: false,
        },
      };
    }
  }

  /**
   * Handle battle initiation with validation
   * @param ctx - Action ctx containing agent and game info
   * @param action - Battle action with target agent
   * @returns Result of battle initiation
   */
  private async handleBattle(
    ctx: ActionContext,
    action: BattleAction
  ): Promise<ActionResult> {
    const currentTime = Date.now();
    const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
    const [defenderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      action.targetId
    );
    const [attackerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      ctx.agentOnchainId
    );
    try {
      console.log("⚔️ Processing battle request", {
        attackerId: ctx.agentId,
        defenderId: action.targetId,
      });
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
          ctx,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else if (attackerAccount.allianceWith || defenderAccount.allianceWith) {
        if (attackerAccount.allianceWith && !defenderAccount.allianceWith) {
          const singleAgentAccount = defenderAccount;
          const agentInAllianceAccount = attackerAccount;
          const allyAccount = await this.program.account.agent.fetch(
            attackerAccount.allianceWith
          );
          tx = await this.handleAgentVsAllianceBattle(
            ctx,
            defenderPda,
            attackerPda,
            singleAgentAccount,
            agentInAllianceAccount,
            allyAccount
          );
        } else if (
          !attackerAccount.allianceWith &&
          defenderAccount.allianceWith
        ) {
          const singleAgentAccount = attackerAccount;
          const agentInAllianceAccount = defenderAccount;
          const allyAccount = await this.program.account.agent.fetch(
            defenderAccount.allianceWith
          );
          tx = await this.handleAgentVsAllianceBattle(
            ctx,
            defenderPda,
            attackerPda,
            singleAgentAccount,
            agentInAllianceAccount,
            allyAccount
          );
        }
        tx = "No matching arm";
      } else {
        console.log("⚔️ Initiating Simple battle");
        tx = await this.handleSimpleBattle(
          ctx,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      }

      console.log("✨ Battle initiated successfully", {
        attackerId: ctx.agentId,
        defenderId: action.targetId,
        transactionHash: tx,
      });

      return {
        success: true,
        // feedback: {},
      };
    } catch (error) {
      console.error("💥 Battle initiation failed", { error, ctx, action });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "BATTLE",
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
   * Handle battle between two alliances, including database updates
   * @param ctx - Action ctx containing game info
   * @param attackerPda - Attacker's public key
   * @param defenderPda - Defender's public key
   * @param attackerAccount - Attacker's account data
   * @param defenderAccount - Defender's account data
   * @returns Transaction hash
   */
  private async handleAllianceVsAllianceBattle(
    ctx: ActionContext,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    const currentTime = Date.now();
    console.log("⚔️ Setting up Alliance vs Alliance battle");

    const attackerAllyPda = attackerAccount.allianceWith;
    const defenderAllyPda = defenderAccount.allianceWith;

    try {
      if (!attackerAllyPda || !defenderAllyPda) {
        throw new Error("Two entities are not in alliances");
      }
      const attackerAllyAccount = await this.program.account.agent.fetch(
        attackerAllyPda
      );
      const defenderAllyAccount = await this.program.account.agent.fetch(
        defenderAllyPda
      );

      if (attackerAccount.lastBattle.gt(currentTime)) {
        throw new Error("Attacker is on cooldown");
      }

      if (defenderAccount.lastBattle.gt(currentTime)) {
        throw new Error("Defender is on cooldown");
      }

      if (attackerAllyAccount.lastBattle.gt(currentTime)) {
        throw new Error("Attacker's ally is on cooldown");
      }

      if (defenderAllyAccount.lastBattle.gt(currentTime)) {
        throw new Error("Defender's ally is on cooldown");
      }
      const [
        attackerAgent,
        defenderAgent,
        attackerAllyAgent,
        defenderAllyAgent,
      ] = await Promise.all([
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: attackerAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: defenderAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: attackerAllyAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: defenderAllyAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
      ]);
      if (
        !attackerAgent ||
        !defenderAgent ||
        !attackerAllyAgent ||
        !defenderAllyAgent
      ) {
        throw new Error(
          "One or more agents involved in the battle are not found"
        );
      }
      // Create battle record in database
      await this.prisma.battle.create({
        data: {
          type: "AllianceVsAlliance",
          status: "Active",
          tokensStaked:
            attackerAccount.tokenBalance
              ?.add(defenderAccount.tokenBalance)
              .add(attackerAllyAccount.tokenBalance)
              .add(defenderAllyAccount.tokenBalance)
              .toNumber() || 0,
          gameId: ctx.gameId,
          attackerId: attackerAgent.id,
          defenderId: defenderAgent.id,
          attackerAllyId: attackerAllyAgent.id,
          defenderAllyId: defenderAllyAgent.id,
        },
      });

      // Execute onchain transaction
      const tx = await this.program.methods
        .startBattleAlliances()
        .accounts({
          leaderA: attackerPda,
          partnerA: attackerAllyPda,
          leaderB: defenderPda,
          partnerB: defenderAllyPda,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("💥 Battle initiation failed", { error });
      throw error;
    }
  }

  /**
   * Handle battle between a single agent and an alliance
   * @param ctx - Action ctx containing game info
   * @param singleAgentPda - Single agent's public key
   * @param agentInAlliancePda - Alliance agent's public key
   * @param singleAgentAccount - Single agent's account data
   * @param agentInAllianceAccount - Alliance agent's account data
   * @param allyAccount - Ally's account data
   * @returns Transaction hash
   */
  private async handleAgentVsAllianceBattle(
    ctx: ActionContext,
    singleAgentPda: PublicKey,
    agentInAlliancePda: PublicKey,
    singleAgentAccount: AgentAccount,
    agentInAllianceAccount: AgentAccount,
    allyAccount: AgentAccount
  ): Promise<string> {
    if (!agentInAllianceAccount) throw Error("Alliance partner is null");

    try {
      // Fetch all agent accounts from database
      const [singleAgent, allyLeader, allyPartner] = await Promise.all([
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: singleAgentAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: agentInAllianceAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: allyAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
      ]);

      if (!singleAgent || !allyLeader || !allyPartner) {
        throw new Error("One or more agents not found");
      }

      // Create battle record in database
      await this.prisma.battle.create({
        data: {
          type: "AgentVsAlliance",
          status: "Active",
          tokensStaked:
            singleAgentAccount.tokenBalance
              ?.add(allyAccount.tokenBalance)
              ?.toNumber() || 0,
          gameId: ctx.gameId,
          attackerId: singleAgent.id,
          defenderId: allyLeader.id,
          defenderAllyId: allyPartner.id,
        },
      });

      // Execute onchain transaction
      return this.program.methods
        .startBattleAgentVsAlliance()
        .accounts({
          attacker: singleAgentPda,
          allianceLeader: agentInAlliancePda,
          alliancePartner: allyAccount.allianceWith!,
        })
        .rpc();
    } catch (error) {
      console.error("💥 Battle initiation failed", { error });
      throw error;
    }
  }

  /**
   * Handle battle between two individual agents
   * @param ctx - Action ctx containing game info
   * @param attackerPda - Attacker's public key
   * @param defenderPda - Defender's public key
   * @param attackerAccount - Attacker's account data
   * @param defenderAccount - Defender's account data
   * @returns Transaction hash
   */
  private async handleSimpleBattle(
    ctx: ActionContext,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    console.log("⚔️ Setting up Simple battle");

    try {
      // Get the database records for both agents
      const [attacker, defender] = await Promise.all([
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: attackerAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: defenderAccount.id,
              gameId: ctx.gameId,
            },
          },
        }),
      ]);

      if (!attacker || !defender) {
        throw new Error("One or more agents not found in database");
      }

      // Create battle record
      await this.prisma.battle.create({
        data: {
          type: "Simple",
          status: "Active",
          tokensStaked: 0, // Set appropriate token amount if needed
          gameId: ctx.gameId,
          attackerId: attacker.id,
          defenderId: defender.id,
        },
      });

      // Execute onchain transaction
      return this.program.methods
        .startBattleSimple()
        .accounts({
          winner: attackerPda,
          loser: defenderPda,
        })
        .rpc();
    } catch (error) {
      console.error("💥 Simple battle initiation failed", { error });
      throw error;
    }
  }

  /**
   * Handle ally formation with validation
   * @param ctx - Action ctx containing agent and game info
   * @param action - Alliance formation action with target agent
   * @returns Result of alliance formation
   */
  private async handleFormAlliance(
    ctx: ActionContext,
    action: FormAllianceAction
  ): Promise<ActionResult> {
    const { gameOnchainId, agentId } = ctx;
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
        ctx.agentOnchainId
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

      // Execute onchain alliance
      console.log("🎯 Executing onchain alliance formation");
      await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      console.log("💾 Updating ally in database");
      const game = await this.prisma.game.findUnique({
        where: { onchainId: ctx.gameOnchainId },
        include: {
          agents: {
            where: {
              onchainId: {
                in: [ctx.agentOnchainId, action.targetId],
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
          combinedTokens: initiatorAccount.tokenBalance.add(
            joinerAccount.tokenBalance
          ),
          gameId: game.id,
          initiatorId: ctx.agentId,
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
            cooledAgentId: ctx.agentId,
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
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "FORM_ALLIANCE",
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
   * Handle breaking of an alliance between agents
   * @param ctx - Action ctx containing agent and game info
   * @param action - Alliance breaking action with target agent
   * @returns Result of alliance breaking
   */
  private async handleBreakAlliance(
    ctx: ActionContext,
    action: BreakAllianceAction
  ): Promise<ActionResult> {
    console.log("🔨 Processing alliance breaking action");
    try {
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [initiatorPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [targetPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      const prismaInitiator = await this.prisma.agent.findUnique({
        where: {
          onchainId_gameId: {
            onchainId: action.targetId,
            gameId: ctx.gameOnchainId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!prismaInitiator) {
        throw new Error("Initiator not found in database");
      }

      // Fetch and verify initial state
      const initiatorBefore = await this.program.account.agent.fetch(
        initiatorPda
      );
      const targetBefore = await this.program.account.agent.fetch(targetPda);

      if (initiatorBefore.allianceWith === targetPda) {
        throw new Error("Initiator is already allied with target");
      }
      if (targetBefore.allianceWith === initiatorPda) {
        throw new Error("Target is already allied with initiator");
      }

      // Execute the breakAlliance instruction
      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      console.log("Break alliance tx signature:", tx);

      // Get the alliance record
      const alliance = await this.prisma.alliance.findFirst({
        where: {
          AND: [
            {
              OR: [
                {
                  initiatorId: ctx.agentId,
                  joinerId: prismaInitiator.id,
                },
                {
                  initiatorId: action.targetId.toString(),
                  joinerId: ctx.agentId,
                },
              ],
            },
            {
              status: "Active",
            },
          ],
        },
      });

      if (!alliance) {
        throw new Error("Active alliance not found");
      }

      // Update alliance status in a single transaction
      await this.prisma.$transaction([
        // Mark alliance as broken
        this.prisma.alliance.update({
          where: { id: alliance.id },
          data: {
            status: "Broken",
            endedAt: new Date(),
          },
        }),
        // Set cooldown for initiator
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance * 1000 // convert to ms
            ),
            cooledAgentId: ctx.agentId,
            gameId: ctx.gameId,
          },
        }),
        // Set cooldown for target
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance * 1000 // convert to ms
            ),
            cooledAgentId: action.targetId.toString(),
            gameId: ctx.gameId,
          },
        }),
      ]);

      console.log("🔨 Alliance broken successfully", {
        allianceId: alliance.id,
        initiatorId: ctx.agentId,
        targetId: action.targetId,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        feedback: {
          isValid: false,
        },
      };
    }
  }
}
