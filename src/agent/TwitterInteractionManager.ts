import { PrismaClient, Prisma } from "@prisma/client";
import TwitterManager, { AgentId } from "./TwitterManager";
import { logManager } from "./LogManager";

import { InfluenceScore, TwitterInteraction } from "@/types/twitter";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

interface InfluenceThresholds {
  minFollowerCount: number;
  minEngagementRate: number;
  minAccountAge: number;
  minReputationScore: number;
}

/**
 * TwitterInteractionManager
 * Handles processing and analysis of Twitter interactions
 * Uses TwitterManager for API calls and manages interaction processing pipeline
 */
export class TwitterInteractionManager {
  // Weights for influence calculation
  private readonly WEIGHTS = {
    FOLLOWER_COUNT: 0.3,
    ENGAGEMENT_RATE: 0.25,
    ACCOUNT_AGE: 0.15,
    VERIFICATION: 0.1,
    SENTIMENT: 0.1,
    CONTENT_RELEVANCE: 0.1,
  };

  private readonly THRESHOLDS: InfluenceThresholds = {
    minFollowerCount: 100,
    minEngagementRate: 0.02, // 2%
    minAccountAge: 30, // 30 days
    minReputationScore: 0.5,
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly twitterManager: TwitterManager
  ) {
    console.info("🎯 Twitter Interaction Manager initialized");
  }

  /**
   * Process interactions for an agent
   */
  async processInteractions(
    interactions: TwitterInteraction[],
    agentId: string
  ): Promise<void> {
    try {
      // Filter and process qualified interactions
      const qualifiedInteractions = interactions.filter((interaction) =>
        this.meetsThresholds(interaction)
      );

      if (qualifiedInteractions.length === 0) {
        return;
      }

      // Calculate influence scores
      const scores = await this.calculateInfluenceScores(
        qualifiedInteractions,
        agentId
      );

      // Store results in database
      await this.storeResults(scores, agentId);

      logManager.log(
        "SYSTEM",
        "INFO",
        `Processed ${interactions.length} interactions for agent ${agentId}`,
        { interactionCount: interactions.length },
        agentId
      );
    } catch (error) {
      logManager.log(
        "ERROR",
        "ERROR",
        `Failed to process interactions for agent ${agentId}`,
        { error },
        agentId
      );
    }
  }

  /**
   * Fetch recent interactions for an agent
   */
  async fetchRecentInteractions(
    agentId: string,
    lastChecked: Date
  ): Promise<TwitterInteraction[]> {
    try {
      const tweets = await this.twitterManager.fetchTweetsFromPastHour(
        agentId as AgentId
      );
      const interactions: TwitterInteraction[] = [];

      for (const tweet of tweets) {
        // Fetch replies
        const replies = await this.twitterManager.fetchTweetReplies(tweet.id);
        interactions.push(
          ...this.convertToInteractions(replies, "reply", lastChecked)
        );

        // Fetch quotes
        const quotes = await this.twitterManager.fetchTweetQuotes(tweet.id);
        interactions.push(
          ...this.convertToInteractions(
            Array.isArray(quotes) ? quotes : [],
            "quote",
            lastChecked
          )
        );

        // Fetch mentions
        const mentions = await this.twitterManager.fetchUserMentions(tweet.id);
        interactions.push(
          ...this.convertToInteractions(
            Array.isArray(mentions) ? mentions : [],
            "mention",
            lastChecked
          )
        );
      }

      return interactions;
    } catch (error) {
      logManager.log(
        "ERROR",
        "ERROR",
        `Failed to fetch recent interactions for agent ${agentId}`,
        { error },
        agentId
      );
      return [];
    }
  }

  /**
   * Store processing results in database
   */
  private async storeResults(
    scores: InfluenceScore[],
    agentId: string
  ): Promise<void> {
    try {
      await this.prisma.interaction.createMany({
        data: scores.map((score) => ({
          userId: score.interactionId,
          type: "Comment",
          content: JSON.stringify(score.suggestion),
          timestamp: new Date(),
          userMetrics: {
            score: score.score,
            suggestion: JSON.stringify(score.suggestion),
          } as Prisma.JsonObject,
          tweetId: "placeholder", // Should be determined from interaction
        })),
      });
    } catch (error) {
      logManager.log(
        "ERROR",
        "ERROR",
        `Failed to store results for agent ${agentId}`,
        { error },
        agentId
      );
    }
  }

  /**
   * Convert Twitter API responses to TwitterInteraction format
   */
  private convertToInteractions(
    tweets: any[],
    type: "reply" | "quote" | "mention",
    lastChecked: Date
  ): TwitterInteraction[] {
    return tweets
      .filter((tweet) => new Date(tweet.created_at) > lastChecked)
      .map((tweet) => ({
        type,
        userId: tweet.author_id,
        username: tweet.author?.username || "unknown",
        tweetId: tweet.id,
        content: tweet.text,
        timestamp: new Date(tweet.created_at),
        userMetrics: {
          followerCount: tweet.author?.public_metrics?.followers_count || 0,
          followingCount: tweet.author?.public_metrics?.following_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          tweetCount: tweet.author?.public_metrics?.tweet_count || 0,
          accountAge: this.calculateAccountAge(tweet.author?.created_at),
          verified: tweet.author?.verified || false,
          reputationScore: this.calculateReputationScore(tweet),
          listedCount: tweet.author?.public_metrics?.listed_count || 0,
        },
      }));
  }

  /**
   * Check if an interaction meets minimum influence thresholds
   */
  private meetsThresholds(interaction: TwitterInteraction): boolean {
    const { userMetrics } = interaction;
    const engagementRate =
      (userMetrics.likeCount / userMetrics.followerCount) * 100;

    return (
      userMetrics.followerCount >= this.THRESHOLDS.minFollowerCount &&
      engagementRate >= this.THRESHOLDS.minEngagementRate &&
      userMetrics.accountAge / (24 * 60 * 60) >=
        this.THRESHOLDS.minAccountAge &&
      (userMetrics.reputationScore || 0) >= this.THRESHOLDS.minReputationScore
    );
  }

  /**
   * Calculate influence scores for interactions
   */
  private async calculateInfluenceScores(
    interactions: TwitterInteraction[],
    agentId: string
  ): Promise<InfluenceScore[]> {
    try {
      // Calculate base scores
      const baseScores = await Promise.all(
        interactions.map((interaction) => this.calculateBaseScore(interaction))
      );

      // Get sentiment and context from LLM
      const llmResults = await this.processWithLLM(interactions);

      // Combine scores with LLM results
      return interactions.map((interaction, index) => ({
        interactionId: interaction.username,
        score: baseScores[index] * (1 + llmResults[index].sentiment),
        suggestion: llmResults[index].suggestion,
      }));
    } catch (error) {
      logManager.log(
        "ERROR",
        "ERROR",
        `Failed to calculate influence scores for agent ${agentId}`,
        { error },
        agentId
      );
      return [];
    }
  }

  /**
   * Calculate base influence score from user metrics
   */
  private async calculateBaseScore(
    interaction: TwitterInteraction
  ): Promise<number> {
    const { userMetrics } = interaction;

    const normalizedFollowers = Math.log10(userMetrics.followerCount + 1) / 7;
    const normalizedEngagement = userMetrics.likeCount / 100;
    const normalizedAge = Math.min(
      userMetrics.accountAge / (365 * 24 * 60 * 60),
      1
    );

    return (
      normalizedFollowers * this.WEIGHTS.FOLLOWER_COUNT +
      normalizedEngagement * this.WEIGHTS.ENGAGEMENT_RATE +
      normalizedAge * this.WEIGHTS.ACCOUNT_AGE +
      (userMetrics.verified ? 1 : 0) * this.WEIGHTS.VERIFICATION
    );
  }

  /**
   * Calculate account age in seconds
   */
  private calculateAccountAge(createdAt?: string): number {
    if (!createdAt) return 0;
    return (Date.now() - new Date(createdAt).getTime()) / 1000;
  }

  /**
   * Calculate reputation score based on user metrics
   */
  private calculateReputationScore(tweet: any): number {
    const metrics = tweet.author?.public_metrics;
    if (!metrics) return 0;

    const followerRatio =
      metrics.followers_count / (metrics.following_count || 1);
    const engagementRate =
      (tweet.public_metrics?.like_count || 0) / (metrics.followers_count || 1);
    const accountAge =
      this.calculateAccountAge(tweet.author?.created_at) / (365 * 24 * 60 * 60); // in years

    return (
      (followerRatio * 0.3 +
        engagementRate * 0.4 +
        (Math.min(accountAge, 5) / 5) * 0.3) *
      (tweet.author?.verified ? 1.2 : 1)
    );
  }

  /**
   * Process interactions with LLM for sentiment and context extraction
   */
  private async processWithLLM(interactions: TwitterInteraction[]) {
    try {
      const prompt = this.createPrompt(interactions);

      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          {
            role: "system",
            content:
              "You are analyzing Twitter interactions with AI agents in the Middle Earth game. Extract sentiment, relevant context, and action suggestions from each interaction.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      return this.parseLLMResponse(response.text || "");
    } catch (error) {
      logManager.log(
        "ERROR",
        "ERROR",
        "Failed to process interactions with LLM",
        { error }
      );
      return interactions.map(() => ({
        sentiment: 0,
        suggestion: { type: "STRATEGY", content: "" },
      }));
    }
  }

  /**
   * Create a prompt for LLM processing
   */
  private createPrompt(interactions: TwitterInteraction[]): string {
    return `Analyze the following Twitter interactions with Middle Earth AI agents:

${interactions
  .map(
    (interaction, index) => `
Interaction ${index + 1}:
User: ${interaction.username}
Content: ${interaction.content}
Metrics: ${JSON.stringify(interaction.userMetrics)}
`
  )
  .join("\n")}

For each interaction, provide:
1. Sentiment score (-1 to 1)
2. Action suggestion (MOVE/BATTLE/ALLIANCE/IGNORE/STRATEGY)
3. Relevant context for agent decision making

Format: JSON array with {sentiment, suggestion} objects.`;
  }

  /**
   * Parse LLM response into structured data
   */
  private parseLLMResponse(response: string): any[] {
    try {
      return JSON.parse(response);
    } catch (error) {
      logManager.log("ERROR", "ERROR", "Failed to parse LLM response", {
        error,
        response,
      });
      return [];
    }
  }
}
