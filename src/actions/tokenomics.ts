import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";

interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  averageHolding: number;
  gini: number; // Gini coefficient for token distribution
  topHolders: Array<{
    name: string;
    twitterHandle: string;
    balance: number;
    percentage: number;
  }>;
}

interface StakingMetrics {
  totalStaked: number;
  averageReward: number;
  annualizedReturn: number;
  stakingParticipation: number;
}

/**
 * Calculates Gini coefficient for token distribution
 */
function calculateGiniCoefficient(balances: number[]): number {
  if (balances.length === 0) return 0;

  const sortedBalances = [...balances].sort((a, b) => a - b);
  const n = sortedBalances.length;
  const totalBalance = sortedBalances.reduce((sum, val) => sum + val, 0);

  let sumOfDifferences = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumOfDifferences += Math.abs(sortedBalances[i] - sortedBalances[j]);
    }
  }

  return sumOfDifferences / (2 * n * n * (totalBalance / n));
}

/**
 * Analyzes token distribution and metrics
 */
async function analyzeTokenDistribution(): Promise<TokenMetrics> {
  const wallets = await prisma.wallet.findMany({
    include: {
      agent: {
        select: {
          name: true,
          twitterHandle: true,
          status: true,
        },
      },
    },
  });

  const activeWallets = wallets.filter((w) => w.agent?.status === "ACTIVE");
  const balances = activeWallets.map((w) => w.governanceTokens);
  const totalSupply = balances.reduce((sum, bal) => sum + bal, 0);

  // Sort wallets by balance for top holders
  const sortedWallets = [...activeWallets]
    .sort((a, b) => b.governanceTokens - a.governanceTokens)
    .slice(0, 5);

  return {
    totalSupply,
    circulatingSupply: totalSupply, // Assuming all tokens are in circulation
    averageHolding: totalSupply / activeWallets.length,
    gini: calculateGiniCoefficient(balances),
    topHolders: sortedWallets.map((w) => ({
      name: w.agent!.name,
      twitterHandle: w.agent!.twitterHandle,
      balance: w.governanceTokens,
      percentage: (w.governanceTokens / totalSupply) * 100,
    })),
  };
}

/**
 * Analyzes staking metrics and rewards
 */
async function analyzeStakingMetrics(): Promise<StakingMetrics> {
  const [wallets, rewards] = await Promise.all([
    prisma.wallet.findMany({
      include: {
        stakingRewards: true,
        agent: {
          select: { status: true },
        },
      },
    }),
    prisma.stakingReward.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  const activeWallets = wallets.filter((w) => w.agent?.status === "ACTIVE");
  const totalStaked = activeWallets.reduce(
    (sum, w) => sum + w.governanceTokens,
    0
  );
  const totalRewards = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);

  const annualizedReturn = ((totalRewards * 12) / totalStaked) * 100; // Monthly to annual
  const stakingParticipation = (activeWallets.length / wallets.length) * 100;

  return {
    totalStaked,
    averageReward: totalRewards / rewards.length,
    annualizedReturn,
    stakingParticipation,
  };
}

export const tokenomicsTool = function (agentId: string) {
  return tool({
    description: `Advanced tokenomics analysis tool:
      - Token distribution metrics
      - Staking performance analysis
      - Market concentration (Gini)
      - Top holder identification
      Essential for strategic token management.`,
    parameters: z.object({
      metrics: z
        .array(z.enum(["distribution", "staking", "holders", "rewards"]))
        .describe("Metrics to analyze"),
    }),
    execute: async ({ metrics }) => {
      try {
        const results: Record<string, any> = {};

        if (metrics.includes("distribution") || metrics.includes("holders")) {
          results.tokenMetrics = await analyzeTokenDistribution();
        }

        if (metrics.includes("staking") || metrics.includes("rewards")) {
          results.stakingMetrics = await analyzeStakingMetrics();
        }

        return {
          success: true,
          message: `Analyzed ${Object.keys(results).length} metric categories`,
          analysis: results,
        };
      } catch (error) {
        logger.error("Tokenomics analysis error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Analysis failed",
        };
      }
    },
  });
};
