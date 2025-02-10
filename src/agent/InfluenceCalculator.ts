import {
  ActionSuggestion,
  InfluenceScore,
  TwitterInteraction,
} from "@/types/twitter";

/**
 * InfluenceCalculator - Calculates influence scores for user interactions
 * Combines multiple factors like follower count, engagement rate, and sentiment
 * to determine overall influence score and action suggestions
 */
class InfluenceCalculator {
  // Weights for different factors in influence calculation
  private readonly WEIGHTS = {
    FOLLOWER_COUNT: 0.3,
    ENGAGEMENT_RATE: 0.25,
    ACCOUNT_AGE: 0.15,
    VERIFICATION: 0.1,
    SENTIMENT: 0.1,
    CONTENT_RELEVANCE: 0.1,
  };

  constructor(private nlpManager: NLPManager = new NLPManager()) {}

  async calculateScore(
    interaction: TwitterInteraction
  ): Promise<InfluenceScore> {
    console.info("🎯 Starting influence score calculation", {
      interactionId: interaction.username,
    });

    const baseScore = this.calculateBaseScore(interaction);
    console.info("📊 Calculated base score", { baseScore });

    const sentiment = await this.nlpManager.analyzeSentiment(
      interaction.content || ""
    );
    console.info("😊 Analyzed sentiment", { sentiment });

    const suggestion = await this.nlpManager.extractIntent(
      interaction.content || ""
    );
    console.info("💡 Extracted action suggestion", { suggestion });

    const finalScore =
      baseScore *
      (1 + sentiment) *
      this.calculateTimeDecay(interaction.timestamp.getTime());

    console.info("🏆 Completed influence calculation", {
      interactionId: interaction.username,
      finalScore,
    });

    return {
      interactionId: interaction.username,
      score: finalScore,
      suggestion,
    };
  }

  /**
   * Calculates base influence score from user metrics
   * Normalizes and weights different factors
   */
  private calculateBaseScore(interaction: TwitterInteraction): number {
    console.debug("📈 Calculating base score from metrics", { interaction });

    const normalizedFollowers =
      Math.log10(interaction.userMetrics.followerCount + 1) / 7;
    const normalizedEngagement = interaction.userMetrics.likeCount / 100;
    const normalizedAge = Math.min(interaction.userMetrics.accountAge / 365, 1);

    const score =
      normalizedFollowers * this.WEIGHTS.FOLLOWER_COUNT +
      normalizedEngagement * this.WEIGHTS.ENGAGEMENT_RATE +
      normalizedAge * this.WEIGHTS.ACCOUNT_AGE +
      (interaction.userMetrics.verified ? 1 : 0) * this.WEIGHTS.VERIFICATION +
      (interaction.userMetrics.reputationScore || 0.5) * 0.2;

    console.debug("✨ Base score calculated", { score });
    return score;
  }

  /**
   * Applies time decay to scores based on interaction age
   * Uses exponential decay over 24 hours
   */
  private calculateTimeDecay(timestamp: number): number {
    const age = Date.now() - timestamp;
    const decay = Math.exp(-age / (24 * 60 * 60 * 1000));
    console.debug("⏳ Applied time decay", { age, decay });
    return decay;
  }
}

/**
 * NLPManager - Handles natural language processing tasks
 * Currently uses mock responses, but prepared for OpenAI integration
 */
class NLPManager {
  private openai: null = null;
  // private openai: OpenAI | null = null;

  constructor() {
    console.info("🤖 Initializing NLP Manager");
    // this.openai = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async analyzeSentiment(content: string): Promise<number> {
    try {
      console.info("🔍 Analyzing sentiment", { contentLength: content.length });
      // OpenAI implementation commented out
      const sentiment = Math.random() * 2 - 1;
      console.info("✅ Sentiment analysis complete", { sentiment });
      return sentiment;
    } catch (error) {
      console.error("❌ Failed to analyze sentiment", { content, error });
      return 0;
    }
  }

  async extractIntent(content: string): Promise<ActionSuggestion> {
    try {
      console.info("🎯 Extracting intent from content", {
        contentLength: content.length,
      });
      // OpenAI implementation commented out
      const suggestion = {
        type: ["STRATEGY", "MOVE", "BATTLE", "ALLIANCE"][
          Math.floor(Math.random() * 4)
        ] as ActionSuggestion["type"],
        content: content,
      };
      console.info("✅ Intent extraction complete", { suggestion });
      return suggestion;
    } catch (error) {
      console.error("❌ Failed to extract intent", { content, error });
      return {
        type: "STRATEGY",
        content: content,
      };
    }
  }
}

export { InfluenceCalculator, NLPManager };
