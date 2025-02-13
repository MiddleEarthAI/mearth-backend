import { ActionContext, ActionResult, IgnoreAction } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { ActionHandler } from "../types";
import { gameConfig } from "@/config/env";
import { stringToUuid } from "@/utils/uuid";

export class IgnoreHandler implements ActionHandler<IgnoreAction> {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(
    ctx: ActionContext,
    action: IgnoreAction
  ): Promise<ActionResult> {
    try {
      console.info(`Agent ${ctx.agentId} ignoring ${action.targetId}`);

      // Get the agents
      const [agent, targetAgent] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            id: stringToUuid(action.targetId + ctx.gameOnchainId.toNumber()),
          },
          include: { profile: true },
        }),
      ]);

      if (!agent || !targetAgent) {
        throw new Error("One or more agents not found");
      }

      // Create records in transaction
      await this.prisma.$transaction([
        // Create ignore relationship
        this.prisma.ignore.create({
          data: {
            agentId: ctx.agentId,
            ignoredAgentId: targetAgent.id,
            timestamp: new Date(),
            gameId: ctx.gameId,
            duration: gameConfig.mechanics.cooldowns.ignore,
          },
        }),
        // Create event
        this.prisma.gameEvent.create({
          data: {
            gameId: ctx.gameId,
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
        }),
      ]);

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
          error: {
            type: "IGNORE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }
}
