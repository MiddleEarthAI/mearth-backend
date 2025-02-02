import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { GenerateContextStringResult } from "@/agent/Agent";
import * as allianceUtils from "@/instructionUtils/alliance";

/**
 * Tool for breaking alliances between agents in Middle Earth
 */
export const breakAllianceTool = (result: GenerateContextStringResult) =>
  tool({
    description: `This is a tool you (@${result.currentAgent?.agentProfile.xHandle}) can use to break an alliance with another agent that you are allied with.`,

    parameters: z.object({
      targetAgentXHandle: z
        .enum(["scootlesAI", "purrlockpawsAI", "wanderleafAI", "sirgullihopAI"])
        .transform((val) => val.toLowerCase()),
      reason: z.string().describe("Optional reason for breaking the alliance"),
    }),

    execute: async ({ targetAgentXHandle, reason }) => {
      const agent = result.currentAgent;
      const agentId = agent.agentId;

      try {
        // Find target agent and verify alliance exists
        const targetAgent = await prisma.agent.findFirst({
          where: {
            agentProfile: {
              xHandle: targetAgentXHandle,
            },
            gameId: agent.gameId,
          },
          include: {
            currentAlliance: true,
            game: {
              select: {
                id: true,
                gameId: true,
              },
            },
          },
        });

        if (!targetAgent) {
          return {
            success: false,
            message: `Target agent @${targetAgentXHandle} not found in the game`,
          };
        }

        const valResult = await allianceUtils.canBreakAlliance(
          Number(targetAgent.game.gameId),
          Number(agentId),
          Number(targetAgent.agentId)
        );

        if (!valResult.canBreak) {
          return {
            success: false,
            message:
              valResult.reason ||
              `No active alliance found between you and @${targetAgentXHandle}`,
          };
        }

        // Execute alliance break
        const result = await allianceUtils.breakAlliance(
          Number(targetAgent.game.gameId),
          Number(agentId),
          Number(targetAgent.agentId)
        );

        // Create cooldown records for both agents
        const cooldownEndsAt = new Date();
        cooldownEndsAt.setHours(cooldownEndsAt.getHours() + 24); // 24-hour cooldown

        await Promise.all([
          prisma.cooldown.create({
            data: {
              type: "alliance",
              endsAt: cooldownEndsAt,
              agent: { connect: { id: agent.id } },
              targetAgentId: targetAgent.id,
            },
          }),
          prisma.cooldown.create({
            data: {
              type: "alliance",
              endsAt: cooldownEndsAt,
              agent: { connect: { id: targetAgent.id } },
              targetAgentId: agent.id,
            },
          }),
        ]);

        logger.info(
          `🔓 Alliance broken between @${agent.agentProfile.xHandle} and @${targetAgentXHandle}`,
          {
            tx: result.tx,
            reason,
          }
        );

        return {
          success: true,
          message: "Alliance successfully broken",
          details: {
            transactionId: result.tx,
            initiatorState: result.details.initiatorState,
            targetState: result.details.targetState,
            reason: reason || "No reason provided",
            cooldownEndsAt: cooldownEndsAt.toISOString(),
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to break alliance";

        logger.error(`Alliance break failed: ${message}`, {
          initiator: agent.agentProfile.xHandle,
          target: targetAgentXHandle,
          error,
        });

        throw new Error(message);
      }
    },
  });
