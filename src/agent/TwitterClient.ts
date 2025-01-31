import { logger } from "@/utils/logger";

import { TwitterApi, type UserV2Result } from "twitter-api-v2";
import TwitterEngagementAnalyzer from "./EngagementAnalyzer";

export interface TwitterClientConfig {
  agentId: number;
  accessToken: string;
  accessSecret: string;
}

/**
 * Represents an individual Twitter client instance
 * Handles authentication, tweet operations, and engagement analysis for a single agent
 */
export class TwitterClient {
  private client: TwitterApi;
  private engagementAnalyzer: TwitterEngagementAnalyzer | null = null;
  private user: UserV2Result | null = null;
  private agentId: number;
  private dryRun: boolean = true;

  constructor(config: TwitterClientConfig) {
    const { agentId, accessToken, accessSecret } = config;

    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error("Twitter API credentials not configured");
    }

    this.agentId = agentId;

    // Create client with user context
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    this.init();
  }

  /**
   * Initialize the Twitter client with provided credentials
   */
  async init(): Promise<void> {
    try {
      this.engagementAnalyzer = new TwitterEngagementAnalyzer(this.client);
      this.user = await this.client.v2.me();

      if (!this.user) {
        throw new Error("Failed to load Twitter user");
      }

      logger.info(`Twitter client initialized for agent ${this.agentId}`);
    } catch (error) {
      logger.error("Twitter client initialization error:", error);
      throw error;
    }
  }

  /**
   * Post a tweet with retry mechanism and error handling
   */
  async postTweet(content: string): Promise<string> {
    try {
      if (this.dryRun) {
        logger.info(
          `🐦 Agent ${this.agentId} dry run posting tweet: ${content}`
        );
        return "dry-run-tweet-id";
      }

      const tweet = await this.client.v2.tweet(content);

      logger.info(`✅ Tweet posted successfully`, {
        agentId: this.agentId,
        tweetId: tweet.data.id,
      });

      return tweet.data.id;
    } catch (error) {
      logger.error(`Failed to post tweet for agent ${this.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze engagement for a specific tweet
   */
  async analyzeEngagement(tweetId: string) {
    if (!this.engagementAnalyzer) {
      throw new Error("Engagement analyzer not initialized");
    }
    return this.engagementAnalyzer.analyzeEngagement(tweetId);
  }

  /**
   * Get agent's own tweets
   */
  async getOwnTweets(maxResults: number = 10) {
    try {
      const tweets = await this.client.v2.userTimeline(this.user!.data.id, {
        max_results: maxResults,
        "tweet.fields": ["created_at", "public_metrics"],
      });

      return tweets;
    } catch (error) {
      logger.error(`Failed to fetch tweets for agent ${this.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get the client's user information
   */
  getProfile() {
    return this.user;
  }

  getAgentId() {
    return this.agentId;
  }

  /**
   * Follow another user
   */
  async followUser(userId: string) {
    try {
      const me = await this.client.v2.me();
      await this.client.v2.follow(me.data.id, userId);

      logger.info(`✅ Successfully followed user`, {
        agentId: this.agentId,
        targetUserId: userId,
      });
    } catch (error) {
      logger.error(`Failed to follow user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(maxResults: number = 100) {
    try {
      const followers = await this.client.v2.followers(this.user!.data.id, {
        max_results: maxResults,
        "user.fields": ["public_metrics"],
      });

      return followers;
    } catch (error) {
      logger.error(
        `Failed to fetch followers for agent ${this.agentId}:`,
        error
      );
      throw error;
    }
  }
}

// Helper function to calculate influence score
function calculateInfluence(metrics: any): number {
  if (!metrics) return 0;

  const {
    reply_count = 0,
    retweet_count = 0,
    like_count = 0,
    quote_count = 0,
  } = metrics;

  // Weight different engagement types
  const weights = {
    reply: 2, // Replies show more engagement
    retweet: 1.5, // Retweets show good reach
    like: 1, // Likes show basic engagement
    quote: 2.5, // Quotes show high engagement
  };

  const totalEngagement =
    reply_count * weights.reply +
    retweet_count * weights.retweet +
    like_count * weights.like +
    quote_count * weights.quote;

  // Normalize to 0-1 range (you can adjust the denominator based on your needs)
  return Math.min(totalEngagement / 1000, 1);
}
