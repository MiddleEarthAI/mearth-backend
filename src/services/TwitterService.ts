import { EventEmitter } from "node:events";
import { prisma } from "@/config/prisma";
import type { ITwitter } from "@/types";
import { logger } from "@/utils/logger";
import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { Profile, Scraper, SearchMode, type Tweet } from "agent-twitter-client";
import NodeCache from "node-cache";

// Extended Tweet type to include additional properties
interface ExtendedTweet extends Tweet {
  authorFollowerCount?: number;
  impressions?: number;
  favoriteCount?: number;
  retweetCount?: number;
  replyCount?: number;
}

/**
 * Configuration for Twitter authentication and behavior
 */
export class TwitterConfig {
  public username: string;
  public password: string;
  public email: string;
  public twitter2faSecret: string;

  public agentId: number;
  public pollInterval: number; // in minutes
  public targetUsers: string[];

  constructor(config: {
    username: string;
    password: string;
    email: string;
    twitter2faSecret: string;
    agentId: number;
    pollInterval?: number;
    targetUsers?: string[];
  }) {
    this.username = config.username;
    this.password = config.password;
    this.email = config.email;
    this.twitter2faSecret = config.twitter2faSecret;
    this.agentId = config.agentId;
    this.pollInterval = config.pollInterval || 5; // Default 5 minutes
    this.targetUsers = config.targetUsers || [];
  }
}

/**
 * Represents the influence level of a social interaction
 */
interface SocialInfluence {
  authorFollowerCount: number;
  impressions: number;
  likes: number;
  retweets: number;
  comments: number;
  sentiment: "positive" | "negative" | "neutral";
  influenceScore: number;
}

/**
 * Represents a suggested action from social feedback
 */
interface SocialSuggestion {
  action: "move" | "battle" | "alliance" | "ignore";
  targetAgent?: string;
  coordinates?: { x: number; y: number };
  confidence: number;
  influence: SocialInfluence;
  reasoning: string;
}

/**
 * Service for handling Twitter interactions and social influence
 */
export class TwitterService extends EventEmitter implements ITwitter {
  private client: Scraper;
  private isRunning = false;
  private lastCheckedId = "0";
  public cache: NodeCache;
  public profile: Profile | null = null;

  constructor(
    public readonly anthropic: AnthropicProvider,
    private readonly config: TwitterConfig
  ) {
    super();
    this.client = new Scraper();
    this.cache = new NodeCache();
  }

  /**
   * Initialize Twitter connection and start monitoring
   */
  async init(): Promise<void> {
    try {
      await this.client.login(
        this.config.username,
        this.config.password,
        this.config.email,
        this.config.twitter2faSecret
      );

      if (await this.client.isLoggedIn()) {
        logger.info(`Twitter initialized for agent ${this.config.agentId}`);
        await this.startMonitoring();
      } else {
        throw new Error("Failed to login to Twitter");
      }
    } catch (error) {
      logger.error("Twitter initialization failed:", error);
      throw error;
    }
  }

  /**
   * Post a tweet with the given content
   */
  async postTweet(content: string, agentUsername: string): Promise<void> {
    try {
      // Store the tweet in the database first
      const tweet = await prisma.tweet.create({
        data: {
          content,
          agentId: this.config.agentId.toString(),
          tweetId: BigInt(Date.now()), // Use timestamp as placeholder ID in test mode
          authorFollowerCount: 0, // Default value for test mode
        },
      });

      // Log the tweet since we can't post directly in test mode
      logger.info(
        `[TEST MODE] Posted tweet for agent ${this.config.agentId}: ${content}`
      );
      this.emit("tweet", tweet);
    } catch (error) {
      logger.error("Error posting tweet:", error);
      throw error;
    }
  }

  /**
   * Start monitoring Twitter for relevant interactions
   */
  private async startMonitoring(): Promise<void> {
    this.isRunning = true;

    const monitorLoop = async () => {
      if (!this.isRunning) return;

      try {
        // Get mentions and relevant tweets
        const mentions = await this.client.fetchSearchTweets(
          `@${this.config.username}`,
          20,
          SearchMode.Latest
        );

        // Get tweets from target users if configured
        const targetTweets = await this.getTargetUserTweets();

        // Analyze all relevant tweets
        const allTweets = [...mentions.tweets, ...targetTweets];
        for (const tweet of allTweets) {
          if (tweet.id && BigInt(tweet.id) > BigInt(this.lastCheckedId)) {
            await this.processTweet(tweet as ExtendedTweet);
            this.lastCheckedId = tweet.id;
          }
        }

        // Calculate aggregate social influence
        const suggestions = await this.aggregateSocialInfluence();
        if (suggestions) {
          this.emit("socialSuggestion", suggestions);
        }
      } catch (error) {
        logger.error("Error in Twitter monitoring:", error);
      }

      // Wait for next poll interval
      const pollMs = (this.config.pollInterval || 5) * 60 * 1000;
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      monitorLoop();
    };

    monitorLoop();
  }

  /**
   * Get tweets from configured target users
   */
  private async getTargetUserTweets(): Promise<Tweet[]> {
    const tweets: Tweet[] = [];

    if (this.config.targetUsers?.length) {
      for (const username of this.config.targetUsers) {
        try {
          const userTweets = await this.client.fetchSearchTweets(
            `from:${username}`,
            5,
            SearchMode.Latest
          );
          tweets.push(...userTweets.tweets);
        } catch (error) {
          logger.error(`Error fetching tweets for ${username}:`, error);
        }
      }
    }

    return tweets;
  }

  /**
   * Process a single tweet and calculate its influence
   */
  private async processTweet(tweet: ExtendedTweet): Promise<void> {
    try {
      if (!tweet.text) {
        logger.warn("Tweet has no text content");
        return;
      }

      const influence: SocialInfluence = {
        authorFollowerCount: tweet.authorFollowerCount || 0,
        impressions: tweet.impressions || 0,
        likes: tweet.favoriteCount || 0,
        retweets: tweet.retweetCount || 0,
        comments: tweet.replyCount || 0,
        sentiment: await this.analyzeSentiment(tweet.text),
        influenceScore: 0,
      };

      // Calculate influence score based on metrics
      influence.influenceScore = this.calculateInfluenceScore(influence);

      // Store tweet and influence data
      if (tweet.id && tweet.text && tweet.username) {
        await prisma.tweet.create({
          data: {
            tweetId: BigInt(tweet.id),
            content: tweet.text,
            agentId: this.config.agentId.toString(),
            authorFollowerCount: influence.authorFollowerCount,
            engagement: {
              create: {
                likes: influence.likes,
                retweets: influence.retweets,
                comments: influence.comments,
                impressions: influence.impressions,
                influencerImpact: influence.influenceScore,
              },
            },
          },
        });
      }
    } catch (error) {
      logger.error("Error processing tweet:", error);
    }
  }

  /**
   * Analyze sentiment of tweet text
   */
  private async analyzeSentiment(
    text: string
  ): Promise<"positive" | "negative" | "neutral"> {
    // Implement sentiment analysis logic
    // For now return neutral as placeholder
    return "neutral";
  }

  /**
   * Calculate influence score based on social metrics
   */
  private calculateInfluenceScore(influence: SocialInfluence): number {
    const {
      authorFollowerCount,
      impressions,
      likes,
      retweets,
      comments,
      sentiment,
    } = influence;

    // Weighted scoring based on metrics
    const followerWeight = 0.2;
    const impressionWeight = 0.2;
    const engagementWeight = 0.4;
    const sentimentWeight = 0.2;

    const followerScore = Math.log10(authorFollowerCount + 1) * followerWeight;
    const impressionScore = Math.log10(impressions + 1) * impressionWeight;
    const engagementScore =
      (Math.log10(likes + 1) +
        Math.log10(retweets + 1) * 2 +
        Math.log10(comments + 1) * 3) *
      engagementWeight;

    const sentimentScore =
      sentiment === "positive" ? 1 : sentiment === "negative" ? -1 : 0;

    return (
      followerScore +
      impressionScore +
      engagementScore +
      sentimentScore * sentimentWeight
    );
  }

  /**
   * Aggregate social influence into action suggestions
   */
  private async aggregateSocialInfluence(): Promise<SocialSuggestion | null> {
    try {
      // Get recent tweets and their influence
      const recentTweets = await prisma.tweet.findMany({
        where: {
          agentId: this.config.agentId.toString(),
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
          },
        },
        include: { engagement: true },
        orderBy: { createdAt: "desc" },
      });

      if (recentTweets.length === 0) return null;

      // Analyze tweet content for action suggestions
      const suggestions = recentTweets
        .map((tweet) => {
          if (!tweet.content) return null;

          // Parse tweet for action suggestions
          const action = this.parseActionFromTweet(tweet.content);
          if (!action) return null;

          const engagement = tweet.engagement;
          if (!engagement) return null;

          const suggestion: SocialSuggestion = {
            action: action.type,
            targetAgent: action.targetAgent,
            coordinates: action.coordinates,
            confidence: engagement.influencerImpact,
            influence: {
              authorFollowerCount: 0,
              impressions: engagement.impressions,
              likes: engagement.likes,
              retweets: engagement.retweets,
              comments: engagement.comments,
              sentiment: "neutral",
              influenceScore: engagement.influencerImpact,
            },
            reasoning: tweet.content,
          };

          return suggestion;
        })
        .filter((s): s is SocialSuggestion => s !== null);

      if (suggestions.length === 0) return null;

      // Return highest confidence suggestion
      return suggestions.reduce((prev, curr) =>
        curr.confidence > prev.confidence ? curr : prev
      );
    } catch (error) {
      logger.error("Error aggregating social influence:", error);
      return null;
    }
  }

  /**
   * Parse action suggestion from tweet content
   */
  private parseActionFromTweet(content: string): {
    type: "move" | "battle" | "alliance" | "ignore";
    targetAgent?: string;
    coordinates?: { x: number; y: number };
  } | null {
    // Implement parsing logic based on tweet content
    // This is a placeholder implementation
    if (content.toLowerCase().includes("move")) {
      return { type: "move" };
    } else if (content.toLowerCase().includes("battle")) {
      return { type: "battle" };
    } else if (content.toLowerCase().includes("alliance")) {
      return { type: "alliance" };
    } else if (content.toLowerCase().includes("ignore")) {
      return { type: "ignore" };
    }
    return null;
  }

  /**
   * Stop monitoring Twitter
   */
  stop(): void {
    this.isRunning = false;
    logger.info(`Stopped Twitter monitoring for agent ${this.config.agentId}`);
  }
}
