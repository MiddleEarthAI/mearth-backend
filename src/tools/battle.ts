import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";
import type { GameService } from "@/services/GameService";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

export interface BattleValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates a battle tool for an agent to engage in combat
 * Uses GameService for blockchain interactions and token mechanics
 */
export const battleTool = async (gameId: number, agentId: number) => {
  const gameService = getGameService();
  const gameState = getGameStateService();
  // Get agent's current state and battle
  const agent = await prisma.agent.findUnique({
    where: { id: agentId.toString() },
    include: {
      state: true,
      location: true,
      tokenomics: true,
      battles: {
        orderBy: { timestamp: "desc" },
        take: 5,
        include: {
          opponent: {
            select: {
              name: true,
              xHandle: true,
            },
          },
        },
      },
    },
  });

  if (!agent) throw new Error("Agent not found");

  // Calculate battle stats
  const winRate =
    agent.battles.filter((b) => b.outcome === "victory").length /
    agent.battles.length;
  const recentBattles = agent.battles
    .map(
      (b) =>
        `- Battle vs ${b.opponent.xHandle}: ${b.outcome} (Tokens Burned: ${b.tokensLost})`
    )
    .join("\n");

  const contextualDescription = `⚔️ Battle Tool(action) for ${agent.name}, @${
    agent.xHandle
  } 

Current Battle Stats:

🏋️ Token Balance: ${agent.tokenomics?.stakedTokens} MEARTH
🎯 Win Rate: ${(winRate * 100).toFixed(1)}%
💪 Battle Record: ${
    agent.battles.filter((b) => b.outcome === "victory").length
  }W - ${agent.battles.filter((b) => b.outcome === "defeat").length}L
🔥 Total Tokens Burned: ${agent.battles.reduce(
    (acc, b) => acc + (b.tokensLost || 0),
    0
  )} MEARTH

Recent Battles:
${recentBattles}

Battle Mechanics:
• Outcome determined by token stake ratios
• 5% death chance per battle
• Winner claims portion of loser's tokens
• Tokens are burned to prevent inflation
• Cooldown period after each battle
• Position affects battle availability

Strategic Considerations:
• Higher token stakes = higher rewards
• Consider opponent's battle history
• Evaluate risk vs. reward ratio
• Check relationship status first
• Terrain may affect outcomes
• Community sentiment impacts rewards

Current Position: (${agent.location?.x}, ${agent.location?.y})
Health: ${agent.state?.health}/100
Status: ${agent.state?.isAlive ? "Alive" : "Dead"}

Choose your battles wisely, ${agent.name}. Victory favors the prepared.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      opponentXHandle: z.string().describe("XHandle of the agent to battle"),
      strategy: z
        .enum(["AGGRESSIVE", "DEFENSIVE", "BALANCED"])
        .describe("Battle strategy affecting token stake and risk levels"),
    }),
    execute: async ({ opponentXHandle, strategy }) => {
      try {
        // Validate battle conditions
        const opponent = await prisma.agent.findUnique({
          where: { xHandle: opponentXHandle },
        });

        if (!opponent) {
          return {
            success: false,
            message: "Opponent not found",
          };
        }

        if (!agent.state?.isAlive) {
          return {
            success: false,
            message: "Agent is dead",
          };
        }

        // Execute battle transaction
        const tx = await gameService.initiateBattle(gameId, agentId);

        return {
          success: true,
          message: `You just initiated a battle against agent ${
            opponent.name
          } @${opponentXHandle} Time: ${new Date().toISOString()}. 
		  You adopted this strategy: ${strategy}.
		  The battle will be resolved in 1hr so try everything you can to win.`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Battle error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Battle failed",
        };
      }
    },
  });
};
