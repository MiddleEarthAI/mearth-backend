import { Scraper, SearchMode, Tweet } from "agent-twitter-client";
import { logger } from "@/utils/logger";
import { ITwitter } from "@/types";

interface TwitterConfig {
  username: string;
  password: string;
  email: string;
  targetUsers?: string[];
  pollInterval?: number; // in seconds
  dryRun?: boolean;
}

interface TweetInfluence {
  authorFollowerCount: number;
  impressions: number;
  likes: number;
  commentCount: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface CommunityFeedback {
  suggestedAction: "move" | "battle" | "alliance" | "ignore";
  targetAgent?: string;
  coordinates?: { x: number; y: number };
  confidence: number;
  influence: TweetInfluence;
}

interface ExtendedTweet extends Tweet {
  authorFollowerCount?: number;
  impressions?: number;
  replyCount?: number;
}

export class Twitter implements ITwitter {
  private client: Scraper;
  private config: TwitterConfig;
  private lastCheckedTweetId: bigint = 0n;
  private recentInteractions: Map<string, CommunityFeedback[]> = new Map();

  constructor(config: TwitterConfig) {
    this.config = {
      ...config,
      pollInterval: config.pollInterval || 120, // Default 2 minutes
      dryRun: config.dryRun || false,
      targetUsers: config.targetUsers || [],
    };

    const scraper = new Scraper();
    scraper.login(
      this.config.username,
      this.config.password,
      this.config.email
    );
    this.client = scraper;

    logger.info("Twitter service initialized");
    this.startMonitoring();
  }

  /**
   * Start monitoring Twitter interactions
   */
  private startMonitoring() {
    const handleInteractionsLoop = () => {
      this.handleTwitterInteractions();
      setTimeout(handleInteractionsLoop, this.config.pollInterval! * 1000);
    };
    handleInteractionsLoop();
  }

  /**
   * Handle Twitter interactions
   */
  private async handleTwitterInteractions() {
    logger.info("Checking Twitter interactions");

    try {
      // Check for mentions and relevant tweets
      const mentions = await this.client.fetchSearchTweets(
        `@${this.config.username}`,
        20,
        SearchMode.Latest
      );

      // Process target users if configured
      let targetUserTweets: Tweet[] = [];
      if (this.config.targetUsers?.length) {
        for (const username of this.config.targetUsers) {
          const userTweets = await this.client.fetchSearchTweets(
            `from:${username}`,
            3,
            SearchMode.Latest
          );
          targetUserTweets = [...targetUserTweets, ...userTweets.tweets];
        }
      }

      // Combine and process all relevant tweets
      const allTweets = [...mentions.tweets, ...targetUserTweets];
      const uniqueTweets = this.filterUniqueTweets(allTweets);

      // Process each tweet
      for (const tweet of uniqueTweets) {
        if (tweet.id && BigInt(tweet.id) > this.lastCheckedTweetId) {
          await this.processTweet(tweet);
          this.lastCheckedTweetId = BigInt(tweet.id);
        }
      }

      logger.info("Finished checking Twitter interactions");
    } catch (error) {
      logger.error("Error handling Twitter interactions:", error);
    }
  }

  /**
   * Filter unique tweets and sort by ID
   */
  private filterUniqueTweets(tweets: Tweet[]): Tweet[] {
    const uniqueTweets = new Map<string, Tweet>();
    tweets.forEach((tweet) => {
      if (tweet.id && tweet.userId !== this.config.username) {
        uniqueTweets.set(tweet.id, tweet);
      }
    });
    return Array.from(uniqueTweets.values()).sort((a, b) =>
      a.id && b.id ? a.id.localeCompare(b.id) : 0
    );
  }

  /**
   * Process a single tweet and analyze community feedback
   */
  private async processTweet(tweet: ExtendedTweet) {
    try {
      if (!tweet.id || !tweet.conversationId) {
        logger.warn("Tweet missing required fields", tweet);
        return;
      }

      // Get tweet thread context
      const thread = await this.buildConversationThread(tweet);

      // Analyze community feedback
      const feedback = await this.analyzeCommunityFeedback(tweet, thread);

      // Store feedback for decision making
      if (!this.recentInteractions.has(tweet.conversationId)) {
        this.recentInteractions.set(tweet.conversationId, []);
      }
      this.recentInteractions.get(tweet.conversationId)?.push(feedback);

      // Clean up old interactions
      this.cleanupOldInteractions();

      logger.info(`Processed tweet ${tweet.id} with feedback:`, feedback);
    } catch (error) {
      logger.error(`Error processing tweet ${tweet.id}:`, error);
    }
  }

  /**
   * Build conversation thread for context
   */
  private async buildConversationThread(
    tweet: Tweet,
    maxDepth: number = 5
  ): Promise<Tweet[]> {
    const thread: Tweet[] = [tweet];
    let currentTweet = tweet;
    let depth = 0;

    while (currentTweet.inReplyToStatusId && depth < maxDepth) {
      try {
        const parentTweet = await this.client.getTweet(
          currentTweet.inReplyToStatusId
        );
        if (parentTweet) {
          thread.unshift(parentTweet);
          currentTweet = parentTweet;
        }
        depth++;
      } catch (error) {
        logger.error("Error fetching parent tweet:", error);
        break;
      }
    }

    return thread;
  }

  /**
   * Analyze community feedback from a tweet and its context
   */
  private async analyzeCommunityFeedback(
    tweet: ExtendedTweet,
    thread: Tweet[]
  ): Promise<CommunityFeedback> {
    const influence: TweetInfluence = {
      authorFollowerCount: tweet.authorFollowerCount || 0,
      impressions: tweet.impressions || 0,
      likes: tweet.likes || 0,
      commentCount: tweet.replyCount || 0,
      sentiment: await this.analyzeSentiment(tweet.text || ""),
    };

    // Extract suggested action from tweet content
    const feedback = this.extractActionFromContent(tweet.text || "", thread);

    return {
      suggestedAction: feedback.suggestedAction || "move",
      targetAgent: feedback.targetAgent,
      coordinates: feedback.coordinates,
      confidence: feedback.confidence || 0.5,
      influence,
    };
  }

  /**
   * Analyze sentiment of tweet text
   */
  private async analyzeSentiment(
    text: string
  ): Promise<"positive" | "negative" | "neutral"> {
    // Simple sentiment analysis based on keywords
    const positiveWords = ["alliance", "friend", "support", "help", "together"];
    const negativeWords = ["battle", "fight", "attack", "kill", "defeat"];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter((word) =>
      lowerText.includes(word)
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  /**
   * Extract suggested action from tweet content
   */
  private extractActionFromContent(
    text: string,
    thread: Tweet[]
  ): Partial<CommunityFeedback> {
    const lowerText = text.toLowerCase();

    // Extract coordinates if present
    const coordsMatch = text.match(/\b(\d+)\s*,\s*(\d+)\b/);
    const coordinates = coordsMatch
      ? {
          x: parseInt(coordsMatch[1]),
          y: parseInt(coordsMatch[2]),
        }
      : undefined;

    // Extract target agent if mentioned
    const targetMatch = text.match(/@(\w+)/);
    const targetAgent = targetMatch ? targetMatch[1] : undefined;

    // Determine suggested action
    let suggestedAction: CommunityFeedback["suggestedAction"] = "move";
    let confidence = 0.5;

    if (
      lowerText.includes("battle") ||
      lowerText.includes("fight") ||
      lowerText.includes("attack")
    ) {
      suggestedAction = "battle";
      confidence = 0.8;
    } else if (
      lowerText.includes("alliance") ||
      lowerText.includes("team up")
    ) {
      suggestedAction = "alliance";
      confidence = 0.7;
    } else if (lowerText.includes("ignore") || lowerText.includes("avoid")) {
      suggestedAction = "ignore";
      confidence = 0.6;
    }

    return {
      suggestedAction,
      targetAgent,
      coordinates,
      confidence,
    };
  }

  /**
   * Clean up old interactions (older than 24 hours)
   */
  private cleanupOldInteractions() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.recentInteractions.forEach((interactions, conversationId) => {
      const recentInteractions = interactions.filter(
        (interaction) => interaction.influence.impressions > oneDayAgo
      );
      if (recentInteractions.length === 0) {
        this.recentInteractions.delete(conversationId);
      } else {
        this.recentInteractions.set(conversationId, recentInteractions);
      }
    });
  }

  /**
   * Get aggregated community feedback for decision making
   */
  async getCommunityFeedback(): Promise<CommunityFeedback[]> {
    const allFeedback: CommunityFeedback[] = [];
    this.recentInteractions.forEach((interactions) => {
      allFeedback.push(...interactions);
    });
    return allFeedback;
  }

  /**
   * Post a tweet from an agent's account
   */
  async postTweet(content: string): Promise<void> {
    try {
      if (this.config.dryRun) {
        logger.info(`[DRY RUN] Would post tweet: ${content}`);
        return;
      }

      await this.client.sendTweet(content);
      logger.info(`Posted tweet: ${content}`);
    } catch (error) {
      logger.error(`Failed to post tweet:`, error);
      throw error;
    }
  }

  /**
   * Post a reply to a tweet
   */
  async postReply(content: string, replyToTweetId: string): Promise<void> {
    try {
      if (this.config.dryRun) {
        logger.info(
          `[DRY RUN] Would post reply: ${content} to tweet ${replyToTweetId}`
        );
        return;
      }

      // First, fetch the tweet we're replying to
      const replyToTweet = await this.client.getTweet(replyToTweetId);
      if (!replyToTweet) {
        throw new Error(`Tweet ${replyToTweetId} not found`);
      }

      // Then post our reply
      await this.client.sendTweet(`@${replyToTweet.username} ${content}`);
      logger.info(`Posted reply: ${content} to tweet ${replyToTweetId}`);
    } catch (error) {
      logger.error(`Failed to post reply:`, error);
      throw error;
    }
  }
}
