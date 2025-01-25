import { tool } from "ai";
import { z } from "zod";
import { logger } from "./logger";
import { Solana } from "@/deps/solana";
import { Twitter } from "@/deps/twitter";
import { mountains, validCoordinatesArray, river, plains } from "@/constants";
import { prisma } from "@/config/prisma";

export const moveTool = async function (agentId: string, solana: Solana) {
  async function validateMove(x: number, y: number) {
    const coordStr = `${x},${y}`;
    let terrainType = "invalid";

    // Fast validation using pre-computed valid coordinates
    if (validCoordinatesArray.includes(coordStr)) {
      // Get terrain type in one pass using Set.has() operations
      terrainType = mountains.coordinates.has(coordStr)
        ? "mountains"
        : river.coordinates.has(coordStr)
        ? "rivers"
        : plains.coordinates.has(coordStr)
        ? "plains"
        : "invalid";

      logger.warn(`Invalid move: ${terrainType} terrain at (${x},${y})`);
      return {
        success: false,
        message: `validation failed: Invalid move to ${terrainType} terrain at (${x},${y})`,
        terrain: terrainType,
      };
    }

    return {
      success: true,
      message: `Valid move to (${x},${y})`,
      terrain: terrainType,
    };
  }

  return tool({
    description: `Strategic movement tool for navigating the Middle Earth map. This tool allows agents to move to new coordinates while considering:
      - Terrain effects (mountains slow movement by 50%, rivers by 70%)
      - Death risk (1% chance when crossing mountains/rivers)
      - Strategic positioning relative to other agents
      - Distance limitations (1 unit per hour movement speed)
      - Battle/alliance opportunities within 2 unit range
      Use this tool to reposition your agent for battles, form alliances, or avoid threats.`,
    parameters: z.object({
      x: z.number().describe("New X coordinate position on the map "),
      y: z.number().describe("New Y coordinate position on the map "),
      terrain: z.string().describe("Terrain type to move on"),
    }),
    execute: async ({ x, y }) => {
      const { success, message, terrain } = await validateMove(x, y);

      const toLocation = await prisma.location.findFirst({
        where: {
          x,
          y,
        },
      });
      if (success) {
        prisma.movement.create({
          data: {
            agentId,
          },
        });
        return { success, message };
      }
      // await solana.processMoveAgent(agentId, x, y, TerrainType.PLAIN);
      logger.info(`Agent ${agentId} moved to position (${x}, ${y})`);
      return { x, y, success: true };
    },
  });
};
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
      logger.info(`Agent ${agentId} initiated battle with ${twitterHandle}`);
      return { twitterHandle, outcome: null };
    },
  });
};

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
      logger.info(`Agent ${agentId} proposed alliance to ${twitterHandle}`);
      return { twitterHandle, status: "pending" };
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

export const tweetTool = function (agentId: string, twitter: Twitter | null) {
  return tool({
    description: `Broadcast strategic messages to the Middle Earth community:
      - Announce movements and actions 
      - Declare battle intentions
      - Propose or discuss alliances
      - Rally community support
      - Influence other agents' decisions
      Critical for community engagement and strategic communication.`,
    parameters: z.object({
      tweet: z
        .string()
        .describe(
          "Strategic message to broadcast (max 280 characters). Avoid hashtags and use emojis sparingly. Message should align with agent's character and goals."
        ),
    }),
    execute: async ({ tweet }) => {
      if (!twitter) {
        logger.warn("No twitter instance");
        logger.info("---------------TWEET-----------------");
        logger.info(tweet);
        logger.info("-------------------------------------");
        return { tweet, posted: false };
      }

      twitter.postTweet(tweet);
      logger.info(`Agent ${agentId} tweeted: ${tweet}`);
      return { tweet, posted: true };
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
