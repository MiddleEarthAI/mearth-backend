import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { TwitterApi } from "twitter-api-v2";

export enum TweetType {
  BattleReport = "Battle Report",
  AllianceProposal = "Alliance Proposal",
  TerritoryClaim = "Territory Claim",
  StrategicUpdate = "Strategic Update",
  StatusUpdate = "Status Update",
  CommunityEngagement = "Community Engagement",
}

/**
 * Creates a sophisticated tweet tool for agents to engage in Middle Earth's social landscape
 * Integrates with onchain battle system and maintains social graph in database
 */
export const tweetTool = async ({
  agentId,
  gameId,
  twitterApi,
}: {
  agentId: number;
  gameId: number;
  twitterApi: TwitterApi;
}) => {
  // Fetch comprehensive agent state including battle/alliance history
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      location: true,
      community: {
        include: {
          interactions: {
            orderBy: { timestamp: "desc" },
            take: 5,
          },
        },
      },
      currentAlliance: true,
      battles: {
        orderBy: { timestamp: "desc" },
        take: 3,
      },
    },
  });

  if (!agent) throw new Error(`Agent not found: ${agentId}`);

  // Format battle history for context
  const recentBattles = agent.battles
    .map(
      (battle) =>
        `${battle.outcome.toUpperCase()} vs ${battle.opponentId} [${
          battle.tokensGained || -(battle?.tokensLost || 0)
        } tokens]`
    )
    .join("\n");

  // Format alliance and territory context
  const allianceStatus = agent.currentAlliance
    ? `Allied with ${agent.currentAlliance.alliedAgentId}`
    : "No current alliance";

  const territoryContext = `Position: (${agent.location?.x}, ${agent.location?.y}) | Terrain: ${agent.location?.terrainType}`;

  // Format social influence metrics
  const socialMetrics = agent.community
    ? {
        followers: agent.community.followers,
        engagement: agent.community.averageEngagement.toFixed(2),
        sentiment:
          agent.community.interactions.reduce(
            (acc, int) => acc + (int.sentiment === "positive" ? 1 : -1),
            0
          ) / 5,
      }
    : null;

  const contextualDescription = `Strategic Communication tool for ${
    agent.name
  } (@${agent.xHandle})

AGENT PROFILE:
Influence Level: ${agent.influenceDifficulty}

CURRENT STATE:
${territoryContext}
Alliance Status: ${allianceStatus}
Recent Battles: ${recentBattles}

SOCIAL CONTEXT:
Influence Score: ${socialMetrics?.engagement || 0}
Follower Base: ${socialMetrics?.followers || 0}
Recent Sentiment: ${socialMetrics?.sentiment || 0}

COMMUNICATION DIRECTIVES:
1. Maintain character consistency
2. Reference specific coordinates and terrain
3. Use formal Middle Earth diplomatic language
4. Include battle statistics and token stakes
5. Demonstrate strategic depth
6. Build narrative continuity
7. Consider faction relationships

STRATEGIC CONSIDERATIONS:
- Battle outcomes affect token distribution
- Alliance messages require verification
- Territory claims must align with position
- Market sentiment impacts token value
- Community trust affects battle probabilities

Your influence marks whether you win or lose! Choose your words with wisdom.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      content: z
        .string()
        // .min(1)
        // .max(280)
        .describe(
          "Strategic message conforming to Middle Earth diplomatic protocols"
        ),
      type: z
        .nativeEnum(TweetType)
        .describe("Message classification for strategic context"),
      coordinates: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional()
        .describe("Tactical position reference"),
    }),

    execute: async ({ content, type, coordinates }) => {
      try {
        if (!twitterApi) throw new Error("Communication systems offline");
        logger.info(`🐦 Agent ${agentId} is broadcasting message:
        ╔════════════════════════════════════════════
        ║ ${content}
        ╚════════════════════════════════════════════`);

        // Post tweet and get its ID
        // const tweetId = await twitterApi.post(content);

        return {
          success: true,
          message: `Strategic communication deployed via @${agent.xHandle}`,
          // tweetId,
          coordinates,
        };
      } catch (error) {
        logger.error("Communication failure:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Strategic communication failed",
        };
      }
    },
  });
};
