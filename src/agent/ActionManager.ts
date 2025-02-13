/**
 * @fileoverview Manages game actions and their execution in the Mearth game.
 * Handles movement, battles, alliances, and other game mechanics.
 */

import { PublicKey } from "@solana/web3.js";
import { BreakAllianceAction, IgnoreAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount } from "@/types/program";
import { BattleType, PrismaClient } from "@prisma/client";
import { ActionResult } from "@/types";
import { ActionContext } from "@/types";
import {
  MoveAction,
  BattleAction,
  FormAllianceAction,
  GameAction,
} from "@/types";
import { gameConfig } from "@/config/env";
import { stringToUuid } from "@/utils/uuid";
import { BN } from "@coral-xyz/anchor";

/**
 * Represents one side in a battle, containing one or more agents
 */
interface BattleSide {
  agents: AgentAccount[];
  totalTokens: number;
  profiles?: { xHandle: string }[];
}

interface ValidationFeedback {
  isValid: boolean;
  error?: {
    type: string;
    message: string;
    context?: any;
  };
  data?: {
    transactionHash?: string;
    message?: string;
  };
}

/**
 * Manages the execution and validation of game actions
 */
export class ActionManager {
  private readonly program: MearthProgram;
  private readonly prisma: PrismaClient;

  /**
   * Creates an instance of ActionManager
   * @param program - The Mearth program instance
   * @param prisma - Prisma client instance for database operations
   */
  constructor(program: MearthProgram, prisma: PrismaClient) {
    this.program = program;
    this.prisma = prisma;
    console.log("🎮 Action Manager initialized");
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
    console.info(
      `Agent ${ctx.agentId} executing ${action.type} | Game: ${
        ctx.gameId
      } | OnchainGame: ${ctx.gameOnchainId} | OnchainAgent: ${
        ctx.agentOnchainId
      } | Action Details: ${Object.entries(action)
        .filter(([k]) => k !== "type")
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")}`
    );

    try {
      console.log("🔍 Validating game state...");
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const gameAccount = await this.program.account.game.fetch(gamePda);

      if (!gameAccount.isActive) {
        console.error("❌ Game validation failed - Game is not active");
        throw new Error("Game is not active");
      }

      let result: ActionResult;

      switch (action.type) {
        case "MOVE":
          console.info(
            `Agent ${ctx.agentId} moving to position (${action.position.x}, ${action.position.y})`
          );
          result = await this.handleMove(ctx, action);
          break;
        case "BATTLE":
          console.info(
            `Agent ${ctx.agentId} initiating battle with ${action.targetId}`
          );
          result = await this.handleBattle(ctx, action);
          break;
        case "FORM_ALLIANCE":
          console.info(
            `Agent ${ctx.agentId} forming alliance with ${action.targetId}`
          );
          result = await this.handleFormAlliance(ctx, action);
          break;
        case "BREAK_ALLIANCE":
          console.info(
            `Agent ${ctx.agentId} breaking alliance with ${action.targetId}`
          );
          result = await this.handleBreakAlliance(ctx, action);
          break;
        case "IGNORE":
          console.info(`Agent ${ctx.agentId} ignoring ${action.targetId}`);
          result = await this.handleIgnore(ctx, action);
          break;
        default:
          throw new Error("Invalid action type");
      }

      return result;
    } catch (error) {
      console.error(`Action execution failed for agent ${ctx.agentId}`);

      return {
        success: false,
        feedback: {
          isValid: false,
        },
      };
    }
  }

  /**
   * Handle ignore action to temporarily agent
   * @param ctx - Action ctx containing agent and game info
   * @param action - The ignore action with target agent details
   * @returns ActionResult indicating success/failure with feedback
   */
  private async handleIgnore(
    ctx: ActionContext,
    action: IgnoreAction
  ): Promise<ActionResult> {
    console.info(`Agent ${ctx.agentId} ignoring ${action.targetId}`);

    try {
      // Get the agent doing the ignoring
      const agent = await this.prisma.agent.findUnique({
        where: { id: ctx.agentId },
        include: { profile: true },
      });

      const deterministicAgentId = stringToUuid(
        action.targetId + ctx.gameOnchainId.toNumber()
      );
      const targetAgent = await this.prisma.agent.findUnique({
        where: {
          id: deterministicAgentId,
        },
        include: { profile: true },
      });

      if (!agent || !targetAgent) {
        throw new Error("Agent not found");
      }

      // Create new ignore relationship
      await this.prisma.ignore.create({
        data: {
          agentId: ctx.agentId,
          ignoredAgentId: targetAgent.id,
          timestamp: new Date(),

          gameId: ctx.gameId,
          duration: gameConfig.mechanics.cooldowns.ignore,
        },
      });

      // Create ignore event with xHandles
      await this.prisma.gameEvent.create({
        data: {
          eventType: "IGNORE",
          initiatorId: ctx.agentId,
          targetId: targetAgent.id,
          message: `🚫 @${agent.profile.xHandle} turns their back on @${targetAgent.profile.xHandle}!`,
          metadata: {
            duration: gameConfig.mechanics.cooldowns.ignore,
            timestamp: new Date().toISOString(),
            initiatorHandle: agent.profile.xHandle,
            targetHandle: targetAgent.profile.xHandle,
          },
        },
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error(
        `Failed to process ignore action for agent ${ctx.agentId}`,
        {
          error,
        }
      );
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
    console.info(
      `Agent ${ctx.agentId} moving to (${action.position.x}, ${action.position.y})`
    );

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [agentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );

      // Get agent with profile
      const agent = await this.prisma.agent.findUnique({
        where: { id: ctx.agentId },
        include: { profile: true },
      });

      if (!agent) {
        throw new Error("Agent not found");
      }

      const mapTile = await this.prisma.mapTile.findUnique({
        where: { x_y: { x: action.position.x, y: action.position.y } },
      });

      if (!mapTile) {
        console.error("❌ Movement rejected - Invalid map tile");
        throw new Error("Invalid map tile");
      }

      console.info("🎯 Moving agent onchain");
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

      console.info("💾 Updating movement in database");
      await this.prisma.agent.update({
        where: { id: ctx.agentId },
        data: {
          mapTileId: mapTile.id,
        },
      });
      console.info("✅ Updated agent position in database", {
        agentId: ctx.agentId,
        x: action.position.x,
        y: action.position.y,
      });

      const cooldownDuration =
        mapTile.terrainType === "mountain"
          ? gameConfig.mechanics.cooldowns.movement * 2
          : gameConfig.mechanics.cooldowns.movement;

      // create a cool down
      await this.prisma.coolDown.create({
        data: {
          type: "Move",
          endsAt: new Date(Date.now() + cooldownDuration * 1000),
          cooledAgentId: ctx.agentId,
          gameId: ctx.gameId,
        },
      });

      // Create movement event with xHandle
      await this.prisma.gameEvent.create({
        data: {
          eventType: "MOVE",
          initiatorId: ctx.agentId.toString(),
          message: `🚶 @${agent.profile.xHandle} ventures ${
            mapTile.terrainType === "mountain"
              ? "into treacherous mountains"
              : mapTile.terrainType === "river"
              ? "across rushing waters"
              : "across the plains"
          } at (${action.position.x}, ${action.position.y})`,
          metadata: {
            terrain: mapTile.terrainType,
            position: { x: action.position.x, y: action.position.y },
            agentHandle: agent.profile.xHandle,
          },
        },
      });

      console.info(
        `Agent ${ctx.agentId} successfully moved to (${action.position.x}, ${action.position.y})`
      );

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error(`Movement failed for agent ${ctx.agentId}`, {
        error,
      });
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
    try {
      console.info(
        `Agent ${ctx.agentId} initiating battle with ${action.targetId}`
      );

      // Get PDAs and accounts
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [attackerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [defenderPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      // First fetch the main accounts
      const [attackerAccountData, defenderAccountData] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      // Then fetch everything else
      const [attacker, defender, attackerAllyAccount, defenderAllyAccount] =
        await Promise.all([
          this.prisma.agent.findUnique({
            where: { id: ctx.agentId },
            include: { profile: true },
          }),
          this.prisma.agent.findUnique({
            where: {
              onchainId_gameId: {
                onchainId: action.targetId,
                gameId: ctx.gameId,
              },
            },
            include: { profile: true },
          }),
          attackerAccountData?.allianceWith
            ? this.program.account.agent.fetch(attackerAccountData.allianceWith)
            : null,
          defenderAccountData?.allianceWith
            ? this.program.account.agent.fetch(defenderAccountData.allianceWith)
            : null,
        ]);

      if (!attacker || !defender) {
        throw new Error("One or more agents not found in database");
      }

      // Calculate total tokens at stake including allies
      const totalTokensAtStake = [
        attackerAccountData.tokenBalance,
        defenderAccountData.tokenBalance,
        attackerAllyAccount?.tokenBalance || new BN(0),
        defenderAllyAccount?.tokenBalance || new BN(0),
      ].reduce((sum, val) => sum.add(val), new BN(0));

      // Determine battle type and execute appropriate instruction
      let tx: string;
      if (attackerAllyAccount && defenderAllyAccount) {
        // Alliance vs Alliance
        tx = await this.program.methods
          .startBattleAlliances()
          .accounts({
            leaderA: attackerPda,
            partnerA: attackerAccountData?.allianceWith ?? "",
            leaderB: defenderPda,
            partnerB: defenderAccountData?.allianceWith ?? "",
          })
          .rpc();
      } else if (attackerAllyAccount || defenderAllyAccount) {
        // Agent vs Alliance
        const [singlePda, allianceLeaderPda, alliancePartnerPda] =
          attackerAllyAccount
            ? [defenderPda, attackerPda, attackerAccountData.allianceWith]
            : [attackerPda, defenderPda, defenderAccountData.allianceWith];

        tx = await this.program.methods
          .startBattleAgentVsAlliance()
          .accounts({
            attacker: singlePda,
            allianceLeader: allianceLeaderPda,
            alliancePartner: alliancePartnerPda ?? "",
          })
          .rpc();
      } else {
        // Simple battle
        tx = await this.program.methods
          .startBattleSimple()
          .accounts({
            winner: attackerPda,
            loser: defenderPda,
          })
          .rpc();
      }

      // Create battle record and event in a single transaction
      await this.prisma.$transaction([
        this.prisma.battle.create({
          data: {
            type:
              attackerAllyAccount && defenderAllyAccount
                ? "AllianceVsAlliance"
                : attackerAllyAccount || defenderAllyAccount
                ? "AgentVsAlliance"
                : "Simple",
            status: "Active",
            tokensStaked: totalTokensAtStake.toNumber(),
            gameId: ctx.gameId,
            attackerId: attacker.id,
            defenderId: defender.id,
            attackerAllyId: attackerAllyAccount ? attacker.id : null,
            defenderAllyId: defenderAllyAccount ? defender.id : null,
            startTime: new Date(),
          },
        }),
        this.prisma.gameEvent.create({
          data: {
            eventType: "BATTLE",
            initiatorId: ctx.agentId.toString(),
            targetId: action.targetId.toString(),
            message: this.createBattleMessage(
              attacker.profile.xHandle,
              defender.profile.xHandle,
              totalTokensAtStake.toNumber(),
              attackerAllyAccount,
              defenderAllyAccount
            ),
            metadata: {
              battleType:
                attackerAllyAccount && defenderAllyAccount
                  ? "AllianceVsAlliance"
                  : attackerAllyAccount || defenderAllyAccount
                  ? "AgentVsAlliance"
                  : "Simple",
              tokensAtStake: totalTokensAtStake.toNumber(),
              timestamp: new Date().toISOString(),
              attackerHandle: attacker.profile.xHandle,
              defenderHandle: defender.profile.xHandle,
            },
          },
        }),
      ]);

      return {
        success: true,
        feedback: {
          isValid: true,
        },
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
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  /**
   * Create dramatic battle message based on participants
   */
  private createBattleMessage(
    attackerHandle: string,
    defenderHandle: string,
    tokensAtStake: number,
    attackerAlly?: AgentAccount | null,
    defenderAlly?: AgentAccount | null
  ): string {
    if (attackerAlly && defenderAlly) {
      return `⚔️ Epic Alliance Battle begins! The forces clash with ${tokensAtStake} tokens at stake!`;
    } else if (attackerAlly || defenderAlly) {
      const singleHandle = attackerAlly ? defenderHandle : attackerHandle;
      return `⚔️ David vs Goliath! @${singleHandle} challenges the alliance with ${tokensAtStake} tokens at stake!`;
    }
    return `⚔️ Duel of Fates! @${attackerHandle} challenges @${defenderHandle} to mortal combat! ${tokensAtStake} tokens at stake!`;
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
    console.info("🤝 Processing ally request", {
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
      console.info("🔍 Validating ally participants");
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.program.account.agent.fetch(initiatorPda),
        this.program.account.agent.fetch(joinerPda),
      ]);

      // // Validate ally status onchain
      // if (initiatorAccount.allianceWith !== null) {
      //   console.error("🚫 Alliance rejected - Initiator already allied");
      //   throw new Error("Initiator already has an ally");
      // }
      // if (joinerAccount.allianceWith !== null) {
      //   console.error("🚫 Alliance rejected - Joiner already allied");
      //   throw new Error("Joiner already has an ally");
      // }

      // Execute onchain alliance
      console.info("🎯 Executing onchain alliance formation");
      await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      console.info("💾 Updating ally in database");
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

      // Get both agents with their profiles for the event
      const [initiatorDb, joinerDb] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: ctx.gameId,
            },
          },
          include: { profile: true },
        }),
      ]);

      if (!initiatorDb || !joinerDb) {
        throw new Error("One or more agents not found in database");
      }

      // Create alliance formation event with xHandles
      await this.prisma.gameEvent.create({
        data: {
          eventType: "ALLIANCE_FORM",
          initiatorId: ctx.agentId.toString(),
          targetId: action.targetId.toString(),
          message: `🤝 A powerful alliance forms between @${initiatorDb.profile.xHandle} and @${joinerDb.profile.xHandle}!`,
          metadata: {
            allianceType: "formation",
            timestamp: new Date().toISOString(),
            initiatorHandle: initiatorDb.profile.xHandle,
            joinerHandle: joinerDb.profile.xHandle,
          },
        },
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
    console.info("🔨 Processing alliance breaking action");
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

      // // Fetch and verify initial state
      // const initiatorBefore = await this.program.account.agent.fetch(
      //   initiatorPda
      // );
      // const targetBefore = await this.program.account.agent.fetch(targetPda);

      // if (initiatorBefore.allianceWith === targetPda) {
      //   throw new Error("Initiator is already allied with target");
      // }
      // if (targetBefore.allianceWith === initiatorPda) {
      //   throw new Error("Target is already allied with initiator");
      // }

      // Execute the breakAlliance instruction
      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      console.info("Break alliance tx signature:", tx);

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

      console.info("🔨 Alliance broken successfully", {
        allianceId: alliance.id,
        initiatorId: ctx.agentId,
        targetId: action.targetId,
      });

      // Get both agents with their profiles for the event
      const [initiatorDb, targetDb] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: ctx.gameId,
            },
          },
          include: { profile: true },
        }),
      ]);

      if (!initiatorDb || !targetDb) {
        throw new Error("One or more agents not found in database");
      }

      // Create alliance break event with xHandles
      await this.prisma.gameEvent.create({
        data: {
          eventType: "ALLIANCE_BREAK",
          initiatorId: ctx.agentId.toString(),
          targetId: action.targetId.toString(),
          message: `💔 The alliance shatters! @${initiatorDb.profile.xHandle} breaks ties with @${targetDb.profile.xHandle}!`,
          metadata: {
            reason: "voluntary_break",
            timestamp: new Date().toISOString(),
            initiatorHandle: initiatorDb.profile.xHandle,
            targetHandle: targetDb.profile.xHandle,
          },
        },
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
