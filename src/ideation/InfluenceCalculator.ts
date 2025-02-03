import { TweetV2, TweetV2SingleResult } from "twitter-api-v2";
import { NLPManager } from "./NlpManager";

// Influence Calculator
class InfluenceCalculator {
  private readonly WEIGHTS = {
    FOLLOWER_COUNT: 0.3,
    ENGAGEMENT_RATE: 0.25,
    ACCOUNT_AGE: 0.15,
    VERIFICATION: 0.1,
    SENTIMENT: 0.1,
    CONTENT_RELEVANCE: 0.1,
  };

  constructor(private nlpManager: NLPManager) {}

  async calculateScore(
    interaction: TweetV2SingleResult
  ): Promise<InfluenceScore> {
    const baseScore = this.calculateBaseScore(interaction.userMetrics);
    const sentiment = await this.nlpManager.analyzeSentiment(
      interaction.content
    );
    const suggestion = await this.nlpManager.extractIntent(interaction.content);

    const finalScore =
      baseScore *
      (1 + sentiment) *
      this.calculateTimeDecay(interaction.timestamp);

    return {
      interactionId: interaction.id,
      score: finalScore,
      suggestion,
    };
  }

  private calculateBaseScore(metrics: UserMetrics): number {
    const normalizedFollowers = Math.log10(metrics.followerCount + 1) / 7; // Normalize to 0-1
    const normalizedEngagement = metrics.averageEngagement / 100;
    const normalizedAge = Math.min(metrics.accountAge / 365, 1);

    return (
      normalizedFollowers * this.WEIGHTS.FOLLOWER_COUNT +
      normalizedEngagement * this.WEIGHTS.ENGAGEMENT_RATE +
      normalizedAge * this.WEIGHTS.ACCOUNT_AGE +
      (metrics.verificationStatus ? 1 : 0) * this.WEIGHTS.VERIFICATION +
      (metrics.reputationScore || 0.5) * 0.2
    );
  }

  private calculateTimeDecay(timestamp: number): number {
    const age = Date.now() - timestamp;
    return Math.exp(-age / (24 * 60 * 60 * 1000)); // 24 hour decay
  }
}

export { InfluenceCalculator };
