import { tool } from "ai";
import { z } from "zod";
import type { TwitterClient } from "@/agent/TwitterClient";

export enum TweetType {
  BattleReport = "Battle Report",
  AllianceProposal = "Alliance Proposal",
  TerritoryClaim = "Territory Claim",
  StrategicUpdate = "Strategic Update",
  StatusUpdate = "Status Update",
  CommunityEngagement = "Community Engagement",
}

/**
 * Tool for agents to post tweets and engage with the community
 */
export const tweetTool = (twitterClient: TwitterClient | null) =>
  tool({
    description: `Strategic communication tool for posting tweets in Middle Earth.
  
Available Tweet Types:
${Object.values(TweetType)
  .map((type) => `- ${type}`)
  .join("\n")}

Features:
- Post original tweets`,

    parameters: z.object({
      content: z
        .string()
        // .max(300)
        .describe(
          "The main content of the tweet. Should be 280 characters or less."
        ),
      type: z.nativeEnum(TweetType).describe("The type of tweet to post"),
    }),

    execute: async ({ content, type }) => {
      if (!twitterClient) {
        throw new Error("Twitter client not configured");
      }

      try {
        // Add hashtags based on tweet type
        const hashtags = getHashtagsForType(type);
        const tweet = `${content}\n\n${hashtags}`.trim();

        // Post the tweet
        const result = await twitterClient.postTweet(tweet);

        return {
          success: true,
          tweetId: result,
          url: `https://twitter.com/status/${result}`,
          content: tweet,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to post tweet"
        );
      }
    },
  });

function getHashtagsForType(type: TweetType): string {
  const hashtagMap = {
    [TweetType.BattleReport]: "#MiddleEarthBattle #BattleReport",
    [TweetType.AllianceProposal]: "#MiddleEarthAlliance",
    [TweetType.TerritoryClaim]: "#MiddleEarthTerritory",
    [TweetType.StrategicUpdate]: "#MiddleEarthStrategy",
    [TweetType.StatusUpdate]: "#MiddleEarthUpdate",
    [TweetType.CommunityEngagement]: "#MiddleEarthCommunity",
  };
  return hashtagMap[type];
}
