import type { TwitterClient } from "@/agent/TwitterClient";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";

/**
 * Creates a Twitter engagement analysis tool for analyzing tweet engagement and community dynamics
 * Uses TwitterService with manager pattern for advanced analysis
 */
export const twitterAnalysisTool = async (
  agentId: number,
  twitterClient: TwitterClient
) => {
  // Get agent's current state and social context
  const agent = await prisma.agent.findUnique({
    where: { agentId: agentId },
    include: {},
  });

  if (!agent) throw new Error(`Agent not found in database: ${agentId}`);

  // @TODO: put recent tweets backIn:
  // ${
  //   .map((t) => `- "${t.content}" (${new Date(t.createdAt).toISOString()})`)
  //   .join("\n")}

  const contextualDescription = `🔍 Tweet Analysis System for ${agent.name}

Analyze tweet engagement and community dynamics for strategic insights.

Recent Tweet History:


Analysis Capabilities:
• Engagement metrics
• Sentiment analysis
• Community influence
• Strategy detection
• Deception detection
• Network effects

Use this tool to:
• Evaluate tweet impact
• Detect community trends
• Identify strategic opportunities
• Monitor reputation
• Track influence growth
• Guide future engagement`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      tweetId: z.string().describe("ID of tweet to analyze"),
      includeReplies: z.boolean().describe("Whether to analyze reply threads"),
      includeQuotes: z.boolean().describe("Whether to analyze quote tweets"),
      minEngagementScore: z
        .number()
        .min(0)
        .max(1)
        .describe("Minimum engagement threshold (0-1)"),
    }),

    execute: async ({
      tweetId,
      includeReplies,
      includeQuotes,
      minEngagementScore,
    }) => {
      try {
        // Get the client and analyze the tweet
        const analysis = await twitterClient.analyzeEngagement(tweetId);

        if (!analysis || analysis.communityInfluence < minEngagementScore) {
          return {
            success: false,
            message: "Tweet does not meet minimum engagement threshold",
            data: null,
          };
        }

        // Format the response
        const response = {
          tweetId: analysis.tweetId,
          sentiment: analysis.overallSentiment,
          communityInfluence: analysis.communityInfluence,
          possibleDeception: analysis.possibleDeception,
          strategies: analysis.detectedStrategies.map((s) => ({
            type: s.type,
            confidence: s.confidence,
            description: s.description,
          })),
          engagement: {
            replies: includeReplies ? analysis.replies.length : undefined,
            quotes: includeQuotes ? analysis.quotes.length : undefined,
          },
        };

        return {
          success: true,
          message: "Analysis completed successfully",
          data: response,
        };
      } catch (error) {
        logger.error("Twitter analysis error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Analysis failed",
          data: null,
        };
      }
    },
  });
};
