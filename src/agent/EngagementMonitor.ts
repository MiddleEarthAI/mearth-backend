import { logger } from "@/utils/logger";
import { prisma } from "@/config/prisma";
import { TweetV2, TwitterApi } from "twitter-api-v2";
import { createAnthropic } from "@ai-sdk/anthropic";

import natural from "natural";
import { generateText } from "ai";

// Initialize sentiment analyzer
const analyzer = new natural.SentimentAnalyzer(
  "English",
  natural.PorterStemmer,
  "afinn"
);
const tokenizer = new natural.WordTokenizer();

// LLM Configuration
const LLM_CONFIG = {
  SYSTEM_PROMPT: `You are an AI assistant analyzing interactions in the Middle Earth strategy game.
The game involves agents competing, forming alliances, and engaging in battles.
Your task is to analyze tweets, detect deception, assess intentions, and provide strategic insights.
Always consider the fantasy context and strategic nature of the game in your analysis.`,
  TEMPERATURE: {
    ANALYSIS: 0.1, // Low temperature for consistent analysis
    STRATEGY: 0.3, // Slightly higher for strategic decisions
  },
  MAX_TOKENS: {
    SHORT: 50, // For simple responses
    MEDIUM: 150, // For analysis
  },
};

// Game-specific keywords for better sentiment analysis
const GAME_KEYWORDS = {
  positive: [
    "alliance",
    "friend",
    "support",
    "help",
    "join",
    "together",
    "peace",
    "victory",
    "win",
    "strong",
  ],
  negative: [
    "battle",
    "attack",
    "fight",
    "enemy",
    "defeat",
    "betrayal",
    "war",
    "threat",
    "danger",
    "death",
  ],
  neutral: [
    "move",
    "position",
    "location",
    "status",
    "report",
    "update",
    "observe",
    "watch",
    "wait",
    "plan",
  ],
};

// Game-specific deception indicators
const DECEPTION_PATTERNS = {
  contradictions: [
    {
      claim: ["friend", "ally", "alliance"],
      opposite: ["attack", "battle", "fight"],
    },
    { claim: ["peace", "truce"], opposite: ["war", "battle", "attack"] },
    { claim: ["trust", "honest"], opposite: ["betray", "deceive", "lie"] },
  ],
  uncertaintyWords: [
    "maybe",
    "perhaps",
    "possibly",
    "might",
    "could",
    "probably",
    "supposedly",
    "apparently",
    "seem",
    "guess",
    "think",
  ],
  deceptiveIntentWords: [
    "trick",
    "deceive",
    "fool",
    "trap",
    "ambush",
    "mislead",
    "pretend",
    "fake",
    "false",
    "lie",
  ],
  evasiveWords: [
    "whatever",
    "anyway",
    "somehow",
    "somewhere",
    "sometime",
    "someone",
    "something",
  ],
};

interface DeceptionIndicators {
  hasContradictions: boolean;
  uncertaintyScore: number;
  deceptiveIntentScore: number;
  evasiveScore: number;
  contextMismatch: boolean;
}

/**
 * Enhanced sentiment analysis that considers game-specific context
 */
function analyzeGameSentiment(text: string): { type: string; score: number } {
  // Tokenize and clean the text
  const tokens = tokenizer.tokenize(text.toLowerCase());
  if (!tokens) return { type: "neutral", score: 0.5 };

  // Get base sentiment score
  const baseSentiment = analyzer.getSentiment(tokens);

  // Count game-specific keywords
  const keywordCounts = {
    positive: tokens.filter((token) => GAME_KEYWORDS.positive.includes(token))
      .length,
    negative: tokens.filter((token) => GAME_KEYWORDS.negative.includes(token))
      .length,
    neutral: tokens.filter((token) => GAME_KEYWORDS.neutral.includes(token))
      .length,
  };

  // Adjust score based on game-specific keywords
  let adjustedScore = baseSentiment;
  adjustedScore += keywordCounts.positive * 0.2;
  adjustedScore -= keywordCounts.negative * 0.2;

  // Normalize score to be between -1 and 1
  adjustedScore = Math.max(-1, Math.min(1, adjustedScore));

  // Convert to 0-1 range
  const normalizedScore = (adjustedScore + 1) / 2;

  // Determine sentiment type
  let type = "neutral";
  if (normalizedScore > 0.6) type = "positive";
  else if (normalizedScore < 0.4) type = "negative";

  return {
    type,
    score: normalizedScore,
  };
}

interface TweetAnalysis {
  engagementScore: number;
  isDeceptive: boolean;
  deceptionScore: number;
  intentType: string;
  suggestedAction: string | null;
  communityConsensus: number;
  communityAlignment: number;
  impactScore: number;
  sentiment: string;
  confidence: number;
  primaryInfluencers: string[];
}

interface AuthorAnalysis {
  reliability: number;
  previousInteractions: number;
  isVerified: boolean;
}

export class EngagementMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCheckedId: string | null = null;
  private readonly CHECK_INTERVAL = 20 * 60 * 1000; // 20 minutes in seconds
  private readonly anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  constructor(
    private readonly twitterApi: TwitterApi,
    private readonly agentXHandle: string,
    private readonly agentId: number,
    private readonly gameId: string
  ) {}

  async start(): Promise<void> {
    if (this.monitoringInterval) {
      logger.warn(`Monitoring already active for @${this.agentXHandle}`);
      return;
    }

    // Initial check
    this.checkInteractions().catch((error) =>
      logger.error(`Error in initial check for @${this.agentXHandle}:`, error)
    );

    // Set up recurring checks
    this.monitoringInterval = setInterval(() => {
      this.checkInteractions().catch((error) =>
        logger.error(
          `Error checking interactions for @${this.agentXHandle}:`,
          error
        )
      );
    }, this.CHECK_INTERVAL);

    logger.info(`Started monitoring for @${this.agentXHandle}`);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info(`Stopped monitoring for @${this.agentXHandle}`);
    }
  }

  private async checkInteractions(): Promise<void> {
    try {
      const [mentions, qrts] = await Promise.all([
        this.twitterApi.v2.search(`@${this.agentXHandle}`, {
          "tweet.fields": [
            "created_at",
            "public_metrics",
            "referenced_tweets",
            "author_id",
            "conversation_id",
            "in_reply_to_user_id",
          ],
          "user.fields": ["public_metrics", "verified", "username"],
          expansions: [
            "author_id",
            "referenced_tweets.id",
            "in_reply_to_user_id",
          ],
          since_id: this.lastCheckedId || undefined,
        }),
        this.twitterApi.v2.search(`url:"x.com/${this.agentXHandle}"`, {
          "tweet.fields": [
            "created_at",
            "public_metrics",
            "referenced_tweets",
            "conversation_id",
          ],
          "user.fields": ["public_metrics", "verified", "username"],
          expansions: ["author_id", "referenced_tweets.id"],
          since_id: this.lastCheckedId || undefined,
        }),
      ]);

      const interactions = [
        ...(mentions.data.data || []),
        ...(qrts.data.data || []),
      ];

      for (const tweet of interactions) {
        const [analysis, authorAnalysis] = await Promise.all([
          this.analyzeTweet(tweet),
          this.analyzeAuthor(tweet?.author_id || ""),
        ]);

        await this.storeInteraction(tweet, analysis, authorAnalysis);
        await this.updateCommunityMetrics(analysis);
      }

      if (interactions.length > 0) {
        // Update the last checked ID to the highest ID in the interactions
        this.lastCheckedId = interactions
          .map((t) => BigInt(t.id))
          .reduce((a, b) => (a > b ? a : b))
          .toString();
      }
    } catch (error) {
      logger.error(
        `Error checking interactions for @${this.agentXHandle}:`,
        error
      );
      throw error;
    }
  }

  private async analyzeTweet(tweet: TweetV2): Promise<TweetAnalysis> {
    const metrics = tweet.public_metrics || {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
    };

    const agent = await prisma.agent.findUnique({
      where: {
        agentId_gameId: {
          agentId: this.agentId,
          gameId: this.gameId,
        },
      },
      include: {
        agentProfile: true,
        location: true,
        strategy: true,
        currentAlliance: true,
        cooldowns: true,
        state: true,
      },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    // Parallel analysis using LLM
    const [sentimentResult, deceptionResult, actionResult] = await Promise.all([
      this.analyzeSentiment(tweet.text),
      this.analyzeDeception(tweet.text, {
        location:
          agent.location?.x && agent.location?.y
            ? { x: agent.location.x, y: agent.location.y }
            : undefined,
        alliance: agent.currentAlliance?.id,
        previousStatements: await this.getPreviousStatements(
          tweet?.author_id || ""
        ),
      }),
      this.suggestAction({
        text: tweet.text,
        personality: agent.agentProfile,
        location: agent.location,
        deceptionLevel: agent.strategy?.deceptionLevel || 0,
      }),
    ]);

    const engagementScore = this.calculateEngagementScore(metrics);

    return {
      engagementScore,
      isDeceptive: deceptionResult.isDeceptive,
      deceptionScore: deceptionResult.score,
      intentType: deceptionResult.intent,
      suggestedAction: actionResult.action,
      communityConsensus: actionResult.consensus,
      communityAlignment: actionResult.alignment,
      impactScore: this.calculateImpactScore({
        engagement: engagementScore,
        deception: deceptionResult.score,
        consensus: actionResult.consensus,
        alignment: actionResult.alignment,
      }),
      sentiment: sentimentResult.type,
      confidence: actionResult.confidence,
      primaryInfluencers: await this.identifyInfluencers(tweet),
    };
  }

  private async analyzeSentiment(
    text: string
  ): Promise<{ type: string; score: number }> {
    try {
      return analyzeGameSentiment(text);
    } catch (error) {
      logger.error("Error analyzing sentiment:", error);
      return { type: "neutral", score: 0.5 };
    }
  }

  private async analyzeDeception(
    text: string,
    context: {
      location?: { x: number; y: number };
      alliance?: string;
      previousStatements?: string[];
    }
  ): Promise<{
    isDeceptive: boolean;
    score: number;
    intent: string;
  }> {
    try {
      const indicators = analyzeDeceptionIndicators(text, context);

      // Calculate overall deception score
      const deceptionScore =
        (indicators.hasContradictions ? 0.3 : 0) +
        indicators.uncertaintyScore * 0.2 +
        indicators.deceptiveIntentScore * 0.3 +
        indicators.evasiveScore * 0.1 +
        (indicators.contextMismatch ? 0.1 : 0);

      // Determine intent
      const intent = determineIntent(text, deceptionScore);

      return {
        isDeceptive: deceptionScore > 0.5,
        score: deceptionScore,
        intent,
      };
    } catch (error) {
      logger.error("Error analyzing deception:", error);
      return { isDeceptive: false, score: 0, intent: "inform" };
    }
  }

  private async suggestAction(context: {
    text: string;
    personality: any;
    location: any;
    deceptionLevel: number;
  }): Promise<{
    action: string;
    consensus: number;
    alignment: number;
    confidence: number;
  }> {
    try {
      const completion = await generateText({
        model: this.anthropic("claude-3-sonnet"),
        prompt: `Suggest an action for this Middle Earth agent based on:
Tweet: "${context.text}"
Location: (${context.location?.x}, ${context.location?.y})
Deception Level: ${context.deceptionLevel}
Personality:
- Aggressiveness: ${context.personality?.aggressiveness || 0}
- Trustworthiness: ${context.personality?.trustworthiness || 0}
- Intelligence: ${context.personality?.intelligence || 0}

Return ONLY a JSON object with:
{
  "action": "move" | "battle" | "alliance" | "ignore",
  "consensus": number between 0 and 1,
  "alignment": number between -1 and 1,
  "confidence": number between 0 and 1
}`,
        temperature: LLM_CONFIG.TEMPERATURE.STRATEGY,
        maxTokens: LLM_CONFIG.MAX_TOKENS.MEDIUM,
      });

      const result = JSON.parse(completion.text || "{}");
      return {
        action: result.action || "ignore",
        consensus: result.consensus || 0,
        alignment: result.alignment || 0,
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      logger.error("Error suggesting action:", error);
      return {
        action: "ignore",
        consensus: 0,
        alignment: 0,
        confidence: 0.5,
      };
    }
  }

  private async getPreviousStatements(authorId: string): Promise<string[]> {
    const recentInteractions = await prisma.interaction.findMany({
      where: {
        authorId,
        type: { in: ["comment", "quote"] },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: { content: true },
    });

    return recentInteractions.map((i) => i.content);
  }

  private async analyzeAuthor(authorId: string): Promise<AuthorAnalysis> {
    // Get previous interactions
    const previousInteractions = await prisma.interaction.count({
      where: { authorId },
    });

    // Calculate reliability based on historical interactions
    const reliability = await this.calculateAuthorReliability(authorId);

    // Get author verification status
    const author = await this.twitterApi.v2.user(authorId);

    return {
      reliability,
      previousInteractions,
      isVerified: author.data.verified || false,
    };
  }

  private async storeInteraction(
    tweet: any,
    analysis: TweetAnalysis,
    authorAnalysis: AuthorAnalysis
  ): Promise<void> {
    const agent = await prisma.agent.findUnique({
      where: {
        agentId_gameId: {
          agentId: this.agentId,
          gameId: this.gameId,
        },
      },
      include: { community: true },
    });

    if (!agent?.community) return;

    await prisma.interaction.create({
      data: {
        type: tweet.referenced_tweets ? "quote" : "comment",
        content: tweet.text || "",
        communityId: agent.community.id,

        // Author metrics
        authorId: tweet.author_id,
        authorHandle: tweet.author?.username || "",
        authorFollowers: tweet.author?.public_metrics?.followers_count || 0,
        authorIsVerified: authorAnalysis.isVerified,

        // Engagement metrics
        engagement: Math.floor(analysis.engagementScore * 100),
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        quotes: tweet.public_metrics?.quote_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,

        // Content analysis
        sentiment: analysis.sentiment,
        influenceScore: analysis.communityConsensus,
        suggestedAction: analysis.suggestedAction,
        confidence: analysis.confidence,

        // Strategic analysis
        isDeceptive: analysis.isDeceptive,
        deceptionScore: analysis.deceptionScore,
        intentType: analysis.intentType,

        // Context
        referencedTweet: tweet.referenced_tweets?.[0]?.id,
        conversationId: tweet.conversation_id,
        inReplyToId: tweet.in_reply_to_user_id,

        // Community impact
        communityAlignment: analysis.communityAlignment,
        impactScore: analysis.impactScore,

        // Historical context
        previousInteractions: authorAnalysis.previousInteractions,
        authorReliability: authorAnalysis.reliability,

        // Timestamps
        timestamp: new Date(tweet.created_at),
      },
    });
  }

  private calculateEngagementScore(metrics: any): number {
    return (
      (metrics.like_count * 1 +
        metrics.retweet_count * 2 +
        metrics.reply_count * 3 +
        metrics.quote_count * 2) /
      100
    );
  }

  private calculateImpactScore(factors: {
    engagement: number;
    deception: number;
    consensus: number;
    alignment: number;
  }): number {
    return (
      factors.engagement * 0.3 +
      (1 - factors.deception) * 0.2 +
      factors.consensus * 0.3 +
      factors.alignment * 0.2
    );
  }

  private async calculateAuthorReliability(authorId: string): Promise<number> {
    const interactions = await prisma.interaction.findMany({
      where: { authorId },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    if (interactions.length === 0) return 0.5;

    const reliabilityScore =
      interactions.reduce(
        (acc, interaction) => acc + (interaction.isDeceptive ? 0 : 1),
        0
      ) / interactions.length;

    return reliabilityScore;
  }

  private async identifyInfluencers(tweet: TweetV2): Promise<string[]> {
    const replies = await this.twitterApi.v2.search(
      `conversation_id:${tweet.id}`,
      {
        "tweet.fields": ["public_metrics", "author_id"],
        "user.fields": ["public_metrics"],
        max_results: 100,
      }
    );

    return (replies.data.data || [])
      .sort(
        (a, b) =>
          (b.public_metrics?.like_count || 0) -
          (a.public_metrics?.like_count || 0)
      )
      .slice(0, 5)
      .map((reply) => reply.author_id)
      .filter((id): id is string => id !== null);
  }

  private async updateCommunityMetrics(analysis: TweetAnalysis): Promise<void> {
    const agent = await prisma.agent.findUnique({
      where: {
        agentId_gameId: {
          agentId: this.agentId,
          gameId: this.gameId,
        },
      },
      include: { community: true },
    });

    if (!agent?.community) return;

    await prisma.community.update({
      where: { id: agent.community.id },
      data: {
        lastInfluenceTime: new Date(),
        averageEngagement: {
          set:
            (agent.community.averageEngagement + analysis.engagementScore) / 2,
        },
        influenceScore: {
          set: analysis.communityConsensus,
        },
      },
    });
  }
}

/**
 * Analyzes text for potential deception based on various linguistic indicators
 */
function analyzeDeceptionIndicators(
  text: string,
  context: {
    location?: { x: number; y: number };
    alliance?: string;
    previousStatements?: string[];
  }
): DeceptionIndicators {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  if (!tokens) {
    return {
      hasContradictions: false,
      uncertaintyScore: 0,
      deceptiveIntentScore: 0,
      evasiveScore: 0,
      contextMismatch: false,
    };
  }

  // Check for contradictions
  const hasContradictions = DECEPTION_PATTERNS.contradictions.some(
    (pattern) => {
      const hasClaim = pattern.claim.some((word) => tokens.includes(word));
      const hasOpposite = pattern.opposite.some((word) =>
        tokens.includes(word)
      );
      return hasClaim && hasOpposite;
    }
  );

  // Calculate various deception scores
  const uncertaintyScore =
    DECEPTION_PATTERNS.uncertaintyWords.filter((word) => tokens.includes(word))
      .length / tokens.length;

  const deceptiveIntentScore =
    DECEPTION_PATTERNS.deceptiveIntentWords.filter((word) =>
      tokens.includes(word)
    ).length / tokens.length;

  const evasiveScore =
    DECEPTION_PATTERNS.evasiveWords.filter((word) => tokens.includes(word))
      .length / tokens.length;

  // Check for context mismatches with previous statements
  let contextMismatch = false;
  if (context.previousStatements && context.previousStatements.length > 0) {
    const previousTokens = context.previousStatements
      .map((stmt) => tokenizer.tokenize(stmt.toLowerCase()))
      .flat();

    // Look for direct contradictions with previous statements
    contextMismatch = DECEPTION_PATTERNS.contradictions.some((pattern) => {
      const previousHasClaim = pattern.claim.some((word) =>
        previousTokens.includes(word)
      );
      const currentHasOpposite = pattern.opposite.some((word) =>
        tokens.includes(word)
      );
      return (
        (previousHasClaim && currentHasOpposite) ||
        (previousTokens.includes("alliance") && tokens.includes("enemy"))
      );
    });
  }

  return {
    hasContradictions,
    uncertaintyScore,
    deceptiveIntentScore,
    evasiveScore,
    contextMismatch,
  };
}

/**
 * Determines intent type based on text content and context
 */
function determineIntent(
  text: string,
  deceptionScore: number
): "support" | "oppose" | "deceive" | "inform" | "question" {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  if (!tokens) return "inform";

  // Check for question marks or question words
  if (
    text.includes("?") ||
    ["what", "when", "where", "who", "why", "how"].some((q) =>
      tokens.includes(q)
    )
  ) {
    return "question";
  }

  // High deception score indicates deceptive intent
  if (deceptionScore > 0.6) {
    return "deceive";
  }

  // Check for supportive or opposing language
  const supportWords = GAME_KEYWORDS.positive;
  const opposeWords = GAME_KEYWORDS.negative;

  const supportScore = supportWords.filter((word) =>
    tokens.includes(word)
  ).length;
  const opposeScore = opposeWords.filter((word) =>
    tokens.includes(word)
  ).length;

  if (supportScore > opposeScore) {
    return "support";
  } else if (opposeScore > supportScore) {
    return "oppose";
  }

  return "inform";
}
