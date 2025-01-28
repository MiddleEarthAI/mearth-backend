import { prisma } from "@/config/prisma";
import type { ITwitter } from "@/types";
import { logger } from "@/utils/logger";
import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { Scraper, SearchMode, type Tweet } from "agent-twitter-client";
import { generateText } from "ai";
import NodeCache, { EventEmitter } from "node-cache";

class TwitterConfig {
  public username: string;
  public password: string;
  public twitter2faSecret: string;
  public email: string;

  public targetUsers?: string[];
  public pollInterval?: number; // in seconds
  public dryRun?: boolean;
  public agentId: string;

  constructor(config?: TwitterConfig) {
    if (
      !config?.username ||
      !config?.password ||
      !config?.email ||
      !config?.twitter2faSecret ||
      !config?.agentId
    ) {
      throw new Error(
        "TwitterConfig: username, password, email, and agentId are required"
      );
    }
    this.agentId = config.agentId;
    this.username = config.username;
    this.password = config.password;
    this.email = config?.email;
    this.twitter2faSecret = config?.twitter2faSecret;
    this.targetUsers = config?.targetUsers ?? [];
    this.pollInterval = config?.pollInterval ?? 120;
    this.dryRun = config?.dryRun ?? true;
  }
}

type TwitterProfile = {
  id: string;
  username: string;
  screenName: string;
  bio: string;
  nicknames: string[];
};

interface CommunityFeedback {
  suggestedAction: "move" | "battle" | "alliance" | "ignore";
  targetAgent?: string;
  coordinates?: { x: number; y: number };
  confidence: number;
  influence: {
    authorFollowerCount: number;
    impressions: number;
    likes: number;
    retweets: number;
    influencerImpact: number;
    commentCount: number;
    sentiment: "positive" | "negative" | "neutral";
  };
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

export class Twitter extends EventEmitter implements ITwitter {
  private client: Scraper;
  private config: TwitterConfig;
  private cache: NodeCache;
  private lastCheckedTweetId = 0n;
  private anthropic: AnthropicProvider;
  private profile: TwitterProfile | null;
  private agentId: string;

  constructor(anthropic: AnthropicProvider, config: TwitterConfig) {
    super();
    this.config = config;
    const scraper = new Scraper();
    this.client = scraper;
    this.anthropic = anthropic;
    this.agentId = config.agentId;
    this.profile = null;
    this.cache = new NodeCache();
  }

  async init() {
    const username = this.config.username;
    const password = this.config.password;
    const email = this.config.email;

    let retries = 3;
    const twitter2faSecret = this.config.twitter2faSecret;

    const cachedCookies = await this.getCachedCookies(username);

    if (cachedCookies) {
      logger.info("Using cached cookies");
      await this.setCookiesFromArray(cachedCookies);
    }

    logger.info("Waiting for Twitter login");
    while (retries > 0) {
      try {
        if (await this.client.isLoggedIn()) {
          // cookies are valid, no login required
          logger.info("Successfully logged in.");
          break;
        } else {
          // just for testing
          this.config.username = "testi1151149";
          this.config.password = "testi115";
          this.config.email = "testing13467@web.de";
          this.config.twitter2faSecret = "testi1151149";
          logger.info(this.config);
          await this.client.login(
            this.config.username,
            this.config.password,
            this.config.email,
            this.config.twitter2faSecret
          );
          if (await this.client.isLoggedIn()) {
            // fresh login, store new cookies
            logger.info("Successfully logged in.");
            logger.info("Caching cookies");
            await this.cacheCookies(username, await this.client.getCookies());
            break;
          }
        }
      } catch (error) {
        logger.error(`Login attempt failed: ${error}`);
      }

      retries--;
      logger.error(
        `Failed to login to Twitter. Retrying... (${retries} attempts left)`
      );

      if (retries === 0) {
        logger.error("Max retries reached. Exiting login process.");
        throw new Error("Twitter login failed after maximum retries.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds before retrying
    }

    // Initialize Twitter profile
    this.profile = await this.fetchProfile(username);

    if (this.profile) {
      logger.log("Twitter user ID:", this.profile.id);
      logger.log("Twitter loaded:", JSON.stringify(this.profile, null, 10));
      // Store profile info for use in responses
      this.profile = {
        id: this.profile.id,
        username: this.profile.username,
        screenName: this.profile.screenName,
        bio: this.profile.bio,
        nicknames: this.profile.nicknames,
      };
    } else {
      throw new Error("Failed to load profile");
    }

    await this.initializeLastCheckedTweet();
    await this.startMonitoring();
  }

  /**
   * Initialize last checked tweet from database
   */
  private async initializeLastCheckedTweet() {
    const lastInteraction = await prisma.tweet.findFirst({
      where: { agentId: this.agentId },
      orderBy: { tweetId: "desc" },
    });

    if (lastInteraction?.tweetId) {
      this.lastCheckedTweetId = lastInteraction.tweetId;
    }
  }

  /**
   * Start monitoring Twitter interactions
   */
  private async startMonitoring() {
    const handleInteractionsLoop = async () => {
      this.handleTwitterInteractions();
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollInterval! * 1000 * 60 * 60)
      ); // 1 hour
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

      await prisma.tweetFeedback.create({
        data: {
          suggestedAction: feedback.suggestedAction,
          targetAgent: feedback.targetAgent || "",
          coordinateX: feedback.coordinates?.x || 0,
          coordinateY: feedback.coordinates?.y || 0,
          confidence: feedback.confidence,
          reasoning: feedback.reasoning || "",
          tweetId: tweet.id,
          sentiment: feedback.influence.sentiment,
        },
      });

      // Store interaction and feedback in database
      await prisma.tweetEngagement.create({
        data: {
          comments: feedback.influence.commentCount,
          retweets: feedback.influence.retweets,
          likes: feedback.influence.likes,
          influencerImpact: feedback.influence.influencerImpact,
          tweetId: tweet.id,
          // conversationId: tweet.conversationId,
          // content: tweet.text || "",
          // authorUsername: tweet.username || "",
          // authorId: tweet.userId || "",
          // sentiment: feedback.influence.sentiment,
          // influence: {
          //   create: {
          //     // authorFollowerCount: feedback.influence.authorFollowerCount,
          //     // impressions: feedback.influence.impressions,
          //     likes: feedback.influence.likes,
          //     // commentCount: feedback.influence.commentCount,
          //   },
          // },
        },
      });

      logger.info(
        `Processed and stored tweet ${tweet.id} with feedback:`,
        feedback
      );
    } catch (error) {
      logger.error(`Error processing tweet ${tweet.id}:`, error);
    }
  }

  /**
   * Build conversation thread for context
   */
  private async buildConversationThread(
    tweet: Tweet,
    maxDepth = 5
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
    // Use LLM to analyze the tweet content and thread
    const analysis = await this.analyzeTweetContent(tweet, thread);

    return {
      suggestedAction: analysis.suggestedAction || "move",
      targetAgent: analysis.targetAgent || undefined,
      coordinates: analysis.coordinates || undefined,
      confidence: analysis.confidence || 0.5,
      reasoning: analysis.reasoning,
      influence: {
        authorFollowerCount: tweet.authorFollowerCount || 0,
        impressions: tweet.impressions || 0,
        likes: tweet.likes || 0,
        retweets: 0,
        influencerImpact: 0,
        commentCount: tweet.replyCount || 0,
        sentiment: await this.analyzeSentiment(tweet.text || "", thread),
      },
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
        model: this.anthropic("claude-3-5-sonnet-20240620"),
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
      "targetAgent": "@username" | null,
      "coordinates": {"x": number, "y": number} | null,
      "confidence": number,
      "reasoning": "brief explanation"
    }
    `;

    try {
      const result = await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt,
      });

      const analysis = JSON.parse(result.toString());
      return {
        suggestedAction: analysis.suggestedAction || "move",
        targetAgent: analysis.targetAgent || null,
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
   * Get aggregated community feedback for decision making
   */
  async getCommunityFeedback(): Promise<CommunityFeedback[]> {
    const recentTweets = await prisma.tweet.findMany({
      where: {
        agentId: this.agentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        engagement: true,
        feedback: true,
      },
    });

    return recentTweets.map((tweet) => ({
      suggestedAction:
        (tweet.feedback?.suggestedAction as
          | "move"
          | "battle"
          | "alliance"
          | "ignore") || "move",
      targetAgent: tweet.feedback?.targetAgent,
      coordinates:
        tweet.feedback?.coordinateX && tweet.feedback?.coordinateY
          ? {
              x: tweet.feedback.coordinateX,
              y: tweet.feedback.coordinateY,
            }
          : undefined,
      confidence: tweet.feedback?.confidence || 0.5,
      influence: {
        authorFollowerCount: tweet.authorFollowerCount || 0,
        impressions: tweet.engagement?.impressions || 0,
        likes: tweet.engagement?.likes || 0,
        retweets: tweet.engagement?.retweets || 0,
        influencerImpact: tweet.engagement?.influencerImpact || 0,
        commentCount: tweet.engagement?.comments || 0,
        sentiment:
          (tweet.feedback?.sentiment as "positive" | "negative" | "neutral") ||
          "neutral",
      },
      reasoning: tweet.feedback?.reasoning,
    }));
  }

  /**
   * Post a tweet from an agent's account
   */

  // TODO: Remove this agentUsername parameter
  async postTweet(content: string, agentUsername: string): Promise<void> {
    try {
      const dryRun = this.config.dryRun;
      logger.info(`Posting tweet: ${content}`);
      logger.info(`Dry run🔥: ${dryRun}`);
      if (dryRun) {
        logger.info(`[DRY RUN] Would post tweet: ${content}`);
        return;
      }

      await this.client.sendTweet(`${this.config.username}: ${content}`);
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

  async setCookiesFromArray(cookiesArray: any[]) {
    const cookieStrings = cookiesArray.map(
      (cookie) =>
        `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${
          cookie.path
        }; ${cookie.secure ? "Secure" : ""}; ${
          cookie.httpOnly ? "HttpOnly" : ""
        }; SameSite=${cookie.sameSite || "Lax"}`
    );
    await this.client.setCookies(cookieStrings);
  }

  async getCachedCookies(username: string) {
    return await this.cache.get<any[]>(`twitter/${username}/cookies`);
  }

  async cacheCookies(username: string, cookies: any[]) {
    this.cache.set(`twitter/${username}/cookies`, cookies);
  }

  async fetchProfile(username: string): Promise<TwitterProfile> {
    try {
      const cachedProfile = (await this.cache.get(username)) as TwitterProfile;
      if (cachedProfile) {
        return cachedProfile;
      }

      const profile = await this.client.getProfile(username);

      const twitterProfile = {
        id: profile.userId!,
        username,
        screenName: profile.name!,
        bio: profile.biography!,
        nicknames: [],
      } satisfies TwitterProfile;

      this.cache.set(username, twitterProfile);
      return twitterProfile;
    } catch (error) {
      logger.error("Error fetching Twitter profile:", error);
      throw error;
    }
  }
}
