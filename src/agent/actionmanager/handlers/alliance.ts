import {
  ActionContext,
  FormAllianceAction,
  BreakAllianceAction,
  ActionResult,
} from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionHandler } from "../types";
import { stringToUuid } from "@/utils/uuid";

import { gameConfig } from "@/config/env";

export class AllianceHandler
  implements ActionHandler<FormAllianceAction | BreakAllianceAction>
{
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(
    ctx: ActionContext,
    action: FormAllianceAction | BreakAllianceAction
  ): Promise<ActionResult> {
    return action.type === "FORM_ALLIANCE"
      ? this.handleFormAlliance(ctx, action)
      : this.handleBreakAlliance(ctx, action);
  }

  private async handleFormAlliance(
    ctx: ActionContext,
    action: FormAllianceAction
  ): Promise<ActionResult> {
    try {
      console.info("🤝 Processing ally request", {
        initiatorId: ctx.agentId,
        joinerId: action.targetId,
      });

      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
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

      // Fetch accounts
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.program.account.agent.fetch(initiatorPda),
        this.program.account.agent.fetch(joinerPda),
      ]);

      // Execute onchain alliance
      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      // Get database records
      const [initiator, joiner] = await Promise.all([
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

      if (!initiator || !joiner) {
        throw new Error("One or more agents not found in database");
      }

      // Convert target onchain ID to database UUID
      const targetId = stringToUuid(action.targetId + ctx.gameOnchainId);

      // Update database in transaction
      await this.prisma.$transaction([
        // Create alliance record
        this.prisma.alliance.create({
          data: {
            combinedTokens: initiatorAccount.tokenBalance.add(
              joinerAccount.tokenBalance
            ),
            gameId: ctx.gameId,
            initiatorId: initiator.id,
            joinerId: joiner.id,
            status: "Active",
            timestamp: new Date(),
          },
        }),
        // Create cooldowns
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance
            ),
            cooledAgentId: initiator.id,
            gameId: ctx.gameId,
          },
        }),
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance
            ),
            cooledAgentId: joiner.id,
            gameId: ctx.gameId,
          },
        }),
        // Create event
        this.prisma.gameEvent.create({
          data: {
            eventType: "ALLIANCE_FORM",
            initiatorId: ctx.agentId,
            targetId: targetId,
            message: `🤝 A powerful alliance forms between @${initiator.profile.xHandle} and @${joiner.profile.xHandle}!`,
            metadata: {
              allianceType: "formation",
              timestamp: new Date().toISOString(),
              initiatorHandle: initiator.profile.xHandle,
              joinerHandle: joiner.profile.xHandle,
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
      console.error("Alliance formation failed", { error });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "FORM_ALLIANCE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  private async handleBreakAlliance(
    ctx: ActionContext,
    action: BreakAllianceAction
  ): Promise<ActionResult> {
    try {
      console.info("🔨 Processing alliance breaking action");

      // Get PDAs
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

      // Execute onchain break
      const tx = await this.program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // Get database records
      const [initiator, target, alliance] = await Promise.all([
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
        this.prisma.alliance.findFirst({
          where: {
            AND: [
              {
                OR: [
                  {
                    initiatorId: ctx.agentId,
                    joinerId: action.targetId.toString(),
                  },
                  {
                    initiatorId: action.targetId.toString(),
                    joinerId: ctx.agentId,
                  },
                ],
              },
              { status: "Active" },
            ],
          },
        }),
      ]);

      if (!initiator || !target || !alliance) {
        throw new Error("Required records not found in database");
      }

      // Convert target onchain ID to database UUID
      const targetId = stringToUuid(action.targetId + ctx.gameOnchainId);

      // Update database in transaction
      await this.prisma.$transaction([
        // Update alliance status
        this.prisma.alliance.update({
          where: { id: alliance.id },
          data: {
            status: "Broken",
            endedAt: new Date(),
          },
        }),
        // Create cooldowns
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance * 1000
            ),
            cooledAgentId: initiator.id,
            gameId: ctx.gameId,
          },
        }),
        this.prisma.coolDown.create({
          data: {
            type: "Alliance",
            endsAt: new Date(
              Date.now() + gameConfig.mechanics.cooldowns.newAlliance * 1000
            ),
            cooledAgentId: target.id,
            gameId: ctx.gameId,
          },
        }),
        // Create event
        this.prisma.gameEvent.create({
          data: {
            eventType: "ALLIANCE_BREAK",
            initiatorId: ctx.agentId,
            targetId: targetId,
            message: `💔 The alliance shatters! @${initiator.profile.xHandle} breaks ties with @${target.profile.xHandle}!`,
            metadata: {
              reason: "voluntary_break",
              timestamp: new Date().toISOString(),
              initiatorHandle: initiator.profile.xHandle,
              targetHandle: target.profile.xHandle,
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
      console.error("Alliance breaking failed", { error });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "BREAK_ALLIANCE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }
}
