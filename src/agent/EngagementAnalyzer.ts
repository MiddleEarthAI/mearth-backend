import { logger } from "@/utils/logger";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type {
  TweetV2,
  TweetV2SingleResult,
  TwitterApi,
  UserV2Result,
} from "twitter-api-v2";

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

class TwitterEngagementAnalyzer {
  private client: TwitterApi;
  private knownCommunityMembers: Set<string>;

  constructor(client: TwitterApi, communityMembers: string[] = []) {
    this.client = client;
    this.knownCommunityMembers = new Set(communityMembers);
  }

  /**
   * Analyze engagement metrics for a tweet
   * @param tweetId - The ID of the tweet to analyze
   * @returns EngagementAnalysis - The analysis results
   */

  async analyzeEngagement(tweetId: string): Promise<EngagementAnalysis> {
    const tweet = await this.client.v2.singleTweet(tweetId);

    const replies = await this.fetchAllReplies(tweetId);
    const quotes = await this.fetchQuoteTweets(tweetId);
    const author = await this.client.v2.user(tweet.data.author_id ?? "");

    const replyAnalyses = await Promise.all(
      replies.map((reply) => this.analyzeReply(reply))
    );

    const quoteAnalyses = await Promise.all(
      quotes.map((quote) => this.analyzeQuote(quote))
    );

    const coordinatedBehavior = await this.detectCoordinatedBehaviorWithLLM(
      replyAnalyses
    );

    return {
      tweetId,
      originalTweet: tweet,
      authorFollowers: author.data.public_metrics?.followers_count || null,
      replies: replyAnalyses,
      quotes: quoteAnalyses,
      overallSentiment: await this.calculateOverallSentimentWithLLM(
        replyAnalyses,
        quoteAnalyses
      ),
      detectedStrategies: await this.detectStrategiesWithLLM(
        replyAnalyses,
        quoteAnalyses,
        coordinatedBehavior
      ),
      communityInfluence: await this.calculateCommunityInfluenceWithLLM(
        replyAnalyses
      ),
      possibleDeception: await this.detectPossibleDeceptionWithLLM(
        replyAnalyses,
        coordinatedBehavior
      ),
    };
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

  private async analyzeReply(reply: TweetV2): Promise<ReplyAnalysis> {
    const sentiment = await this.analyzeSentimentWithLLM(reply.text);
    const strategy = await this.detectStrategyWithLLM(reply.text);

    return {
      id: reply.id,
      text: reply.text,
      author: reply.author_id ?? "",
      engagement: {
        likes: reply.public_metrics?.like_count || 0,
        retweets: reply.public_metrics?.retweet_count || 0,
        replies: reply.public_metrics?.reply_count || 0,
      },
      sentiment,
      isFromCommunity: this.knownCommunityMembers.has(reply.author_id || ""),
      suggestedStrategy: strategy,
      credibilityScore: await this.calculateCredibilityScore(reply),
    };
  }

  private async analyzeQuote(quote: TweetV2): Promise<QuoteAnalysis> {
    const sentiment = await this.analyzeSentimentWithLLM(quote.text);

    return {
      id: quote.id,
      text: quote.text,
      author: quote.author_id ?? "",
      engagement: {
        likes: quote.public_metrics?.like_count || 0,
        retweets: quote.public_metrics?.retweet_count || 0,
        replies: quote.public_metrics?.reply_count || 0,
      },
      sentiment,
      reach: quote.public_metrics?.impression_count || 0,
      influence: await this.calculateInfluenceScore(quote),
    };
  }

  private async calculateCredibilityScore(tweet: TweetV2): Promise<number> {
    const prompt = `Act as an expert in social media credibility analysis. Calculate a credibility score (0-1) for this tweet:

Tweet Data:
${JSON.stringify(
  {
    text: tweet.text,
    author: tweet.author_id,
    metrics: tweet.public_metrics,
    // context: tweet.context,
  },
  null,
  2
)}

Evaluate based on:
1. Author Credibility
- Account age
- Verification status
- Past behavior
- Community standing

2. Content Quality
- Source citations
- Factual accuracy
- Writing quality
- Media inclusion

3. Engagement Authenticity
- Engagement patterns
- Follower quality
- Reply sentiment
- Share patterns

4. Context Consideration
- Topic expertise
- Historical accuracy
- Community relevance
- Current events

Provide a detailed analysis and conclude with a single decimal number between 0 and 1.

Analysis structure:
1. Author assessment
2. Content evaluation
3. Engagement analysis
4. Contextual factors
5. Final score calculation`;

    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    const score = Number.parseFloat(response) || 0.5;
    return Math.max(0, Math.min(1, score));
  }

  private async calculateInfluenceScore(tweet: TweetV2): Promise<number> {
    const prompt = `Calculate influence score (0-1) for this tweet:
    ${tweet.text}
    Metrics: ${JSON.stringify(tweet.public_metrics || {})}`;

    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    const score = Number.parseFloat(response) || 0.5;
    return Math.max(0, Math.min(1, score));
  }

  private async analyzeSentimentWithLLM(text: string): Promise<string> {
    const prompt = `Act as an expert sentiment analyst. Analyze the emotional tone and underlying sentiment of this tweet:

Text: "${text}"

Consider:
- Language and word choice
- Use of emojis/punctuation
- Context and subtext
- Potential sarcasm or irony

Provide a single word response: POSITIVE, NEGATIVE, or NEUTRAL.

Detailed reasoning:
1. Key emotional indicators
2. Contextual clues
3. Overall tone assessment`;

    const { text: sentiment } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });

    return sentiment.toLowerCase();
  }

  private async detectStrategyWithLLM(text: string): Promise<Strategy | null> {
    const prompt = `Act as an expert in communication strategy and social media analysis. Analyze this tweet for its underlying communication strategy:

Tweet: "${text}"

Classify the strategy into one of these categories:
- HONEST: Direct, transparent communication
- DECEPTIVE: Misleading or manipulative content
- CONSPIRACY: Promoting alternative narratives
- COMMUNITY_GROWTH: Building community engagement

Provide analysis in this JSON format:
{
  "type": "strategy_type",
  "description": "detailed_explanation",
  "confidence": confidence_score,
  "supportingEvidence": [
    "specific_evidence_1",
    "specific_evidence_2"
  ]
}

Consider:
1. Language patterns
2. Source credibility
3. Engagement patterns
4. Historical context
5. Community dynamics`;

    try {
      const { text: response } = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        prompt: prompt,
      });
      const strategy = JSON.parse(response);
      return strategy as Strategy;
    } catch (error) {
      logger.error("Strategy detection failed:", error);
      return null;
    }
  }

  private async detectCoordinatedBehaviorWithLLM(
    replies: ReplyAnalysis[]
  ): Promise<boolean> {
    if (replies.length < 3) return false;
    const prompt = `Act as an expert in detecting coordinated social media behavior. Analyze these tweet replies for signs of coordination:

Reply Data: ${JSON.stringify(
      replies.map((r) => ({
        text: r.text,
        timing: r.id,
        engagement: r.engagement,
        author: r.author,
      })),
      null,
      2
    )}

Look for:
1. Message similarity patterns
2. Timing patterns
3. Account behavior patterns
4. Engagement patterns
5. Network relationships

Consider these indicators:
- Similar phrasing or talking points
- Synchronized posting times
- Unusual engagement patterns
- Cross-promotion patterns
- Account creation patterns

Provide detailed analysis and conclude with TRUE if coordinated behavior detected, FALSE if organic.

Analysis steps:
1. Pattern identification
2. Timing analysis
3. Network analysis
4. Behavioral analysis
5. Final assessment`;
    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    return response.toLowerCase().includes("true");
  }

  private async calculateOverallSentimentWithLLM(
    replies: ReplyAnalysis[],
    quotes: QuoteAnalysis[]
  ): Promise<string> {
    const allSentiments = [...replies, ...quotes].map((r) => r.sentiment);

    const prompt = `Analyze these sentiments and provide an overall sentiment (positive/negative/mixed/neutral):
    ${JSON.stringify(allSentiments)}`;

    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    return response.toLowerCase();
  }

  private async detectStrategiesWithLLM(
    replies: ReplyAnalysis[],
    quotes: QuoteAnalysis[],
    coordinated: boolean
  ): Promise<Strategy[]> {
    const prompt = `Analyze communication strategies in these interactions:
    Replies: ${JSON.stringify(replies.map((r) => r.text))}
    Quotes: ${JSON.stringify(quotes.map((q) => q.text))}
    Coordinated: ${coordinated}
    
    Respond with JSON array of strategies:
    [{
      "type": "honest|deceptive|conspiracy|community_growth",
      "description": "explanation",
      "confidence": 0.0-1.0,
      "supportingEvidence": ["reason1", "reason2"]
    }]`;

    try {
      const { text: response } = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        prompt: prompt,
      });
      return JSON.parse(response) as Strategy[];
    } catch (error) {
      logger.error("Strategy detection failed:", error);
      return [];
    }
  }

  private async calculateCommunityInfluenceWithLLM(
    replies: ReplyAnalysis[]
  ): Promise<number> {
    const communityMetrics = {
      totalReplies: replies.length,
      communityReplies: replies.filter((r) => r.isFromCommunity).length,
      avgEngagement:
        replies.reduce(
          (sum, r) => sum + r.engagement.likes + r.engagement.retweets,
          0
        ) / replies.length,
    };

    const prompt = `Calculate community influence score (0-1) based on these metrics:
    ${JSON.stringify(communityMetrics)}`;

    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    const score = Number.parseFloat(response) || 0.5;
    return Math.max(0, Math.min(1, score));
  }

  private async detectPossibleDeceptionWithLLM(
    replies: ReplyAnalysis[],
    coordinated: boolean
  ): Promise<boolean> {
    const prompt = `Analyze for signs of deception:
    Replies: ${JSON.stringify(
      replies.map((r) => ({
        text: r.text,
        credibility: r.credibilityScore,
        strategy: r.suggestedStrategy,
      }))
    )}
    Coordinated: ${coordinated}
    
    Respond with TRUE if deception likely, FALSE if not.`;

    const { text: response } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
    });
    return response.toLowerCase().includes("true");
  }
}
export default TwitterEngagementAnalyzer;
