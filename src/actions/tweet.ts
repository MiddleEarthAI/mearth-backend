import { z } from "zod";
import { tool } from "ai";
import { Twitter } from "@/deps/twitter";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import natural from "natural";

interface TweetValidationResult {
  success: boolean;
  message: string;
  sentiment?: {
    score: number;
    comparative: number;
    tokens: string[];
    words: string[];
  };
}

/**
 * Validates and analyzes tweet content
 */
async function validateTweet(
  agentId: string,
  content: string
): Promise<TweetValidationResult> {
  // Check tweet length
  if (content.length > 280) {
    return {
      success: false,
      message: `Tweet is too long (${content.length}/280 characters)`,
    };
  }

  // Check for spam/repeated tweets
  const recentTweet = await prisma.tweet.findFirst({
    where: {
      agentId,
      content: {
        equals: content,
      },
      createdAt: {
        gte: new Date(Date.now() - 1 * 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentTweet) {
    return {
      success: false,
      message:
        "Similar tweet was posted recently. Please wait before repeating.",
    };
  }

  // Analyze sentiment
  const analyzer = new natural.SentimentAnalyzer(
    "English",
    natural.PorterStemmer,
    "afinn"
  );
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(content) || [];
  const sentiment = analyzer.getSentiment(tokens);

  return {
    success: true,
    message: "Tweet is valid",
    sentiment: {
      score: sentiment,
      comparative: tokens.length > 0 ? sentiment / tokens.length : 0,
      tokens,
      words: tokens.filter((token) => token.length > 1), // Filter out single characters
    },
  };
}

/**
 * Records tweet engagement metrics
 */
async function recordTweetEngagement(
  tweetId: string,
  authorFollowerCount: number
) {
  await prisma.tweetEngagement.create({
    data: {
      tweetId,
      likes: 0,
      impressions: Math.floor(authorFollowerCount * 0.3), // Estimate initial impressions
      comments: 0,
      retweets: 0,
      influencerImpact: authorFollowerCount > 1000 ? 1.5 : 1.0,
    },
  });
}

/**
 * Creates tweet feedback based on content analysis
 */
async function createTweetFeedback(
  tweetId: string,
  content: string,
  sentiment: TweetValidationResult["sentiment"]
) {
  // Extract potential coordinates from tweet
  const coordRegex = /\((\d+),\s*(\d+)\)/;
  const coordMatch = content.match(coordRegex);
  const coordinates = coordMatch
    ? {
        x: parseFloat(coordMatch[1]),
        y: parseFloat(coordMatch[2]),
      }
    : null;

  // Extract potential agent mentions
  const handleRegex = /@(\w+)/g;
  const mentionedHandles = content.match(handleRegex) || [];
  const targetAgent = mentionedHandles[0]?.slice(1); // First mentioned handle without @

  await prisma.tweetFeedback.create({
    data: {
      tweetId,
      suggestedAction: content.toLowerCase().includes("alliance")
        ? "FORM_ALLIANCE"
        : content.toLowerCase().includes("battle")
        ? "PREPARE_BATTLE"
        : "OBSERVE",
      targetAgent: targetAgent || "",
      coordinateX: coordinates?.x || 0,
      coordinateY: coordinates?.y || 0,
      confidence: sentiment?.comparative || 0,
      reasoning: `Sentiment score: ${sentiment?.score}, Words analyzed: ${sentiment?.words.length}`,
      sentiment:
        sentiment?.score && sentiment.score > 0
          ? "POSITIVE"
          : sentiment?.score && sentiment.score < 0
          ? "NEGATIVE"
          : "NEUTRAL",
    },
  });
}

export const tweetTool = function (agentId: string, twitter: Twitter | null) {
  return tool({
    description: `Strategic communication tool for Middle Earth agents:
      - Broadcast intentions and actions
      - Form alliances and declare battles
      - Share intelligence and locations
      - Influence community sentiment
      Tweets are analyzed for sentiment and strategic content.`,
    parameters: z.object({
      tweet: z
        .string()
        .max(280)
        .describe(
          "Strategic message to broadcast. Include coordinates as (x,y) and mention targets with @handle."
        ),
    }),
    execute: async ({ tweet }) => {
      try {
        // Get agent data
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: {
            name: true,
            twitterHandle: true,
            status: true,
          },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.status === "DEFEATED") {
          return {
            success: false,
            message: "Defeated agents cannot tweet",
          };
        }

        // Validate and analyze tweet
        const validation = await validateTweet(agentId, tweet);
        if (!validation.success) {
          return validation;
        }

        // Post tweet
        let twitterResponse = null;
        if (twitter) {
          twitterResponse = await twitter.postTweet(tweet);
        } else {
          logger.info("---------------TWEET-----------------");
          logger.info(`${agent.name} (@${agent.twitterHandle}): ${tweet}`);
          logger.info("-------------------------------------");
        }

        // Record tweet in database
        const dbTweet = await prisma.tweet.create({
          data: {
            agentId,
            content: tweet,
            tweetId: twitterResponse?.id || BigInt(Date.now()),
            authorFollowerCount: twitterResponse?.author_followers || 0,
          },
        });

        // Record engagement and feedback
        await Promise.all([
          recordTweetEngagement(dbTweet.id, dbTweet.authorFollowerCount),
          createTweetFeedback(dbTweet.id, tweet, validation.sentiment),
        ]);

        return {
          success: true,
          message: "Tweet posted successfully",
          tweet: dbTweet,
          sentiment: validation.sentiment,
        };
      } catch (error) {
        logger.error("Tweet error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to post tweet",
        };
      }
    },
  });
};
