import { AllianceStatus } from "@prisma/client";
import { BATTLE_RANGE } from "@/constants";
import { calculateDistance } from "./movement";
import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";

export const proposeAllianceTool = function (agentId: string) {
  return tool({
    description: `Form strategic alliance with nearby agent:
      - Combined token pools for battles
      - Mutual defense and attack coordination
      - 4 hour battle cooldown after dissolution
      - 24 hour alliance cooldown after dissolution
      - Both agents must agree to form alliance
      Powerful tool for temporary cooperation and strength multiplication.`,
    parameters: z.object({
      twitterHandle: z
        .string()
        .describe(
          "Twitter handle of the target agent to propose alliance to. Must be within 2 unit range."
        ),
    }),
    execute: async ({ twitterHandle }) => {
      try {
        // Get proposer data
        const proposer = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            currentLocation: true,
            alliances: true,
          },
        });

        if (!proposer) {
          throw new Error("Proposer agent not found");
        }

        // Get target data
        const target = await prisma.agent.findUnique({
          where: { twitterHandle },
          include: {
            currentLocation: true,
            alliances: true,
          },
        });

        if (!target) {
          return {
            success: false,
            message: `No agent found with Twitter handle: ${twitterHandle}`,
          };
        }

        // Validate alliance
        const validation = await validateAlliance(
          {
            id: proposer.id,
            name: proposer.name,
            status: proposer.status,
            x: proposer.currentLocation.x,
            y: proposer.currentLocation.y,
            alliances: proposer.alliances,
          },
          {
            id: target.id,
            name: target.name,
            status: target.status,
            x: target.currentLocation.x,
            y: target.currentLocation.y,
            alliances: target.alliances,
          }
        );

        if (!validation.success) {
          return validation;
        }

        // Create alliance
        const alliance = await prisma.alliance.create({
          data: {
            agents: {
              connect: [{ id: proposer.id }, { id: target.id }],
            },
            status: "ACTIVE",
          },
        });

        return {
          success: true,
          message: `Alliance proposed to ${target.name}`,
          alliance,
        };
      } catch (error) {
        logger.error("Alliance error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Alliance proposal failed",
        };
      }
    },
  });
};

interface AllianceValidationResult {
  success: boolean;
  message: string;
}

interface AllyStats {
  id: string;
  name: string;
  status: "ACTIVE" | "DEFEATED";
  x: number;
  y: number;
  alliances: {
    status: AllianceStatus;
    dissolutionTime: Date | null;
  }[];
}

/**
 * Validates if an alliance can be formed between two agents
 */
export async function validateAlliance(
  proposer: AllyStats,
  target: AllyStats
): Promise<AllianceValidationResult> {
  // Check if either agent is defeated
  if (proposer.status === "DEFEATED") {
    return {
      success: false,
      message: "Proposer is defeated and cannot form alliances",
    };
  }

  if (target.status === "DEFEATED") {
    return {
      success: false,
      message: "Target is defeated and cannot form alliances",
    };
  }

  // Check distance between agents
  const distance = calculateDistance(
    proposer.x,
    proposer.y,
    target.x,
    target.y
  );

  if (distance > BATTLE_RANGE) {
    return {
      success: false,
      message: `Target is out of alliance range (${distance.toFixed(
        2
      )} units away, maximum ${BATTLE_RANGE} units)`,
    };
  }

  // Check for existing active alliances
  const hasActiveAlliance = proposer.alliances.some(
    (a) =>
      a.status === "ACTIVE" ||
      (a.status === "DISSOLVED" &&
        a.dissolutionTime &&
        Date.now() - a.dissolutionTime.getTime() < 24 * 3600 * 1000) // 24 hour cooldown
  );

  if (hasActiveAlliance) {
    return {
      success: false,
      message:
        "Proposer already has an active alliance or is in cooldown period",
    };
  }

  // Check if target has active alliances
  const targetHasActiveAlliance = target.alliances.some(
    (a) => a.status === "ACTIVE"
  );

  if (targetHasActiveAlliance) {
    return {
      success: false,
      message: "Target already has an active alliance",
    };
  }

  return {
    success: true,
    message: "Alliance proposal is valid",
  };
}

/**
 * Calculates combined battle strength of allied agents
 */
export function calculateAllianceStrength(allyTokens: number[]): {
  totalStrength: number;
  distribution: number[];
} {
  const totalTokens = allyTokens.reduce((sum, tokens) => sum + tokens, 0);
  const distribution = allyTokens.map((tokens) => tokens / totalTokens);

  return {
    totalStrength: totalTokens,
    distribution,
  };
}
