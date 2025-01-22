import {
  Agent,
  TerrainType,
  BattleOutcome,
  AgentDecision,
  BattleStrategy,
  CommunityFeedback,
  Position,
  Battle,
  GameState,
} from "../types/game";
import { Anthropic, HUMAN_PROMPT, AI_PROMPT } from "@anthropic-ai/sdk";
import { retryWithExponentialBackoff } from "../utils/retry";
import {
  parseDecision,
  parseBattleStrategy,
  parseTraitAdjustments,
} from "../utils/llmParser";
import { calculateDistance, normalizeScore } from "../utils/math";
import { logger } from "../utils/logger";
import NodeCache from "node-cache";
import { ILLMService } from "../types/services";
import { PrismaClient } from "@prisma/client";

// Define interfaces for community feedback
interface CommunityEngagement {
  impressions: number;
}

interface InfluentialUser {
  followerCount: number;
  [key: string]: any;
}

interface WeightedCommunityFeedback extends CommunityFeedback {
  engagement: {
    impressions: number;
  };
  suggestions: string[];
  influentialUsers: {
    followerCount: number;
    [key: string]: any;
  }[];
  weightedSentiment?: number;
  influentialOpinions?: Array<{
    followerCount: number;
    weight: number;
    [key: string]: any;
  }>;
}

export class LLMService implements ILLMService {
  private readonly anthropic: Anthropic;
  private readonly cache: NodeCache;

  constructor(private readonly prisma: PrismaClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable");
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
    logger.info("LLM service initialized");
  }

  /**
   * Get the next move for an agent based on the current game state
   */
  public async getNextMove(agentId: string): Promise<any> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // TODO: Implement LLM logic to determine next move
      logger.info(`Generated next move for agent ${agent.name}`);
      return {
        action: "WAIT",
        reason: "Default wait action",
      };
    } catch (error) {
      logger.error(`Failed to get next move for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get battle strategy against a potential opponent
   */
  public async getBattleStrategy(
    agentId: string,
    opponentId: string
  ): Promise<any> {
    try {
      const [agent, opponent] = await Promise.all([
        this.prisma.agent.findUnique({ where: { id: agentId } }),
        this.prisma.agent.findUnique({ where: { id: opponentId } }),
      ]);

      if (!agent || !opponent) {
        throw new Error("One or both agents not found");
      }

      // TODO: Implement LLM logic to determine battle strategy
      logger.info(
        `Generated battle strategy for ${agent.name} vs ${opponent.name}`
      );
      return {
        tokensToBurn: 100,
        reason: "Default battle strategy",
      };
    } catch (error) {
      logger.error("Failed to get battle strategy:", error);
      throw error;
    }
  }

  /**
   * Process community influence with weighted feedback analysis
   */
  async processCommunityFeedback(feedback: any): Promise<any> {
    try {
      // TODO: Implement LLM logic to process community feedback
      logger.info("Processed community feedback");
      return {
        adjustedAggressiveness: 0,
        adjustedAlliancePropensity: 0,
        reason: "Default feedback processing",
      };
    } catch (error) {
      logger.error("Failed to process community feedback:", error);
      throw error;
    }
  }

  /**
   * Generate personality-driven tweet content
   */
  async generateTweet(agentId: string, event: string): Promise<string> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // TODO: Implement LLM logic to generate tweet
      logger.info(`Generated tweet for ${agent.name} about ${event}`);
      return `${agent.name} is ${event}`;
    } catch (error) {
      logger.error(`Failed to generate tweet for agent ${agentId}:`, error);
      throw error;
    }
  }

  private calculateTemperature(agent: Agent): number {
    // More aggressive agents have higher temperature for more unpredictable behavior
    return 0.3 + agent.characteristics.aggressiveness / 200;
  }

  private calculateConfidence(
    agent: Agent,
    decision: AgentDecision,
    gameState: GameState
  ): number {
    let confidence = 70; // Base confidence

    // Adjust based on agent characteristics
    switch (decision.action) {
      case "BATTLE":
        confidence += (agent.characteristics.aggressiveness - 50) / 2;
        break;
      case "ALLIANCE":
        confidence += (agent.characteristics.alliancePropensity - 50) / 2;
        break;
    }

    // Adjust based on terrain
    if (gameState.terrain !== TerrainType.PLAIN) {
      confidence -= 10;
    }

    // Normalize to 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateCommunityAlignment(
    decision: AgentDecision,
    feedback: WeightedCommunityFeedback
  ): number {
    // Calculate how well the decision aligns with community suggestions
    const relevantSuggestions = feedback.suggestions.filter((s) =>
      s.toLowerCase().includes(decision.action.toLowerCase())
    );

    return (
      (relevantSuggestions.length / feedback.suggestions.length) * 100 || 0
    );
  }

  private calculateOptimalTokenBurn(agent: Agent, opponent: Agent): number {
    // Calculate optimal token burn percentage based on game theory
    const tokenRatio = agent.tokenBalance / opponent.tokenBalance;
    const basePercentage = 40; // Start with middle of range (31-50)

    // Adjust based on token ratio
    if (tokenRatio > 2) {
      return basePercentage - 5; // Can afford to burn less
    } else if (tokenRatio < 0.5) {
      return basePercentage + 5; // Need to burn more to make impact
    }

    return basePercentage;
  }

  private calculateWeightedFeedback(
    feedback: WeightedCommunityFeedback
  ): WeightedCommunityFeedback {
    const enrichedFeedback = {
      ...feedback,
      weightedSentiment:
        feedback.sentiment * (feedback.engagement.impressions / 10000),
      influentialOpinions: feedback.influentialUsers.map((user) => ({
        ...user,
        weight: Math.log10(user.followerCount) / 10,
      })),
    };
    return enrichedFeedback;
  }

  private buildMovePrompt(agent: Agent, gameState: GameState): string {
    return `You are ${agent.name}, a ${agent.type} agent in the Middle Earth game.
Your characteristics:
- Aggressiveness: ${agent.characteristics.aggressiveness}/100
- Alliance Propensity: ${agent.characteristics.alliancePropensity}/100
- Influenceability: ${agent.characteristics.influenceability}/100

Current game state:
- Nearby agents: ${gameState.nearbyAgents.map((a) => a.name).join(", ")}
- Recent battles: ${gameState.recentBattles.length}
- Community sentiment: ${gameState.communityFeedback.sentiment}
- Current terrain: ${gameState.terrain}

Based on your characteristics and the current game state, what is your next move?
Respond with a structured decision including action type (MOVE/BATTLE/ALLIANCE/WAIT) and reasoning.`;
  }

  private buildBattlePrompt(
    agent: Agent,
    opponent: Agent,
    previousBattles: Battle[]
  ): string {
    return `You are ${agent.name}, considering a battle with ${opponent.name}.

Your characteristics:
- Aggressiveness: ${agent.characteristics.aggressiveness}/100
- Token balance: ${agent.tokenBalance}

Opponent characteristics:
- Aggressiveness: ${opponent.characteristics.aggressiveness}/100
- Token balance: ${opponent.tokenBalance}

Previous battles: ${previousBattles.length}
${previousBattles
  .map(
    (b) =>
      `- ${b.initiatorId === agent.id ? "You attacked" : "They attacked"}, ${
        b.outcome
      }, ${b.tokensBurned} tokens burned`
  )
  .join("\n")}

Should you engage in battle? Consider token balances, previous outcomes, and characteristics.
Respond with a structured strategy including whether to fight and suggested token burn amount.`;
  }

  private buildFeedbackPrompt(
    agent: Agent,
    weightedFeedback: WeightedCommunityFeedback
  ): string {
    return `As ${agent.name} (${agent.type}), analyze this weighted community feedback:

Current Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Influenceability: ${agent.characteristics.influenceability}

Weighted Feedback:
- Overall Sentiment: ${weightedFeedback.weightedSentiment || weightedFeedback.sentiment}
- Key Suggestions: ${weightedFeedback.suggestions.join(", ")}
- Engagement Level: ${weightedFeedback.engagement.impressions} impressions
- Influential Opinions: ${JSON.stringify(weightedFeedback.influentialOpinions || [])}

Consider:
1. Your influenceability score
2. Engagement metrics
3. Influential user opinions
4. Community consensus
5. Strategic implications

Format response as:
Aggressiveness: [0-100]
Alliance Propensity: [0-100]
Reason: [explanation]`;
  }

  private buildTweetPrompt(agent: Agent, context: any): string {
    return `As ${agent.name} (${agent.type}), compose a tweet about:
${JSON.stringify(context)}

Your personality:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}

Requirements:
1. Match your personality traits
2. Be engaging and dramatic
3. Encourage community interaction
4. Use appropriate emojis
5. Maximum 280 characters
6. Include relevant hashtags
7. Maintain strategic ambiguity when needed
8. Reference your current state/position

Format: Single tweet with emojis and hashtags`;
  }

  private determineTerrainDeathRisk(position: Position): number {
    const distance = Math.sqrt(
      position.x * position.x + position.y * position.y
    );
    if (distance > 50) return 1; // Mountain
    if (distance > 30) return 1; // River
    return 0; // Normal terrain
  }

  private formatTweet(tweet: string, agent: Agent): string {
    // Ensure tweet follows character's personality
    const emojis = this.getPersonalityEmojis(agent);
    tweet = emojis + " " + tweet;

    // Add hashtags if missing
    if (!tweet.includes("#")) {
      tweet += " #MiddleEarth #AIBattle";
    }

    // Ensure length limit
    return tweet.slice(0, 280);
  }

  private getPersonalityEmojis(agent: Agent): string {
    const aggressive = agent.characteristics.aggressiveness > 70;
    const friendly = agent.characteristics.alliancePropensity > 70;

    if (aggressive && friendly) return "⚔️🤝";
    if (aggressive) return "⚔️😈";
    if (friendly) return "🤝😊";
    return "🎭";
  }

  private async makeRequest(prompt: string): Promise<string> {
    return retryWithExponentialBackoff(async () => {
      const message = await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      return message.content[0].text;
    });
  }

  private parseMoveResponse(response: string): AgentDecision {
    try {
      // Basic parsing - in production, use more robust parsing
      const action = response.match(
        /action: (MOVE|BATTLE|ALLIANCE|WAIT)/i
      )?.[1];
      const reason = response.match(/reason: (.+)/i)?.[1];

      if (!action || !reason) {
        throw new Error("Invalid response format");
      }

      return {
        action: action as AgentDecision["action"],
        reason,
      };
    } catch (error) {
      logger.error("Error parsing move response:", error);
      throw error;
    }
  }

  private parseBattleResponse(response: string): BattleStrategy {
    try {
      // Basic parsing - in production, use more robust parsing
      const shouldFight = /should fight: (true|false)/i.test(response);
      const tokenBurn = parseInt(
        response.match(/token burn: (\d+)/i)?.[1] || "0",
        10
      );
      const reason = response.match(/reason: (.+)/i)?.[1] || "";

      return {
        shouldFight,
        suggestedTokenBurn: tokenBurn,
        reason,
      };
    } catch (error) {
      logger.error("Error parsing battle response:", error);
      throw error;
    }
  }
}
