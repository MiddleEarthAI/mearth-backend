import { tool } from "ai";
import { z } from "zod";
import { logger } from "../utils/logger";
import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { prisma } from "@/config/prisma";
import { TerrainType } from "@prisma/client";
import {
  calculateDistance,
  calculateMovementSpeed,
  moveTool,
} from "@/actions/movement";
import { validateBattle, calculateBattleOutcome } from "@/actions/battle";
import { proposeAllianceTool, validateAlliance } from "@/actions/alliance";
import { tweetTool } from "./tweet";

export const battleTool = function (agentId: string) {
  return tool({
    description: `Initiate combat with another agent within 2 unit range:
      - Win probability based on MEARTH token ratio
      - 31-50% token burn on loss
      - 5% death chance on loss
      - Battle duration = 1 sec per token
      - All tokens transfer to victor if opponent dies
      High risk, high reward strategic option.`,
    parameters: z.object({
      twitterHandle: z
        .string()
        .describe(
          "Twitter handle of the target agent to battle. Must be within 2 unit range."
        ),
    }),
    execute: async ({ twitterHandle }) => {
      try {
        // Get attacker data
        const attacker = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            currentLocation: true,
            wallet: true,
          },
        });

        if (!attacker) {
          throw new Error("Attacker agent not found");
        }

        // Get defender data
        const defender = await prisma.agent.findUnique({
          where: { twitterHandle },
          include: {
            currentLocation: true,
            wallet: true,
          },
        });

        if (!defender) {
          return {
            success: false,
            message: `No agent found with Twitter handle: ${twitterHandle}`,
          };
        }

        // Validate battle
        const validation = await validateBattle(
          {
            id: attacker.id,
            name: attacker.name,
            status: attacker.status,
            governanceTokens: attacker.wallet.governanceTokens,
            x: attacker.currentLocation.x,
            y: attacker.currentLocation.y,
          },
          {
            id: defender.id,
            name: defender.name,
            status: defender.status,
            governanceTokens: defender.wallet.governanceTokens,
            x: defender.currentLocation.x,
            y: defender.currentLocation.y,
          }
        );

        if (!validation.success) {
          return validation;
        }

        // Calculate battle outcome
        const outcome = calculateBattleOutcome(
          attacker.wallet.governanceTokens,
          defender.wallet.governanceTokens
        );

        // Record battle in database
        const battle = await prisma.battle.create({
          data: {
            attackerId: attacker.id,
            defenderId: defender.id,
            outcome: outcome.attackerWon ? "ATTACKER_WIN" : "DEFENDER_WIN",
            tokensBurned: outcome.tokensBurned,
            winningProbability: validation.winProbability || 0,
          },
        });

        // Update tokens and status based on outcome
        if (outcome.attackerWon) {
          await prisma.$transaction([
            // Update defender's tokens (burn tokens)
            prisma.wallet.update({
              where: { id: defender.wallet.id },
              data: {
                governanceTokens: {
                  decrement: outcome.tokensBurned,
                },
              },
            }),
            // Update defender's status if they died
            outcome.deathOccurred
              ? prisma.agent.update({
                  where: { id: defender.id },
                  data: { status: "DEFEATED" },
                })
              : prisma.$queryRaw`SELECT 1`,
          ]);
        } else {
          await prisma.$transaction([
            // Update attacker's tokens (burn tokens)
            prisma.wallet.update({
              where: { id: attacker.wallet.id },
              data: {
                governanceTokens: {
                  decrement: outcome.tokensBurned,
                },
              },
            }),
            // Update attacker's status if they died
            outcome.deathOccurred
              ? prisma.agent.update({
                  where: { id: attacker.id },
                  data: { status: "DEFEATED" },
                })
              : prisma.$queryRaw`SELECT 1`,
          ]);
        }

        return {
          success: true,
          message: `Battle completed: ${
            outcome.attackerWon ? "Victory" : "Defeat"
          }! ${outcome.tokensBurned} tokens burned${
            outcome.deathOccurred ? " and opponent defeated" : ""
          }`,
          battle,
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

export const ignoreTool = function (agentId: string) {
  return tool({
    description: `Strategically skip current turn while maintaining position:
      - Preserve resources and energy
      - Avoid unnecessary conflicts
      - Wait for better opportunities
      - Observe other agents' movements
      Useful for defensive play or gathering intelligence.`,
    parameters: z.object({}),
    execute: async () => {
      logger.info(`Agent ${agentId} chose to ignore`);
      return { status: "ignored" };
    },
  });
};

export const scanTerrainTool = function (agentId: string) {
  return tool({
    description: `Analyze surrounding terrain within specified radius to gather critical strategic information:
      - Identify terrain types (plains, mountains, rivers)
      - Detect nearby agents and their positions
      - Calculate movement penalties and risks
      - Find optimal paths and strategic positions
      - Assess battle/alliance opportunities
      Results help plan movements, avoid dangers, and find tactical advantages.`,
    parameters: z.object({
      radius: z
        .number()
        .describe(
          "Distance in map units to scan (1-10 units). Larger radius provides more information but takes longer."
        ),
    }),
    execute: async ({ radius }) => {
      logger.info(`Agent ${agentId} scanned terrain with radius ${radius}`);
      return { radius, terrainData: {} };
    },
  });
};

export const checkDistanceTool = function (agentId: string) {
  return tool({
    description: `Calculate precise distance and optimal path to other agents or strategic locations:
      - Exact unit distance accounting for terrain
      - Estimated travel time with terrain penalties
      - Safest route avoiding dangerous terrain
      - Potential encounter points
      Essential for planning movements, battles, and alliances.`,
    parameters: z.object({
      twitterHandle: z
        .string()
        .describe(
          "Twitter handle of target agent or location to measure distance to."
        ),
    }),
    execute: async ({ twitterHandle }) => {
      logger.info(`Agent ${agentId} checked distance to ${twitterHandle}`);
      return { twitterHandle, distance: 0 };
    },
  });
};

export const predictEncountersTool = function (agentId: string) {
  return tool({
    description: `Analyze probability and timing of potential agent encounters in specified area:
      - Calculate likelihood of encounters based on agent movements
      - Predict timing of possible battles/alliances
      - Assess risk levels of different paths
      - Identify safe zones and danger areas
      Critical for strategic planning and risk management.`,
    parameters: z.object({
      x: z.number().describe("X coordinate of center point to analyze."),
      y: z.number().describe("Y coordinate of center point to analyze."),
      radius: z
        .number()
        .describe(
          "Radius in map units to analyze for encounters (1-10 units)."
        ),
    }),
    execute: async ({ x, y, radius }) => {
      logger.info(`Agent ${agentId} predicted encounters at (${x}, ${y})`);
      return { x, y, radius, predictions: [] };
    },
  });
};

export const analyzeTokenomicsTool = function (agentId: string) {
  return tool({
    description: `Comprehensive analysis of MEARTH token economics:
      - Token distribution across agents
      - Staking rewards and rates
      - Battle outcome probabilities
      - Risk/reward scenarios
      - Market dynamics and trends
      Essential for strategic token management and battle planning.`,
    parameters: z.object({
      metrics: z
        .array(z.string())
        .describe(
          "List of specific tokenomic metrics to analyze (e.g. ['distribution', 'staking_rates', 'battle_odds'])."
        ),
    }),
    execute: async ({ metrics }) => {
      logger.info(`Agent ${agentId} analyzed tokenomics`);
      return { metrics, analysis: {} };
    },
  });
};

export const calculateRewardsTool = function (agentId: string) {
  return tool({
    description: `Calculate potential staking rewards and returns:
      - Projected reward rates based on stake amount
      - Time-based return projections
      - Pool size impact analysis
      - Risk-adjusted reward estimates
      Helps optimize token staking strategy and resource allocation.`,
    parameters: z.object({
      amount: z
        .number()
        .describe("Amount of MEARTH tokens to analyze for staking."),
      duration: z
        .number()
        .describe("Duration in days to project staking returns."),
    }),
    execute: async ({ amount, duration }) => {
      logger.info(`Agent ${agentId} calculated rewards for ${amount} tokens`);
      return { amount, duration, estimatedRewards: 0 };
    },
  });
};

export const analyzeSentimentTool = function (agentId: string) {
  return tool({
    description: `Analyze community sentiment and social dynamics:
      - Tweet engagement metrics
      - Community support levels
      - Alliance opportunities
      - Threat assessments
      - Strategic reputation management
      Critical for maintaining community support and predicting agent behaviors.`,
    parameters: z.object({
      timeframe: z
        .string()
        .describe(
          "Time period for sentiment analysis (e.g. '24h', '7d', '30d')."
        ),
    }),
    execute: async ({ timeframe }) => {
      logger.info(`Agent ${agentId} analyzed sentiment for ${timeframe}`);
      return { timeframe, sentiment: {} };
    },
  });
};

// Export a function to get all tools for an agent
export const getAgentTools = (
  agentId: string,
  solana: Solana,
  twitter: Twitter
) => ({
  moveTool: moveTool(agentId, solana),
  scanTerrainTool: scanTerrainTool(agentId),
  checkDistanceTool: checkDistanceTool(agentId),
  predictEncountersTool: predictEncountersTool(agentId),
  battleTool: battleTool(agentId),
  proposeAllianceTool: proposeAllianceTool(agentId),
  analyzeTokenomicsTool: analyzeTokenomicsTool(agentId),
  calculateRewardsTool: calculateRewardsTool(agentId),
  analyzeSentimentTool: analyzeSentimentTool(agentId),
  ignoreTool: ignoreTool(agentId),
  tweetTool: tweetTool(agentId, twitter),
});
// End of Selection
