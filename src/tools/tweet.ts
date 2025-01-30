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
  BattleReport = "Battle Report",
  AllianceProposal = "Alliance Proposal",
  TerritoryClaim = "Territory Claim",
  StrategicUpdate = "Strategic Update",
  StatusUpdate = "Status Update",
  //   CommunityEvent = "Community Event",
}

/**
 * Creates a tweet tool for an agent to post messages on Twitter
 * Uses TwitterService with manager pattern for handling multiple agents
 */
export const tweetTool = async (
  agentId: number,
  twitterClient: TwitterClient | null
) => {
  // Get agent's current state and social context
  const agent = await prisma.agent.findUnique({
    where: { agentId: agentId },
    include: {
      location: true,
      community: {
        include: {
          interactions: true,
        },
      },
    },
  });

  if (!agent) throw new Error(`Agent not found in database: ${agentId}`);

  // Format community details and recent interactions
  const communityStats = agent.community
    ? `Community Stats:
     Followers: ${agent.community.followers}
     Avg Engagement: ${agent.community.averageEngagement.toFixed(2)}
     Supporters: ${agent.community.supporterCount}`
    : "No community data";

  const recentInteractions =
    agent.community?.interactions
      .map(
        (interaction) =>
          `- ${interaction.type}: "${interaction.content.substring(
            0,
            50
          )}..." ` +
          `(Engagement: ${interaction.engagement}, Sentiment: ${interaction.sentiment}, ` +
          `Author Followers: ${interaction.authorFollowers})`
      )
      .join("\n") || "No recent interactions";

  const communityDetails = `${communityStats}\n\nRecent Interactions:\n${recentInteractions}`;

  const contextualDescription = `🐦 tweeting tool for ${agent.name}, @${
    agent.xHandle
  } 

Current Social Status:
🤝 Recent Interactions:
${recentInteractions || "No recent interactions"}

Community Engagements:
${communityDetails}
Current Position: (${agent.location?.x}, ${agent.location?.y})

Tweet Guidelines:
• Stay in character (${agent.backstory} @${agent.xHandle})
• Reference current location/events
• Maintain consistent personality
• Consider relationships
• Use appropriate tone
• Include relevant hashtags

Content Categories:
• Battle reports
• Alliance proposals
• Territory claims


Strategic Impact:
• Tweets affect reputation
• Can trigger events
• Influence relationships
• Market price impact
• Community engagement
• Historical record

Express yourself wisely, ${agent.name}. Your words echo across Middle Earth.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      content: z
        .string()
        .min(1)
        .max(280)
        .describe(
          "The tweet content. This is the message that will be posted on Twitter. use it to express your thoughts, feelings, and actions."
        ),
      type: z.nativeEnum(TweetType).describe("Category of tweet for context"),
      coordinates: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional()
        .describe("Location reference for the tweet"),
    }),

    execute: async ({ content, type, coordinates }) => {
      try {
        // Post the tweet using the agent's client
        if (!twitterClient) throw new Error("Twitter client not found");
        await twitterClient.postTweet(content);

        return {
          success: true,
          message: `Your tweet @ ${agent.xHandle}: "${content}" has been posted on Twitter!`,
          coordinates,
        };
      } catch (error) {
        logger.error("Tweet error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Tweet failed",
        };
      }
    },
  });
};
