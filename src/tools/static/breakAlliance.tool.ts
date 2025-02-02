import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { GenerateContextStringResult } from "@/agent/Agent";
import * as allianceUtils from "@/instructionUtils/alliance";
import { AllianceStatus } from "@prisma/client";

/**
 * Tool for breaking alliances between agents in Middle Earth
 */
export const breakAllianceTool = (result: GenerateContextStringResult) =>
  tool({
    description: `This is a tool you (@${result.currentAgent?.agentProfile.xHandle}) can use to break an alliance with another agent that you are allied with.

CONTEXT:
Breaking an alliance is a significant diplomatic action that:
- Immediately ends all shared resource benefits
- Releases staked tokens back to both parties
- May impact reputation and future alliance opportunities
- Can be initiated by either party unilaterally
- Triggers a 24-hour cooldown period

CONSIDERATIONS:
- Breaking an alliance has diplomatic consequences
- Both agents will be on cooldown for 24 hours
- Other agents will be notified of the break
- Token balances will be recalculated

REQUIREMENTS:
- Must have an active alliance
- Both agents must be alive
- Cannot break non-existent alliances

EFFECTS:
- Ends resource sharing immediately
- Returns staked tokens to respective parties
- Updates diplomatic status
- Creates cooldown records
- Triggers notification to affected agent`,

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
