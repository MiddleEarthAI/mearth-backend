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
  private client: TwitterApi | null = null;
  private engagementAnalyzer: TwitterEngagementAnalyzer | null = null;
  private user: UserV2Result | null = null;
  private retryLimit = 3;
  constructor(private readonly config: TwitterClientConfig) {
    this.init();
  }

  /**
   * Initialize the Twitter client with provided credentials
   */
  async init(): Promise<void> {
    const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
    const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

    if (
      !TWITTER_API_KEY ||
      !TWITTER_API_SECRET ||
      !this.config.accessToken ||
      !this.config.accessSecret
    ) {
      throw new Error("Twitter credentials not found");
    }

    try {
      this.client = new TwitterApi({
        appKey: TWITTER_API_KEY,
        appSecret: TWITTER_API_SECRET,
        accessToken: this.config.accessToken,
        accessSecret: this.config.accessSecret,
      });

      this.engagementAnalyzer = new TwitterEngagementAnalyzer(this.client);
      this.user = await this.client.v2.me();

      if (!this.user) {
        throw new Error("Failed to load Twitter user");
      }

      logger.info(
        `Twitter client initialized for agent ${this.config.agentId}`
      );
    } catch (error) {
      logger.error("Twitter client initialization error:", error);
      throw error;
    }
  }

  /**
   * Post a tweet with retry mechanism and error handling
   */
  async postTweet(content: string): Promise<void> {
    if (!this.client) {
      throw new Error("Twitter client not initialized");
    }

    try {
      if (!content || content.length > 280) {
        throw new Error(`Invalid tweet length: ${content?.length}`);
      }

      let retries = this.retryLimit;
      while (retries > 0) {
        try {
          await this.client.v2.tweet(content);
        } catch (error) {
          logger.error(
            `Tweet attempt failed (${retries} retries left):`,
            error
          );
          retries--;
          if (retries === 0) throw error;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      logger.error("Tweet posting error:", error);
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

  async getOwnTweets() {
    if (!this.client || !this.user) {
      throw new Error("Twitter client or user not initialized");
    }
    return this.client.v2.tweets(this.user.data.id);
  }

  /**
   * Get the client's user information
   */
  getProfile() {
    return this.user;
  }

  getAgentId() {
    return this.config.agentId;
  }
}
