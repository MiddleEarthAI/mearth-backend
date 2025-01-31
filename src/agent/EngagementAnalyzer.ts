import { logger } from "@/utils/logger";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { TweetV2, TweetV2SingleResult, TwitterApi } from "twitter-api-v2";

// Types for analysis
export interface EngagementAnalysis {
  tweetId: string;
  originalTweet: TweetV2SingleResult;
  authorFollowers: number | null;
  replies: ReplyAnalysis[];
  quotes: QuoteAnalysis[];
  overallSentiment: string;
  detectedStrategies: Strategy[];
  communityInfluence: number;
  possibleDeception: boolean;
}

export interface ReplyAnalysis {
  id: string;
  text: string;
  author: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  sentiment: string;
  isFromCommunity: boolean;
  suggestedStrategy: Strategy | null;
  credibilityScore: number;
}

export interface QuoteAnalysis {
  id: string;
  text: string;
  author: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  sentiment: string;
  reach: number;
  influence: number;
}

export interface Strategy {
  type: "honest" | "deceptive" | "conspiracy" | "community_growth";
  description: string;
  confidence: number;
  supportingEvidence: string[];
}

// Types for LLM response
interface LLMAnalysisResponse {
  replyAnalyses: Array<{
    id: string;
    sentiment: string;
    credibilityScore: number;
    strategy: Strategy | null;
  }>;
  quoteAnalyses: Array<{
    id: string;
    sentiment: string;
    influence: number;
  }>;
  overallAnalysis: {
    sentiment: string;
    strategies: Strategy[];
    communityInfluence: number;
    coordinatedBehavior: boolean;
    possibleDeception: boolean;
  };
}

interface TweetAnalysisData {
  tweet: {
    id: string;
    text: string;
    metrics: any;
    authorFollowers: number | null;
  };
  replies: Array<{
    id: string;
    text: string;
    author: string | undefined;
    metrics: any;
    isFromCommunity: boolean;
  }>;
  quotes: Array<{
    id: string;
    text: string;
    author: string | undefined;
    metrics: any;
  }>;
}

class TwitterEngagementAnalyzer {
  private client: TwitterApi;
  private knownCommunityMembers: Set<string>;

  constructor(client: TwitterApi, communityMembers: string[] = []) {
    this.client = client;
    this.knownCommunityMembers = new Set(communityMembers);
  }

  /**
   * Analyze engagement metrics for a tweet using a single optimized LLM call
   * @param tweetId - The ID of the tweet to analyze
   * @returns EngagementAnalysis - The analysis results
   */
  async analyzeEngagement(tweetId: string): Promise<EngagementAnalysis> {
    // Fetch all data in parallel
    const [tweet, replies, quotes] = await Promise.all([
      this.client.v2.singleTweet(tweetId),
      this.fetchAllReplies(tweetId),
      this.fetchQuoteTweets(tweetId),
    ]);

    const author = await this.client.v2.user(tweet.data.author_id ?? "");

    // Structure data for analysis
    const analysisData: TweetAnalysisData = {
      tweet: {
        id: tweet.data.id,
        text: tweet.data.text,
        metrics: tweet.data.public_metrics,
        authorFollowers: author.data.public_metrics?.followers_count ?? null,
      },
      replies: replies.map((r) => ({
        id: r.id,
        text: r.text,
        author: r.author_id,
        metrics: r.public_metrics,
        isFromCommunity: this.knownCommunityMembers.has(r.author_id || ""),
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        text: q.text,
        author: q.author_id,
        metrics: q.public_metrics,
      })),
    };

    // Structured prompt to ensure consistent JSON response
    const prompt = `As an expert social media analyst, analyze this tweet interaction and provide a response in EXACTLY this JSON format:
{
  "replyAnalyses": [
    {
      "id": "string",
      "sentiment": "positive" | "negative" | "neutral",
      "credibilityScore": 0.0-1.0,
      "strategy": {
        "type": "honest" | "deceptive" | "conspiracy" | "community_growth",
        "description": "string",
        "confidence": 0.0-1.0,
        "supportingEvidence": ["string"]
      }
    }
  ],
  "quoteAnalyses": [
    {
      "id": "string",
      "sentiment": "positive" | "negative" | "neutral",
      "influence": 0.0-1.0
    }
  ],
  "overallAnalysis": {
    "sentiment": "positive" | "negative" | "neutral" | "mixed",
    "strategies": [
      {
        "type": "honest" | "deceptive" | "conspiracy" | "community_growth",
        "description": "string",
        "confidence": 0.0-1.0,
        "supportingEvidence": ["string"]
      }
    ],
    "communityInfluence": 0.0-1.0,
    "coordinatedBehavior": boolean,
    "possibleDeception": boolean
  }
}

Analysis data:
${JSON.stringify(analysisData, null, 2)}

Consider:
1. Sentiment patterns across replies and quotes
2. Credibility indicators in content and engagement
3. Community dynamics and influence patterns
4. Signs of coordination or manipulation
5. Overall narrative and strategy patterns

Ensure ALL numeric scores are between 0 and 1, and ALL fields match the exact format specified.`;

    try {
      const { text: analysisResponse } = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        prompt: prompt,
      });

      let analysis: LLMAnalysisResponse;
      try {
        analysis = JSON.parse(analysisResponse);

        // Validate response format
        if (
          !analysis.replyAnalyses ||
          !analysis.quoteAnalyses ||
          !analysis.overallAnalysis
        ) {
          throw new Error("Invalid response format");
        }
      } catch (parseError) {
        logger.error("Failed to parse LLM response:", parseError);
        throw new Error("Invalid analysis format received from LLM");
      }

      // Map the analysis back to our expected format with validation
      const replyAnalyses: ReplyAnalysis[] = replies.map((reply, i) => ({
        id: reply.id,
        text: reply.text,
        author: reply.author_id ?? "",
        engagement: {
          likes: reply.public_metrics?.like_count || 0,
          retweets: reply.public_metrics?.retweet_count || 0,
          replies: reply.public_metrics?.reply_count || 0,
        },
        sentiment: analysis.replyAnalyses[i]?.sentiment || "neutral",
        isFromCommunity: this.knownCommunityMembers.has(reply.author_id || ""),
        suggestedStrategy: analysis.replyAnalyses[i]?.strategy || null,
        credibilityScore: Math.max(
          0,
          Math.min(1, analysis.replyAnalyses[i]?.credibilityScore || 0.5)
        ),
      }));

      const quoteAnalyses: QuoteAnalysis[] = quotes.map((quote, i) => ({
        id: quote.id,
        text: quote.text,
        author: quote.author_id ?? "",
        engagement: {
          likes: quote.public_metrics?.like_count || 0,
          retweets: quote.public_metrics?.retweet_count || 0,
          replies: quote.public_metrics?.reply_count || 0,
        },
        sentiment: analysis.quoteAnalyses[i]?.sentiment || "neutral",
        reach: quote.public_metrics?.impression_count || 0,
        influence: Math.max(
          0,
          Math.min(1, analysis.quoteAnalyses[i]?.influence || 0.5)
        ),
      }));

      return {
        tweetId,
        originalTweet: tweet,
        authorFollowers: author.data.public_metrics?.followers_count || null,
        replies: replyAnalyses,
        quotes: quoteAnalyses,
        overallSentiment: analysis.overallAnalysis.sentiment,
        detectedStrategies: analysis.overallAnalysis.strategies.map(
          (s: Strategy) => ({
            ...s,
            confidence: Math.max(0, Math.min(1, s.confidence)),
          })
        ),
        communityInfluence: Math.max(
          0,
          Math.min(1, analysis.overallAnalysis.communityInfluence)
        ),
        possibleDeception: analysis.overallAnalysis.possibleDeception,
      };
    } catch (error) {
      logger.error("Analysis failed:", error);
      throw new Error("Failed to analyze engagement");
    }
  }

  private async fetchAllReplies(tweetId: string): Promise<TweetV2[]> {
    const replies: TweetV2[] = [];
    let token: string | undefined;

    do {
      const response = await this.client.v2.search(
        `conversation_id:${tweetId}`,
        {
          max_results: 100,
          next_token: token,
        }
      );
      replies.push(...response.tweets);
      token = response.meta.next_token;
    } while (token);

    return replies;
  }

  private async fetchQuoteTweets(tweetId: string): Promise<TweetV2[]> {
    const quotes = await this.client.v2.quotes(tweetId);
    return quotes.tweets || [];
  }
}

export default TwitterEngagementAnalyzer;
