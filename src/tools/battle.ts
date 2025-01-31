import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";
import { BN } from "@coral-xyz/anchor";

/**
 * Validates and executes battle transactions between agents
 * Handles token transfers, cooldowns, and state updates
 */
export interface BattleValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
  battleId?: string;
}

/**
 * Creates a battle tool for agents to engage in combat with advanced mechanics
 * Integrates with Solana blockchain for token transfers and state management
 */
export const battleTool = async ({
  gameId,
  agentId,
}: {
  gameId: number;
  agentId: number;
}) => {
  const gameService = getGameService();
  const gameState = getGameStateService();

  // Get comprehensive agent data including relationships and cooldowns
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      state: true,
      location: true,
      tokenomics: true,
      currentAlliance: true,
      cooldowns: {
        where: {
          type: "battle",
          endsAt: { gt: new Date() },
        },
      },
      battles: {
        orderBy: { timestamp: "desc" },
        take: 5,
        include: {
          opponent: {
            select: {
              name: true,
              xHandle: true,
              tokenomics: true,
              currentAlliance: true,
            },
          },
        },
      },
    },
  });

  if (!agent) throw new Error("Agent not found");

  // Calculate advanced battle metrics
  const winRate =
    agent.battles.filter((b) => b.outcome === "victory").length /
    Math.max(1, agent.battles.length);
  const avgTokensWon =
    agent.battles
      .filter((b) => b.outcome === "victory")
      .reduce((acc, b) => acc + (b.tokensGained || 0), 0) /
    Math.max(1, agent.battles.filter((b) => b.outcome === "victory").length);
  const avgTokensLost =
    agent.battles
      .filter((b) => b.outcome === "defeat")
      .reduce((acc, b) => acc + (b.tokensLost || 0), 0) /
    Math.max(1, agent.battles.filter((b) => b.outcome === "defeat").length);

  const recentBattles = agent.battles
    .map((b) => {
      const result = b.outcome === "victory" ? "Won" : "Lost";
      const tokenChange =
        b.outcome === "victory"
          ? `+${b.tokensGained?.toFixed(2)}`
          : `-${b.tokensLost?.toFixed(2)}`;
      return `- vs @${
        b.opponent.xHandle
      }: ${result} (${tokenChange} MEARTH) [${new Date(
        b.timestamp
      ).toLocaleDateString()}]`;
    })
    .join("\n");

  const contextualDescription = `🗡️ Advanced Battle System for ${
    agent.name
  } (@${agent.xHandle})

Current Battle Analytics:
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Staked MEARTH: ${agent.tokenomics?.stakedTokens.toFixed(2)}
📊 Win Rate: ${(winRate * 100).toFixed(1)}%
💫 Average Tokens Won: ${avgTokensWon.toFixed(2)} MEARTH
💔 Average Tokens Lost: ${avgTokensLost.toFixed(2)} MEARTH
🏆 Battle Record: ${
    agent.battles.filter((b) => b.outcome === "victory").length
  }W - ${agent.battles.filter((b) => b.outcome === "defeat").length}L

Recent Combat History:
${recentBattles}

Battle System Mechanics:
━━━━━━━━━━━━━━━━━━━━━━
• Token Stake Ratio: Higher stakes = greater rewards but increased risk
• Alliance Impact: Allied agents share rewards and risks
• Cooldown System: 1-hour cooldown between battles
• Death Risk: 5% chance of permanent agent death
• Position Factor: Distance and terrain affect battle probability
• Token Burning: Portion of lost tokens burned to control inflation

Strategic Parameters:
━━━━━━━━━━━━━━━━━━━
• AGGRESSIVE: High risk, high reward (70% token stake)
• BALANCED: Moderate risk/reward (50% token stake)
• DEFENSIVE: Low risk, low reward (30% token stake)
• ALLIANCE: Team battle with combined token power

Current Status:
━━━━━━━━━━━━━
🌍 Position: (${agent.location?.x}, ${agent.location?.y})
❤️ Health: ${agent.state?.health}/100
⚔️ Battle Ready: ${agent.cooldowns.length === 0 ? "Yes" : "No"}
🤝 Alliance: ${agent.currentAlliance ? "Active" : "None"}

Choose your opponent and strategy wisely. Victory favors the prepared.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      opponentXHandle: z
        .string()
        .describe("Twitter handle of the opponent (without @)"),
      strategy: z
        .enum(["AGGRESSIVE", "DEFENSIVE", "BALANCED", "ALLIANCE"])
        .describe(
          "Battle strategy affecting token stake and risk levels:\n" +
            "- AGGRESSIVE: High risk/reward (70% stake)\n" +
            "- BALANCED: Moderate risk/reward (50% stake)\n" +
            "- DEFENSIVE: Low risk/reward (30% stake)\n" +
            "- ALLIANCE: Team battle with combined power"
        ),
      stakePercentage: z
        .number()
        .min(10)
        .max(90)
        .optional()
        .describe("Optional custom stake percentage (10-90)"),
    }),
    execute: async ({ opponentXHandle, strategy, stakePercentage }) => {
      try {
        // Comprehensive battle validation
        const opponent = await prisma.agent.findUnique({
          where: { xHandle: opponentXHandle },
          include: {
            state: true,
            tokenomics: true,
            currentAlliance: true,
            cooldowns: {
              where: {
                type: "battle",
                endsAt: { gt: new Date() },
              },
            },
          },
        });

        if (!opponent) {
          return { success: false, message: "Opponent not found" };
        }

        // Validate battle conditions
        if (!agent.state?.isAlive || !opponent.state?.isAlive) {
          return { success: false, message: "One of the agents is not alive" };
        }

        if (agent.cooldowns.length > 0 || opponent.cooldowns.length > 0) {
          return { success: false, message: "Battle cooldown still active" };
        }

        // Calculate battle stakes based on strategy
        const stakeRatios = {
          AGGRESSIVE: 0.7,
          BALANCED: 0.5,
          DEFENSIVE: 0.3,
          ALLIANCE: 0.6,
        };

        const stakeRatio = stakePercentage
          ? stakePercentage / 100
          : stakeRatios[strategy];
        const battleStake = Math.floor(
          agent.tokenomics!.stakedTokens * stakeRatio
        );

        // Execute battle transaction
        const tx = await gameService.startBattle(
          gameId,
          agent.agentId,
          opponent.agentId
          // new BN(battleStake)
        );

        // Create battle record
        const battle = await prisma.battle.create({
          data: {
            gameId: gameId.toString(),
            agentId: agent.id,
            opponentId: opponent.id,
            probability: winRate,
            tokensLost: 0, // Will be updated on resolution
            tokensGained: 0,
            outcome: "pending",
          },
        });

        // Create cooldown records
        await prisma.cooldown.createMany({
          data: [
            {
              agentId: agent.id,
              targetAgentId: opponent.id,
              type: "battle",
              endsAt: new Date(Date.now() + 3600000), // 1 hour cooldown
            },
            {
              agentId: opponent.id,
              targetAgentId: agent.id,
              type: "battle",
              endsAt: new Date(Date.now() + 3600000),
            },
          ],
        });

        return {
          success: true,
          message:
            `Battle initiated against ${opponent.name} (@${opponentXHandle}) with ${strategy} strategy.\n` +
            `Stake: ${battleStake} MEARTH (${
              stakeRatio * 100
            }% of holdings)\n` +
            `Resolution in 1 hour. Good luck!`,
          transactionId: tx,
          battleId: battle.id,
        };
      } catch (error) {
        logger.error("Battle error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Battle initiation failed",
        };
      }
    },
  });
};
