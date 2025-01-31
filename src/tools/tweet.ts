import type { TwitterClient } from "@/agent/TwitterClient";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

export interface TweetValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

enum TweetType {
  BattleReport = "Battle Report", // For reporting battle outcomes and challenges
  AllianceProposal = "Alliance Proposal", // For proposing or discussing alliances
  TerritoryClaim = "Territory Claim", // For claiming or disputing territory
  StrategicUpdate = "Strategic Update", // For sharing strategic positions/plans
  StatusUpdate = "Status Update", // For general updates and positioning
  CommunityEngagement = "Community Engagement", // For rallying support and engagement
}

/**
 * Creates a sophisticated tweet tool for agents to engage in Middle Earth's social landscape
 * Integrates with onchain battle system and maintains social graph in database
 */
export const tweetTool = async (
  agentId: number,
  twitterClient: TwitterClient | null
) => {
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
        include: {
          opponent: true,
        },
      },
      tokenomics: true,
      personality: true,
      strategy: true,
    },
  });

  if (!agent) throw new Error(`Agent not found: ${agentId}`);

  // Format battle history for context
  const recentBattles = agent.battles
    .map(
      (battle) =>
        `${battle.outcome.toUpperCase()} vs ${battle.opponent.name} [${
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
Character: ${agent.characteristics.join(", ")}
Knowledge Base: ${agent.knowledge.join(", ")}
Influence Level: ${agent.influenceDifficulty}

CURRENT STATE:
${territoryContext}
Alliance Status: ${allianceStatus}
Recent Battles: ${recentBattles}
Token Holdings: ${agent.tokenomics?.stakedTokens || 0}

SOCIAL CONTEXT:
Influence Score: ${socialMetrics?.engagement || 0}
Follower Base: ${socialMetrics?.followers || 0}
Recent Sentiment: ${socialMetrics?.sentiment || 0}

COMMUNICATION DIRECTIVES:
1. Maintain character consistency aligned with @${
    agent.xHandle
  } - ${agent.characteristics.join(", ")}
2. Reference specific coordinates and terrain features in territorial claims
3. Use formal Middle Earth diplomatic language for alliances
4. Include battle statistics and token stakes in conflict reports
5. Demonstrate strategic depth while maintaining operational security
6. Build narrative continuity with previous actions
7. Consider faction relationships and political implications

STRATEGIC CONSIDERATIONS:
- Battle outcomes affect token distribution
- Alliance messages require cryptographic verification
- Territory claims must align with onchain position
- Market sentiment impacts token value
- Community trust affects battle probabilities

PROHIBITED:
- Breaking character or lore consistency
- Revealing strategic vulnerabilities
- Making unverifiable claims
- Ignoring established alliances

Your influence marks whether you win or lose!. Choose your words with wisdom.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      content: z
        .string()
        .min(1)
        .max(280)
        .describe(
          "Strategic message conforming to Middle Earth diplomatic protocols and current narrative context"
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
        if (!twitterClient) throw new Error("Communication systems offline");

        // Validate onchain state if relevant

        // Post tweet and update social metrics
        await twitterClient.postTweet(content);

        // Update agent's social metrics
        // await prisma.community.update({
        //   where: { agentId: agent.id },
        //   data: {
        //     interactions: {
        //       create: {
        //         type: type,
        //         content: content,
        //         sentiment: "neutral",
        //         authorFollowers: agent.community?.followers || 0,
        //         engagement: 0,
        //       },
        //     },
        //   },
        // });

        return {
          success: true,
          message: `Strategic communication deployed via @${agent.xHandle}`,
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
