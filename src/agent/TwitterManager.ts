import { TweetData, TwitterInteraction } from "@/types/twitter";
import {
  QuotedTweetsTimelineV2Paginator,
  TweetUserMentionTimelineV2Paginator,
  TwitterApi,
  UserV2,
} from "twitter-api-v2";
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
   * @param agentIds Array of agent accounts
   * @throws Error if API credentials are missing or invalid
   */
  constructor() {
    console.log("🚀 Initializing Twitter Manager...");
    this._clients = new Map();

    // Initialize Twitter clients for each agent onchainId
    for (const id of ["1", "2", "3", "4"] as AgentId[]) {
      const agentConfig = twitterConfig.agents[id];

      if (
        !twitterConfig.apiKey ||
        !twitterConfig.apiSecret ||
        !agentConfig?.accessToken ||
        !agentConfig?.accessSecret
      ) {
        throw new Error(`Missing Twitter credentials for agent ${id}`);
      }

      this._clients.set(
        id,
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

  async fetchTweetInteractions(tweetId: string): Promise<TwitterInteraction[]> {
    try {
      // Check rate limiting before making requests
      if (this.shouldThrottle()) {
        const backoffTime = this.calculateBackoff();
        await this.wait(backoffTime);
      }

      const interactions: TwitterInteraction[] = [];
      this.requestCount++;

      // Fetch replies with author expansion
      const replies = await this.client.v2.search(
        `conversation_id:${tweetId}`,
        {
          "tweet.fields": [
            "created_at",
            "author_id",
            "in_reply_to_user_id",
            "referenced_tweets",
          ],
          "user.fields": [
            "created_at",
            "public_metrics",
            "verified",
            "protected",
          ],
          expansions: ["author_id", "referenced_tweets.id"], // Include author info directly
        }
      );

      console.log("🔍 Fetched replies:", replies);

      for (const reply of replies.data.data || []) {
        // Get author info from the includes
        const author = replies.includes?.users?.find(
          (u) => u.id === reply.author_id
        );
        console.log("raw reply", reply.referenced_tweets?.[0]);
        console.log("users", replies.includes?.users);

        if (!author) {
          console.warn(
            `⚠️ No author info found for reply ${reply.id}, skipping`
          );
          continue;
        }

        interactions.push({
          type: "reply",
          userId: author.id,
          username: author.username,
          tweetId: reply.id,
          content: reply.text,
          authorId: reply.author_id,
          timestamp: new Date(reply.created_at || Date.now()),
          userMetrics: {
            followerCount: author.public_metrics?.followers_count || 0,
            likeCount: author.public_metrics?.like_count || 0,
            followingCount: author.public_metrics?.following_count || 0,
            tweetCount: author.public_metrics?.tweet_count || 0,
            listedCount: author.public_metrics?.listed_count || 0,
            accountAge: author.created_at
              ? new Date().getTime() - new Date(author.created_at).getTime()
              : 0,
            verified: author.verified || false,
            reputationScore: 0,
          },
        });
      }

      // Similar changes for quotes...
      const quotes = await this.client.v2.quotes(tweetId, {
        "tweet.fields": ["created_at", "author_id", "referenced_tweets"],
        "user.fields": [
          "created_at",
          "public_metrics",
          "verified",
          "protected",
        ],
        expansions: ["author_id", "referenced_tweets.id"],
      });

      for (const quote of quotes.data.data || []) {
        const author = quotes.includes?.users?.find(
          (u) => u.id === quote.author_id
        );

        if (!author) {
          console.warn(
            `⚠️ No author info found for quote ${quote.id}, skipping`
          );
          continue;
        }

        interactions.push({
          type: "quote",
          userId: author.id,
          username: author.username,
          tweetId: quote.id,
          content: quote.text,
          timestamp: new Date(quote.created_at || Date.now()),
          authorId: quote.author_id,
          userMetrics: {
            followerCount: author.public_metrics?.followers_count || 0,
            followingCount: author.public_metrics?.following_count || 0,
            likeCount: author.public_metrics?.like_count || 0,
            tweetCount: author.public_metrics?.tweet_count || 0,
            listedCount: author.public_metrics?.listed_count || 0,
            accountAge: author.created_at
              ? new Date().getTime() - new Date(author.created_at).getTime()
              : 0,
            verified: author.verified || false,
            reputationScore: 0,
          },
        });
      }

      return interactions;
    } catch (error) {
      console.error("Error fetching tweet interactions:", error);
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
      .then((tweet) => {
        console.log("✅ Tweet posted successfully", tweet);
        return tweet;
      })
      .catch((error) => {
        console.error("❌ Failed to post tweet", error);
        throw error;
      });
  }

  // /**
  //  * Fetches tweets from the past hour for a specific agent
  //  * @param agentId - The ID of the agent whose tweets we want to fetch
  //  * @param count - Maximum number of tweets to return (default: 100)
  //  * @returns A paginated timeline of tweets from the past hour
  //  */
  // async fetchTweetsFromPastHour(agentId: AgentId, count: number = 100) {
  //   // Check rate limiting before fetching
  //   if (this.shouldThrottle()) {
  //     const backoffTime = this.calculateBackoff();
  //     await this.wait(backoffTime);
  //   }
  //   this.requestCount++;

  //   const agentClient = this._clients.get(agentId);
  //   if (!agentClient) {
  //     console.error("❌ Error: Client not found for agentId", agentId);
  //     throw new Error(`Client for agent Id ${agentId} not found`);
  //   }

  //   try {
  //     console.log("🔍 Fetching tweets from the past hour...");
  //     const me = await agentClient.v2.me();

  //     // Calculate timestamps
  //     const endTime = new Date();
  //     const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

  //     const timeline = await agentClient.v2.userTimeline(me.data.id, {
  //       max_results: Math.min(count, 100), // Twitter API v2 has a max limit of 100
  //       start_time: startTime.toISOString(),
  //       end_time: endTime.toISOString(),
  //       "tweet.fields": [
  //         "created_at",
  //         "public_metrics",
  //         "text",
  //         "conversation_id",
  //         "in_reply_to_user_id",
  //         "referenced_tweets",
  //       ],
  //       "user.fields": [
  //         "name",
  //         "username",
  //         "verified",
  //         "profile_image_url",
  //         "public_metrics", // Added this to get follower counts etc.
  //       ],
  //       expansions: [
  //         "author_id",
  //         "referenced_tweets.id",
  //         "in_reply_to_user_id",
  //         "attachments.media_keys",
  //       ],
  //     });
  //     return timeline.data.data || null;
  //   } catch (error) {
  //     console.error("❌ Error fetching tweets from past hour:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Fetches replies to a specific tweet
  //  * @param tweetId - The ID of the tweet to fetch replies for
  //  * @returns Promise<TweetData[]> Array of reply tweets
  //  */
  // async fetchTweetReplies(tweetId: string): Promise<TweetData[]> {
  //   // Check rate limiting before fetching
  //   if (this.shouldThrottle()) {
  //     const backoffTime = this.calculateBackoff();
  //     await this.wait(backoffTime);
  //   }
  //   this.requestCount++;

  //   try {
  //     // First get the tweet to ensure we have the conversation ID
  //     const tweet = await this.client.v2.singleTweet(tweetId, {
  //       "tweet.fields": ["conversation_id"],
  //     });

  //     if (!tweet.data) {
  //       throw new Error(`Tweet ${tweetId} not found`);
  //     }

  //     // Then get all replies in the conversation
  //     const replies = await this.client.v2.search(
  //       `conversation_id:${tweet.data.conversation_id}
  //            in_reply_to_tweet_id:${tweetId}`, // This ensures we only get direct replies
  //       {
  //         "tweet.fields": [
  //           "created_at",
  //           "public_metrics",
  //           "text",
  //           "conversation_id",
  //           "in_reply_to_user_id",
  //           "referenced_tweets",
  //         ],
  //         "user.fields": ["name", "username", "verified", "public_metrics"],
  //         expansions: [
  //           "author_id",
  //           "referenced_tweets.id",
  //           "in_reply_to_user_id",
  //         ],
  //       }
  //     );

  //     return replies.data.data || [];
  //   } catch (error) {
  //     console.error("Error fetching replies:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Fetches quotes (retweets with comments) of a specific tweet
  //  * @param tweetId - The ID of the tweet to fetch quotes for
  //  * @param usePagination - Whether to return a paginator for handling large numbers of quotes
  //  * @returns Promise<TweetData[]> Array of quote tweets or a paginator
  //  */
  // async fetchTweetQuotes(
  //   tweetId: string,
  //   usePagination: boolean = false
  // ): Promise<TweetData[] | QuotedTweetsTimelineV2Paginator> {
  //   // Check rate limiting before fetching
  //   if (this.shouldThrottle()) {
  //     const backoffTime = this.calculateBackoff();
  //     await this.wait(backoffTime);
  //   }
  //   this.requestCount++;

  //   try {
  //     const quotes = await this.client.v2.quotes(tweetId, {
  //       "tweet.fields": [
  //         "created_at",
  //         "public_metrics",
  //         "text",
  //         "conversation_id",
  //         "in_reply_to_user_id",
  //         "referenced_tweets",
  //         "author_id",
  //       ],
  //       "user.fields": ["name", "username", "verified", "public_metrics"],
  //       expansions: ["author_id", "referenced_tweets.id"],
  //     });

  //     // Return paginator if requested
  //     if (usePagination) {
  //       return quotes;
  //     }

  //     // Otherwise return just the data array
  //     return quotes.data.data || [];
  //   } catch (error) {
  //     console.error("Error fetching quotes:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Fetches tweets that mention a specific user
  //  * @param userId - The ID of the user to fetch mentions for
  //  * @param count - Maximum number of mentions to return (default: 100)
  //  * @param usePagination - Whether to return a paginator for handling large numbers of mentions
  //  * @returns Promise<TweetData[] | TweetUserMentionTimelineV2Paginator>
  //  */
  // async fetchUserMentions(
  //   userId: string,
  //   count: number = 100,
  //   usePagination: boolean = false
  // ): Promise<TweetData[] | TweetUserMentionTimelineV2Paginator> {
  //   // Check rate limiting before fetching
  //   if (this.shouldThrottle()) {
  //     const backoffTime = this.calculateBackoff();
  //     await this.wait(backoffTime);
  //   }
  //   this.requestCount++;

  //   try {
  //     const mentions = await this.client.v2.userMentionTimeline(userId, {
  //       max_results: Math.min(count, 100), // Ensure we don't exceed Twitter's limit
  //       "tweet.fields": [
  //         "created_at",
  //         "public_metrics",
  //         "text",
  //         "conversation_id",
  //         "in_reply_to_user_id",
  //         "referenced_tweets",
  //         "author_id",
  //       ],
  //       "user.fields": [
  //         "name",
  //         "username",
  //         "verified",
  //         "public_metrics",
  //         "profile_image_url", // Added this for user avatars
  //       ],
  //       expansions: [
  //         "author_id",
  //         "referenced_tweets.id",
  //         "in_reply_to_user_id", // Added this to track reply chains
  //       ],
  //     });

  //     // Return paginator if requested
  //     if (usePagination) {
  //       return mentions;
  //     }

  //     // Otherwise return just the data array
  //     return mentions.data.data || [];
  //   } catch (error) {
  //     console.error("❌ Error fetching user mentions:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Fetches a single tweet by its ID
  //  * @param tweetId - The ID of the tweet to fetch
  //  * @returns Promise<TweetData> The tweet data
  //  */
  // async fetchTweetById(tweetId: string): Promise<TweetData> {
  //   // Check rate limiting before fetching
  //   if (this.shouldThrottle()) {
  //     const backoffTime = this.calculateBackoff();
  //     await this.wait(backoffTime);
  //   }
  //   this.requestCount++;

  //   try {
  //     const tweet = await this.client.v2.singleTweet(tweetId, {
  //       "tweet.fields": [
  //         "created_at",
  //         "public_metrics",
  //         "text",
  //         "conversation_id",
  //         "in_reply_to_user_id",
  //         "referenced_tweets",
  //         "author_id", // Added to know who wrote the tweet
  //         "attachments", // Added for media attachments
  //         "context_annotations", // Added for tweet context
  //       ],
  //       "user.fields": [
  //         // Added user fields
  //         "name",
  //         "username",
  //         "verified",
  //         "profile_image_url",
  //       ],
  //       expansions: [
  //         // Added expansions
  //         "author_id",
  //         "referenced_tweets.id",
  //         "attachments.media_keys",
  //       ],
  //     });

  //     if (!tweet.data) {
  //       throw new Error(`Tweet ${tweetId} not found`);
  //     }

  //     return tweet.data;
  //   } catch (error) {
  //     console.error("❌ Error fetching tweet:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Fetches user information by ID or username
  //  * @param client - TwitterApi client instance
  //  * @param identifier - The user ID or username to fetch info for
  //  * @param isId - Whether the identifier is a user ID (true) or username (false)
  //  * @returns Promise<UserV2> The user data
  //  */
  // async fetchUserInfo(
  //   client: TwitterApi,
  //   identifier: string,
  //   isId: boolean = false
  // ): Promise<UserV2> {
  //   try {
  //     const user = isId
  //       ? await client.v2.user(identifier, {
  //           "user.fields": [
  //             "created_at",
  //             "description",
  //             "public_metrics",
  //             "verified",
  //             "profile_image_url",
  //             "protected",
  //             "location",
  //             "url",
  //             "entities",
  //             "pinned_tweet_id",
  //           ],
  //           expansions: ["pinned_tweet_id"],
  //         })
  //       : await client.v2.userByUsername(identifier, {
  //           "user.fields": [
  //             "created_at",
  //             "description",
  //             "public_metrics",
  //             "verified",
  //             "profile_image_url",
  //             "protected",
  //             "location",
  //             "url",
  //             "entities",
  //             "pinned_tweet_id",
  //           ],
  //           expansions: ["pinned_tweet_id"],
  //         });

  //     if (!user.data) {
  //       throw new Error(`User ${identifier} not found`);
  //     }

  //     return user.data;
  //   } catch (error) {
  //     console.error("❌ Error fetching user info:", error);
  //     throw error;
  //   }
  // }

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
   * Creates a new Twitter client for an agent
   */
  private async createNewClient(agentId: AgentId): Promise<TwitterApi> {
    const agentConfig = twitterConfig.agents[agentId];

    if (
      !twitterConfig.apiKey ||
      !twitterConfig.apiSecret ||
      !agentConfig?.accessToken ||
      !agentConfig?.accessSecret
    ) {
      throw new Error(`Missing Twitter credentials for agent ${agentId}`);
    }

    return new TwitterApi({
      appKey: twitterConfig.apiKey,
      appSecret: twitterConfig.apiSecret,
      accessToken: agentConfig.accessToken,
      accessSecret: agentConfig.accessSecret,
    });
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
      for (const agentId of ["1", "2", "3", "4"] as AgentId[]) {
        const newClient = await this.createNewClient(agentId);
        this._clients.set(agentId, newClient);
      }

      // Set default client
      this.client = this._clients.get("1")!;

      console.info("Successfully reconnected Twitter clients");
    } catch (error) {
      console.error("Failed to reconnect Twitter clients", { error });
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
      console.info("Successfully disconnected Twitter clients");
    } catch (error) {
      console.error("Failed to disconnect Twitter clients", { error });
      throw error;
    }
  }
}

export default TwitterManager;
