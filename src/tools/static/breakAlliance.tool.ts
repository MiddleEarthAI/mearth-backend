import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { ALLIANCE_COOLDOWN } from "@/types/program";

/**
 * Tool for breaking alliances between agents in Middle Earth
 */
export const breakAllianceTool = (
  agentId: number,
  gameId: number,
  gameDbId: string,
  currentAgentXHandle: string
) =>
  tool({
    description: `This is a tool you (@${currentAgentXHandle}) can use to break an alliance with another agent that you are allied with.`,

    parameters: z.object({
      targetAgentXHandle: z
        .string()
        .describe(
          "The XHandle of the agent you want to break an alliance with. This are availabe agent handles: '@scootlesAI', '@purrlockpawsAI', '@wanderleafAI', '@sirgullihopAI'"
        ),
    }),

    execute: async ({ targetAgentXHandle }) => {
      const targetAgent = await prisma.agent.findFirst({
        where: {
          gameId: gameDbId,
          agentProfile: {
            xHandle: targetAgentXHandle,
          },
          NOT: {
            agentId: agentId,
          },
        },
        include: {
          agentProfile: true,
        },
      });
      const agent = await prisma.agent.findUnique({
        where: {
          agentId_gameId: {
            agentId: agentId,
            gameId: gameDbId,
          },
        },
      });

      if (!targetAgent || !agent) {
        return {
          success: false,
          message: `The agent you are trying to break an alliance with could not be found. @${targetAgentXHandle}`,
        };
      }
      const program = await getProgramWithWallet();
      const [gamePda] = getGamePDA(program.programId, gameId);
      const [targetPda] = getAgentPDA(
        program.programId,
        gamePda,
        targetAgent.agentId
      );
      const [initiatorPda] = getAgentPDA(program.programId, gamePda, agentId);

      const [initiatorAccount, targetAccount] = await Promise.all([
        program.account.agent.fetch(initiatorPda),
        program.account.agent.fetch(targetPda),
      ]);

      if (!initiatorAccount || !targetAccount) {
        return {
          success: false,
          message: `The agent you are trying to break an alliance with could not be found. @${targetAgentXHandle}`,
        };
      }

      if (targetAccount.allianceWith == null) {
        return {
          success: false,
          message: `You are not allied with @${targetAgentXHandle}. so don't try to break an alliance with them.`,
        };
      }

      if (
        initiatorAccount.allianceWith == null ||
        initiatorAccount.allianceTimestamp !== targetAccount.allianceTimestamp
      ) {
        return {
          success: false,
          message: `You are not allied with @${targetAgentXHandle}. so don't try to break an alliance with them.`,
        };
      }

      const tx = await program.methods
        .breakAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: targetPda,
        })
        .rpc();

      // First find the alliance record
      const alliance = await prisma.alliance.findFirst({
        where: {
          AND: [
            {
              OR: [
                {
                  agentId: agent.id,
                  alliedAgentId: targetAgent.id,
                },
                {
                  agentId: targetAgent.id,
                  alliedAgentId: targetAgent.id,
                },
              ],
            },
            {
              gameId: gameDbId,
              status: "Active",
            },
          ],
        },
      });

      if (!alliance) {
        return {
          success: false,
          message: `Looks like you are not allied with @${targetAgentXHandle}. Maybe the gods of Middle Earth are not on your side ATM.`,
        };
      }

      // Then update using the found alliance ID
      await prisma.alliance.update({
        where: {
          id: alliance.id,
        },
        data: {
          status: "Broken",
        },
      });

      try {
        // Create cooldown records for both agents
        const cooldownEndsAt = new Date(ALLIANCE_COOLDOWN);
        cooldownEndsAt.setHours(ALLIANCE_COOLDOWN.getHours() + 24); // 24-hour cooldown

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
          `🔓 Alliance broken between @${agent.agentId} and @${targetAgent.agentId}`,
          {
            tx: tx,
            cooldownEndsAt: cooldownEndsAt.toISOString(),
          }
        );

        return {
          success: true,
          message: "Alliance successfully broken",
          details: {
            transactionId: tx,
            cooldownEndsAt: cooldownEndsAt.toISOString(),
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to break alliance";

        logger.error(`Alliance break failed: ${message}`, {
          initiator: agent.agentId,
          target: targetAgent.agentId,
          error,
        });

        return {
          success: false,
          message: `Alliance break failed: ${message}. Maybe the gods wants you to wait a bit longer haha.`,
        };
      }
    },
  });
