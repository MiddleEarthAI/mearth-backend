import { logger } from "@/utils/logger";
import { TweetData, TwitterInteraction } from "@/types/twitter";
import { TwitterApi, UserV2 } from "twitter-api-v2";
import { twitterConfig } from "@/config/env";

export type AgentId = "1" | "2" | "3" | "4";

/**
 * Twitter API Manager class that handles API interactions with rate limiting
 * Manages multiple Twitter API clients and provides methods for tweet interactions
 */
class TwitterManager {
  private readonly _clients: Map<AgentId, TwitterApi>;
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
  private requestCount: number = 0;
  private client: TwitterApi;

  /**
   * Initializes Twitter Manager with API clients for each agent
   * @param agents Array of agent accounts
   * @param twitterConfig Twitter API configuration containing keys and tokens
   * @throws Error if API credentials are missing or invalid
   */
  constructor(agents: Array<{ account: { id: number } }>) {
    console.log("🚀 Initializing Twitter Manager...");
    this._clients = new Map();

    // Initialize Twitter clients for each agent
    for (const agent of agents) {
      const agentId = agent.account.id.toString() as AgentId;
      const agentConfig = twitterConfig.agents[agentId];

      if (
        !twitterConfig.apiKey ||
        !twitterConfig.apiSecret ||
        !agentConfig?.accessToken ||
        !agentConfig?.accessSecret
      ) {
        throw new Error(`Missing Twitter credentials for agent ${agentId}`);
      }

      this._clients.set(
        agentId,
        new TwitterApi({
          appKey: twitterConfig.apiKey,
          appSecret: twitterConfig.apiSecret,
          accessToken: agentConfig.accessToken,
          accessSecret: agentConfig.accessSecret,
        })
      );
    }

    // Validate all required clients exist
    if (
      !this._clients.has("1") ||
      !this._clients.has("2") ||
      !this._clients.has("3") ||
      !this._clients.has("4")
    ) {
      throw new Error("Missing required Twitter clients");
    }

    this.client = this._clients.get("1")!;
    console.log("✅ Twitter Manager initialized successfully");
  }

  async fetchTweetInteractions(
    tweetId: string,
    username?: string
  ): Promise<TwitterInteraction[]> {
    try {
      // Check rate limiting before making requests
      if (this.shouldThrottle()) {
        const backoffTime = this.calculateBackoff();
        await this.wait(backoffTime);
      }

      const interactions: TwitterInteraction[] = [];
      this.requestCount++;

      // Fetch replies
      const replies = await this.fetchTweetReplies(tweetId);
      console.log("🔍 Fetched replies:", replies);
      for (const reply of replies) {
        const user = await this.fetchUserInfo(
          this.client,
          reply.in_reply_to_user_id!
        );
        interactions.push({
          type: "reply",
          userId: user.id,
          username: user.username,
          tweetId: reply.id,
          content: reply.text,
          timestamp: new Date(reply.created_at!),
          userMetrics: {
            followerCount: user.public_metrics?.followers_count || 0,
            averageEngagement: await this.calculateAverageEngagementScore(
              reply
            ),
            accountAge: 0,
            verificationStatus: user.verified || false,
            reputationScore: 0,
          },
        });
      }

      // Check rate limiting between requests
      if (this.shouldThrottle()) {
        const backoffTime = this.calculateBackoff();
        await this.wait(backoffTime);
      }
      this.requestCount++;

      // Fetch quotes
      // const quotes = await this.fetchTweetQuotes(tweetId);
      // for (const quote of quotes) {
      //   const user = await this.fetchUserInfo(this.client, quote.author_id!);
      //   interactions.push({
      //     type: "quote",
      //     userId: user.id,
      //     username: user.username,
      //     tweetId: quote.id,
      //     content: quote.text,
      //     timestamp: new Date(quote.created_at!),
      //     userMetrics: {
      //       followerCount: user.public_metrics?.followers_count || 0,
      //       averageEngagement: await this.calculateAverageEngagementScore(
      //         quote
      //       ),
      //       accountAge: 0,
      //       verificationStatus: user.verified || false,
      //       reputationScore: 0,
      //     },
      //   });
      // }

      // // Check rate limiting between requests
      // if (this.shouldThrottle()) {
      //   const backoffTime = this.calculateBackoff();
      //   await this.wait(backoffTime);
      // }
      // this.requestCount++;

      // // Fetch mentions
      // const mentions = await this.fetchUserMentions(username);
      // for (const mention of mentions) {
      //   // Skip if the mention is already counted as a reply or quote
      //   if (interactions.some((i) => i.tweetId === mention.id)) continue;

      //   const user = await this.fetchUserInfo(this.client, mention.author_id!);
      //   interactions.push({
      //     type: "mention",
      //     userId: user.id,
      //     username: user.username,
      //     tweetId: mention.id,
      //     content: mention.text,
      //     timestamp: new Date(mention.created_at!),
      //     userMetrics: {
      //       followerCount: user.public_metrics?.followers_count || 0,
      //       averageEngagement: await this.calculateAverageEngagementScore(
      //         mention
      //       ),
      //       accountAge: 0,
      //       verificationStatus: user.verified || false,
      //       reputationScore: 0,
      //     },
      //   });
      // }

      return interactions;
    } catch (error) {
      logger.error("Error fetching tweet interactions:", error);
      throw error;
    }
  }

  async postTweet(agentId: AgentId, content: string) {
    // Check rate limiting before posting
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    const agentClient = this._clients.get(agentId);
    if (!agentClient) {
      console.error("❌ Error: Client not found for agentId", agentId);
      throw new Error(`Client for agent Id ${agentId} not found`);
    }

    console.log("📝 Posting new tweet...");
    return agentClient.v2
      .tweet(content, {})
      .then(() => {
        console.log("✅ Tweet posted successfully");
      })
      .catch((error) => {
        console.error("❌ Failed to post tweet", error);
        throw error;
      });
  }

  async fetchRecentTweets(agentId: AgentId, count: number) {
    // Check rate limiting before fetching
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    const agentClient = this._clients.get(agentId);
    if (!agentClient) {
      console.error("❌ Error: Client not found for agentId", agentId);
      throw new Error(`Client for agent Id ${agentId} not found`);
    }
    const me = await agentClient.v2.me();
    console.log("🔍 Fetching tweets for agent", me);

    return await agentClient?.v2.userTimeline(me.data.id, {
      max_results: count,
      "tweet.fields": [
        "created_at",
        "public_metrics",
        "text",
        "conversation_id",
        "in_reply_to_user_id",
      ],
      "user.fields": ["name", "username", "verified", "profile_image_url"],
      expansions: [
        "author_id",
        "referenced_tweets.id",
        "in_reply_to_user_id",
        "attachments.media_keys",
      ],
    });
  }

  async fetchTweetReplies(tweetId: string): Promise<TweetData[]> {
    // Check rate limiting before fetching
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    try {
      const replies = await this.client.v2.search(
        `conversation_id:${tweetId} is:reply`,
        {
          "tweet.fields": [
            "created_at",
            "public_metrics",
            "text",
            "conversation_id",
            "in_reply_to_user_id",
            "referenced_tweets",
          ],
          "user.fields": ["name", "username", "verified", "public_metrics"],
          expansions: ["author_id", "referenced_tweets.id"],
        }
      );

      return replies.data.data || [];
    } catch (error) {
      logger.error("Error fetching replies:", error);
      throw error;
    }
  }

  async fetchTweetQuotes(tweetId: string): Promise<TweetData[]> {
    // Check rate limiting before fetching
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    try {
      const quotes = await this.client.v2.quotes(tweetId, {
        "tweet.fields": [
          "created_at",
          "public_metrics",
          "text",
          "conversation_id",
          "in_reply_to_user_id",
          "referenced_tweets",
          "author_id",
        ],
        "user.fields": ["name", "username", "verified", "public_metrics"],
        expansions: ["author_id", "referenced_tweets.id"],
      });

      return quotes.data.data || [];
    } catch (error) {
      logger.error("Error fetching quotes:", error);
      throw error;
    }
  }

  async fetchUserMentions(
    username: string,
    count: number = 100
  ): Promise<TweetData[]> {
    // Check rate limiting before fetching
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    try {
      const mentions = await this.client.v2.search(`@${username}`, {
        max_results: count,
        "tweet.fields": [
          "created_at",
          "public_metrics",
          "text",
          "conversation_id",
          "in_reply_to_user_id",
          "referenced_tweets",
          "author_id",
        ],
        "user.fields": ["name", "username", "verified", "public_metrics"],
        expansions: ["author_id", "referenced_tweets.id"],
      });

      return mentions.data.data || [];
    } catch (error) {
      logger.error("Error fetching mentions:", error);
      throw error;
    }
  }

  async fetchTweetById(tweetId: string): Promise<TweetData> {
    // Check rate limiting before fetching
    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      await this.wait(backoffTime);
    }
    this.requestCount++;

    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        "tweet.fields": [
          "created_at",
          "public_metrics",
          "text",
          "conversation_id",
          "in_reply_to_user_id",
          "referenced_tweets",
        ],
      });

      if (!tweet.data) {
        throw new Error(`Tweet ${tweetId} not found`);
      }

      return tweet.data;
    } catch (error) {
      logger.error("Error fetching tweet:", error);
      throw error;
    }
  }

  async fetchUserInfo(client: TwitterApi, username: string): Promise<UserV2> {
    try {
      const user = await client.v2.userByUsername(username, {
        "user.fields": [
          "created_at",
          "description",
          "public_metrics",
          "verified",
          "profile_image_url",
        ],
      });

      if (!user.data) {
        throw new Error(`User ${username} not found`);
      }

      return user.data;
    } catch (error) {
      logger.error("Error fetching user info:", error);
      throw error;
    }
  }

  /**
   * Calculates engagement score for a tweet based on interactions
   * @param tweet - Tweet data
   * @param interactions - Array of tweet interactions
   * @returns Engagement score between 0 and 1
   */
  async calculateEngagementScore(
    tweet: TweetData,
    interactions: TwitterInteraction[]
  ): Promise<number> {
    if (!tweet.public_metrics) return 0;

    const metrics = tweet.public_metrics;

    const totalEngagement =
      metrics.like_count +
      metrics.retweet_count +
      metrics.reply_count +
      metrics.quote_count;

    const verifiedInteractions = interactions.filter(
      (i) => i.userMetrics.verificationStatus
    ).length;
    const highFollowerInteractions = interactions.filter(
      (i) => i.userMetrics.followerCount > 10000
    ).length;

    // Weight different factors
    const engagementWeight = 0.5;
    const verifiedWeight = 0.3;
    const followerWeight = 0.2;

    const engagementScore =
      Math.min(totalEngagement / 1000, 1) * engagementWeight;
    const verifiedScore =
      (verifiedInteractions / interactions.length) * verifiedWeight;
    const followerScore =
      (highFollowerInteractions / interactions.length) * followerWeight;

    return engagementScore + verifiedScore + followerScore;
  }

  async calculateAverageEngagementScore(tweetData: TweetData): Promise<number> {
    if (!tweetData.public_metrics) return 0;

    const metrics = tweetData.public_metrics;
    const totalEngagement =
      metrics.like_count +
      metrics.retweet_count +
      metrics.reply_count +
      metrics.quote_count;

    // Calculate average engagement as percentage of total possible engagement
    // Normalize to value between 0-1
    const averageScore = Math.min(totalEngagement / 1000, 1);

    return averageScore;
  }

  /**
   * Checks if the current request count has reached the rate limit threshold
   * @returns boolean indicating if requests should be throttled
   */
  private shouldThrottle(): boolean {
    const shouldThrottle = this.requestCount >= 450;
    if (shouldThrottle) {
      console.log("⚠️ Rate limit threshold reached");
    }
    return shouldThrottle;
  }

  /**
   * Calculates exponential backoff time based on request count
   * @returns number of milliseconds to wait
   */
  private calculateBackoff(): number {
    const backoff = Math.min(
      Math.pow(2, this.requestCount - 450) * 1000,
      this.RATE_LIMIT_WINDOW
    );
    console.log(`⏱️ Calculated backoff time: ${backoff}ms`);
    return backoff;
  }

  /**
   * Utility method to pause execution for specified duration
   * @param ms Number of milliseconds to wait
   */
  private async wait(ms: number): Promise<void> {
    console.log(`⏳ Waiting for ${ms}ms...`);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reconnects Twitter clients in case of connection issues
   * Attempts to reestablish connections for all agents
   */
  async reconnect(): Promise<void> {
    try {
      // Store current clients for cleanup
      const oldClients = new Map(this._clients);

      // Clear current clients
      this._clients.clear();

      // Reconnect each client
      for (const [agentId, client] of oldClients) {
        const newClient = await this.createNewClient(agentId);
        this._clients.set(agentId, newClient);
      }

      logger.info("Successfully reconnected Twitter clients");
    } catch (error) {
      logger.error("Failed to reconnect Twitter clients", { error });
      throw error;
    }
  }

  /**
   * Gracefully disconnects all Twitter clients
   * Ensures proper cleanup of resources
   */
  async disconnect(): Promise<void> {
    try {
      // Clear all clients
      this._clients.clear();
      logger.info("Successfully disconnected Twitter clients");
    } catch (error) {
      logger.error("Failed to disconnect Twitter clients", { error });
      throw error;
    }
  }

  /**
   * Creates a new Twitter client for an agent
   */
  private async createNewClient(agentId: AgentId): Promise<TwitterApi> {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env[`TWITTER_ACCESS_TOKEN_${agentId}`];
    const accessSecret = process.env[`TWITTER_ACCESS_TOKEN_SECRET_${agentId}`];

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error(`Missing Twitter credentials for agent ${agentId}`);
    }

    return new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken,
      accessSecret,
    });
  }
}

export default TwitterManager;
