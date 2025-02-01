import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getGameService } from "@/services";
import { logger } from "@/utils/logger";
import { getAgentPDA } from "@/utils/pda";
import { BN } from "@coral-xyz/anchor";
import { getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";

/**
 * Tool for breaking alliances between agents in Middle Earth
 */
export const breakAllianceTool = async ({
  gameId,
  agentId,
}: {
  gameId: number;
  agentId: number;
}) => {
  const gameService = getGameService();
  // const program = await getProgramWithWallet();
  // const [gamePda] = getGamePDA(program.programId, new BN(gameId));
  // const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));
  // const agentAccount = await program.account.agent.fetch(agentPda);
  const agent = await prisma.agent.findUnique({
    where: { agentId },
  });
  if (!agent) {
    throw new Error("Agent not found");
  }
  return tool({
    description: `This is a tool you @${agent?.xHandle} can use to break an alliance with another agent.

CONTEXT:
Breaking an alliance is a significant diplomatic action that:
- Immediately ends all shared resource benefits
- Releases staked tokens back to both parties
- May impact reputation and future alliance opportunities
- Can be initiated by either party unilaterally

CONSIDERATIONS:
- No cooldown period required
- Both agents receive their staked tokens back
- Breaking an alliance may have diplomatic consequences
- Other agents will be notified of the break

REQUIREMENTS:
- Must have an active alliance
- Both agents must be alive

EFFECTS:
- Ends resource sharing
- Returns staked tokens
- Updates diplomatic status
- Triggers notification to affected agent`,

    parameters: z.object({
      targetAgentXHandle: z
        .string()
        .describe(
          "X/Twitter handle of the allied agent to break alliance with"
        ),
      reason: z
        .string()
        .optional()
        .describe("Optional reason for breaking the alliance"),
    }),

    execute: async ({ targetAgentXHandle, reason }) => {
      try {
        // Verify current agent state
        const targetAgent = await prisma.agent.findUnique({
          where: { xHandle: targetAgentXHandle },
        });
        if (!targetAgent) {
          throw new Error("Target agent not found");
        }
        // const targetAgentAccount = await gameStateService.getAgent(
        //   targetAgent?.agentId,
        //   gameId
        // );

        // Execute alliance break
        const result = await gameService.breakAlliance(
          gameId,
          agentId,
          targetAgent.agentId
        );

        // Log the action
        logger.info(
          `Alliance broken between ${agentId} and ${targetAgent.agentId}`,
          {
            reason,
            tx: result.tx,
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
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to break alliance";

        logger.error(`Alliance break failed: ${message}`, {
          agentId,
          targetAgentXHandle,
          error,
        });

        throw new Error(message);
      }
    },
  });
};
