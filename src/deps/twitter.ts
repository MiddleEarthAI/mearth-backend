import { Scraper, SearchMode, Tweet } from "agent-twitter-client";
import { logger } from "@/utils/logger";
import { ITwitter } from "@/types";
import { AnthropicProvider } from "@ai-sdk/anthropic";
import { generateText, GenerateTextResult } from "ai";

interface TwitterConfig {
  username: string;
  password: string;
  email: string;
  targetUsers?: string[];
  pollInterval?: number; // in seconds
  dryRun?: boolean;
  llmClient: AnthropicProvider;
  agentId: string;
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
  reasoning?: string;
}

interface ExtendedTweet extends Tweet {
  authorFollowerCount?: number;
  impressions?: number;
  replyCount?: number;
}

interface TweetAnalysis {
  suggestedAction: "move" | "battle" | "alliance" | "ignore";
  targetAgent: string | null;
  coordinates: { x: number; y: number } | null;
  confidence: number;
  reasoning: string;
}

export class Twitter implements ITwitter {
  private client: Scraper;
  private config: TwitterConfig;
  private lastCheckedTweetId: bigint = 0n;
  private recentInteractions: Map<string, CommunityFeedback[]> = new Map();
  private llmClient: AnthropicProvider;
  private agentId: string;

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
    this.llmClient = config.llmClient;
    this.agentId = config.agentId;

    logger.info("Twitter service initialized for agent:", this.agentId);
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
    logger.info("Checking Twitter interactions for agent:", this.agentId);

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
   * Analyze community feedback from a tweet and its context using LLM
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
      sentiment: await this.analyzeSentiment(tweet.text || "", thread),
    };

    // Use LLM to analyze the tweet content and thread
    const analysis = await this.analyzeTweetContent(tweet, thread);

    return {
      suggestedAction: analysis.suggestedAction || "move",
      targetAgent: analysis.targetAgent || undefined,
      coordinates: analysis.coordinates || undefined,
      confidence: analysis.confidence || 0.5,
      reasoning: analysis.reasoning,
      influence,
    };
  }

  /**
   * Analyze sentiment of tweet text using LLM
   */
  private async analyzeSentiment(
    text: string,
    thread: Tweet[]
  ): Promise<"positive" | "negative" | "neutral"> {
    const prompt = `
    Analyze the sentiment of this tweet in the context of a strategy game. Consider the following:
    - Is it supportive or hostile?
    - Does it suggest cooperation or conflict?
    - What is the emotional tone?

    Tweet: "${text}"

    Context (previous tweets in thread):
    ${thread.map((t) => `@${t.username}: ${t.text}`).join("\n")}

    Return ONLY ONE of these words: "positive", "negative", or "neutral"
    `;

    try {
      const result = await generateText({
        model: this.llmClient("claude-3-5-sonnet-20240620"),
        prompt,
      });

      const sentiment = result.toString().toLowerCase().trim();
      if (
        sentiment === "positive" ||
        sentiment === "negative" ||
        sentiment === "neutral"
      ) {
        return sentiment;
      }
      return "neutral";
    } catch (error) {
      logger.error("Error analyzing sentiment:", error);
      return "neutral";
    }
  }

  /**
   * Analyze tweet content using LLM to extract actions and context
   */
  private async analyzeTweetContent(
    tweet: ExtendedTweet,
    thread: Tweet[]
  ): Promise<TweetAnalysis> {
    const prompt = `
    As an AI agent in a strategy game, analyze this tweet and its context to determine the suggested action.
    The possible actions are: move, battle, alliance, or ignore.

    Tweet from @${tweet.username}: "${tweet.text}"

    Thread context:
    ${thread.map((t) => `@${t.username}: ${t.text}`).join("\n")}

    Consider:
    1. Is there a suggested action? (move/battle/alliance/ignore)
    2. Is there a target agent? (mentioned with @)
    3. Are there coordinates mentioned? (x,y format)
    4. How confident should we be about this interpretation? (0.0-1.0)
    5. What's the reasoning behind this suggestion?

    Return the analysis in this JSON format:
    {
      "suggestedAction": "move|battle|alliance|ignore",
      "targetAgent": "@username or null",
      "coordinates": {"x": number, "y": number} or null,
      "confidence": number,
      "reasoning": "brief explanation"
    }
    `;

    try {
      const result = await generateText({
        model: this.llmClient("claude-3-5-sonnet-20240620"),
        prompt,
      });

      const analysis = JSON.parse(result.toString());
      return {
        suggestedAction: analysis.suggestedAction || "move",
        targetAgent: analysis.targetAgent?.replace("@", "") || null,
        coordinates: analysis.coordinates || null,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || "",
      };
    } catch (error) {
      logger.error("Error analyzing tweet content:", error);
      return {
        suggestedAction: "move",
        targetAgent: null,
        coordinates: null,
        confidence: 0.5,
        reasoning: "Failed to analyze tweet content",
      };
    }
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
