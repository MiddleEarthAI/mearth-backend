import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";

interface IgnoreValidationResult {
  success: boolean;
  message: string;
  cooldown?: number;
}

/**
 * Validates if an agent can ignore an interaction
 */
async function validateIgnore(
  agentId: string,
  targetId: string,
  duration: number
): Promise<IgnoreValidationResult> {
  // Check if agent exists and is active
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { status: true },
  });

  if (!agent) {
    return {
      success: false,
      message: "Agent not found",
    };
  }

  if (agent.status === "DEFEATED") {
    return {
      success: false,
      message: "Defeated agents cannot ignore interactions",
    };
  }

  // Check if target exists
  const target = await prisma.agent.findUnique({
    where: { id: targetId },
  });

  if (!target) {
    return {
      success: false,
      message: "Target agent not found",
    };
  }

  // Check for existing ignore status
  const existingIgnore = await prisma.agentTrait.findFirst({
    where: {
      agentId,
      traitName: `ignore_${targetId}`,
    },
  });

  if (existingIgnore) {
    const cooldown = Math.max(
      0,
      new Date(existingIgnore.lastUpdated).getTime() +
        duration * 60 * 60 * 1000 -
        Date.now()
    );

    return {
      success: false,
      message: "Already ignoring this agent",
      cooldown: Math.ceil(cooldown / (60 * 60 * 1000)), // Convert to hours
    };
  }

  return {
    success: true,
    message: "Can ignore interaction",
  };
}

export const ignoreTool = function (agentId: string) {
  return tool({
    description: `Strategic ignore tool for Middle Earth agents:
      - Temporarily ignore specific agents
      - Avoid unwanted interactions
      - Manage social dynamics
      - Cool down periods for conflicts
      Ignoring is a strategic choice with social consequences.`,
    parameters: z.object({
      targetAgentId: z.string().describe("ID of the agent to ignore"),
      duration: z
        .number()
        .min(1)
        .max(72)
        .describe("Duration to ignore in hours (1-72)"),
      reason: z.string().optional().describe("Optional reason for ignoring"),
    }),
    execute: async ({ targetAgentId, duration, reason }) => {
      try {
        // Validate ignore action
        const validation = await validateIgnore(
          agentId,
          targetAgentId,
          duration
        );

        if (!validation.success) {
          return validation;
        }

        // Record ignore status
        await prisma.agentTrait.create({
          data: {
            agentId,
            traitName: `ignore_${targetAgentId}`,
            traitValue: duration,
            lastUpdated: new Date(),
          },
        });

        // Log the ignore action
        logger.info(
          `Agent ${agentId} is ignoring ${targetAgentId} for ${duration} hours${
            reason ? `: ${reason}` : ""
          }`
        );

        return {
          success: true,
          message: `Now ignoring agent for ${duration} hours`,
          expiry: new Date(Date.now() + duration * 60 * 60 * 1000),
          reason: reason || "No reason provided",
        };
      } catch (error) {
        logger.error("Ignore action error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to ignore agent",
        };
      }
    },
  });
};
