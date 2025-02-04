import { InfluenceCalculator, NLPManager } from "@/agent/InfluenceCalculator";
import { ActionSuggestion, UserMetrics } from "@/types/twitter";

// Mock NLPManager
jest.mock("@/agent/InfluenceCalculator", () => {
  const originalModule = jest.requireActual("@/agent/InfluenceCalculator");
  return {
    ...originalModule,
    NLPManager: jest.fn().mockImplementation(() => ({
      analyzeSentiment: jest.fn().mockResolvedValue(0.5),
      extractIntent: jest.fn().mockResolvedValue({
        type: "STRATEGY",
        content: "test content",
      }),
    })),
  };
});

describe("InfluenceCalculator", () => {
  let influenceCalculator: InfluenceCalculator;
  let mockNlpManager: jest.Mocked<NLPManager>;

  beforeEach(() => {
    mockNlpManager = new NLPManager() as jest.Mocked<NLPManager>;
    influenceCalculator = new InfluenceCalculator(mockNlpManager);
  });

  describe("calculateScore", () => {
    const mockInteraction = {
      id: "test-interaction",
      content: "test content",
      timestamp: Date.now(),
      userMetrics: {
        followerCount: 1000,
        averageEngagement: 50,
        accountAge: 365,
        verificationStatus: true,
        reputationScore: 0.8,
      } as UserMetrics,
    };

    it("should calculate influence score correctly", async () => {
      const result = await influenceCalculator.calculateScore(mockInteraction);

      expect(result).toBeDefined();
      expect(result.interactionId).toBe("test-interaction");
      expect(result.score).toBeGreaterThan(0);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion.type).toBe("STRATEGY");
    });

    it("should handle high-influence users", async () => {
      const highInfluenceInteraction = {
        ...mockInteraction,
        userMetrics: {
          followerCount: 1000000,
          averageEngagement: 90,
          accountAge: 1825, // 5 years
          verificationStatus: true,
          reputationScore: 0.95,
        },
      };

      const result = await influenceCalculator.calculateScore(
        highInfluenceInteraction
      );
      const baseResult = await influenceCalculator.calculateScore(
        mockInteraction
      );

      expect(result.score).toBeGreaterThan(baseResult.score);
    });

    it("should handle low-influence users", async () => {
      const lowInfluenceInteraction = {
        ...mockInteraction,
        userMetrics: {
          followerCount: 100,
          averageEngagement: 10,
          accountAge: 30,
          verificationStatus: false,
          reputationScore: 0.3,
        },
      };

      const result = await influenceCalculator.calculateScore(
        lowInfluenceInteraction
      );
      const baseResult = await influenceCalculator.calculateScore(
        mockInteraction
      );

      expect(result.score).toBeLessThan(baseResult.score);
    });

    it("should apply time decay to older interactions", async () => {
      const oldInteraction = {
        ...mockInteraction,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
      };

      const result = await influenceCalculator.calculateScore(oldInteraction);
      const recentResult = await influenceCalculator.calculateScore(
        mockInteraction
      );

      expect(result.score).toBeLessThan(recentResult.score);
    });
  });

  describe("NLP Processing", () => {
    it("should analyze sentiment correctly", async () => {
      const positiveInteraction = {
        id: "test-positive",
        content: "Great strategy! Let's form an alliance!",
        timestamp: Date.now(),
        userMetrics: {
          followerCount: 1000,
          averageEngagement: 50,
          accountAge: 365,
          verificationStatus: true,
          reputationScore: 0.8,
        },
      };

      mockNlpManager.analyzeSentiment.mockResolvedValueOnce(0.8);

      const result = await influenceCalculator.calculateScore(
        positiveInteraction
      );
      expect(mockNlpManager.analyzeSentiment).toHaveBeenCalledWith(
        positiveInteraction.content
      );
      expect(result.score).toBeGreaterThan(0);
    });

    it("should extract intent correctly", async () => {
      const battleInteraction = {
        id: "test-battle",
        content: "Let's attack the enemy position!",
        timestamp: Date.now(),
        userMetrics: {
          followerCount: 1000,
          averageEngagement: 50,
          accountAge: 365,
          verificationStatus: true,
          reputationScore: 0.8,
        },
      };

      mockNlpManager.extractIntent.mockResolvedValueOnce({
        type: "BATTLE",
        target: "2",
        content: battleInteraction.content,
      });

      const result = await influenceCalculator.calculateScore(
        battleInteraction
      );
      expect(mockNlpManager.extractIntent).toHaveBeenCalledWith(
        battleInteraction.content
      );
      expect(result.suggestion.type).toBe("BATTLE");
    });

    it("should handle NLP processing errors gracefully", async () => {
      const interaction = {
        id: "test-error",
        content: "test content",
        timestamp: Date.now(),
        userMetrics: {
          followerCount: 1000,
          averageEngagement: 50,
          accountAge: 365,
          verificationStatus: true,
          reputationScore: 0.8,
        },
      };

      mockNlpManager.analyzeSentiment.mockRejectedValueOnce(
        new Error("NLP Error")
      );
      mockNlpManager.extractIntent.mockRejectedValueOnce(
        new Error("NLP Error")
      );

      const result = await influenceCalculator.calculateScore(interaction);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.suggestion).toBeDefined();
    });
  });

  describe("Metric Normalization", () => {
    it("should normalize follower count logarithmically", async () => {
      const interactions = [
        {
          id: "test-1",
          content: "test",
          timestamp: Date.now(),
          userMetrics: {
            followerCount: 100,
            averageEngagement: 50,
            accountAge: 365,
            verificationStatus: true,
            reputationScore: 0.8,
          },
        },
        {
          id: "test-2",
          content: "test",
          timestamp: Date.now(),
          userMetrics: {
            followerCount: 1000000,
            averageEngagement: 50,
            accountAge: 365,
            verificationStatus: true,
            reputationScore: 0.8,
          },
        },
      ];

      const [result1, result2] = await Promise.all(
        interactions.map((interaction) =>
          influenceCalculator.calculateScore(interaction)
        )
      );

      // Difference should be significant but not proportional to raw follower count
      const scoreDiff = result2.score - result1.score;
      expect(scoreDiff).toBeLessThan(5);
    });

    it("should cap account age influence", async () => {
      const interactions = [
        {
          id: "test-1",
          content: "test",
          timestamp: Date.now(),
          userMetrics: {
            followerCount: 1000,
            averageEngagement: 50,
            accountAge: 365,
            verificationStatus: true,
            reputationScore: 0.8,
          },
        },
        {
          id: "test-2",
          content: "test",
          timestamp: Date.now(),
          userMetrics: {
            followerCount: 1000,
            averageEngagement: 50,
            accountAge: 3650,
            verificationStatus: true,
            reputationScore: 0.8,
          },
        },
      ];

      const [result1, result2] = await Promise.all(
        interactions.map((interaction) =>
          influenceCalculator.calculateScore(interaction)
        )
      );

      // 10-year-old account shouldn't have 10x the influence of 1-year-old account
      const scoreDiff = result2.score - result1.score;
      expect(scoreDiff).toBeLessThan(1);
    });
  });
});
