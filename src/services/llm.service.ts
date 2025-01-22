import {
  Agent,
  TerrainType,
  BattleOutcome,
  AgentDecision,
  BattleStrategy,
  CommunityFeedback,
  Position,
} from "../types/game";
import { Anthropic, HUMAN_PROMPT, AI_PROMPT } from "@anthropic-ai/sdk";
import { retryWithExponentialBackoff } from "../utils/retry";
import {
  parseDecision,
  parseBattleStrategy,
  parseTraitAdjustments,
} from "../utils/llmParser";
import { calculateDistance, normalizeScore } from "../utils/math";

export class LLMService {
  private anthropic: Anthropic;
  private static readonly SYSTEM_PROMPT = `You are an autonomous AI agent in the Middle Earth strategy game. You make decisions based on your character traits and the current game state. Your decisions should reflect your personality and be influenced by:

1. Character Traits:
- Aggressiveness (0-100): Determines battle likelihood
- Alliance Propensity (0-100): Determines cooperation likelihood
- Influenceability (0-100): How much community feedback affects decisions

2. Game State:
- Current position and terrain
- Nearby agents and their relationships
- Token balance and battle history
- Active alliances and their dynamics
- Community sentiment and suggestions

3. Strategic Considerations:
- Terrain risks (1% death chance in mountains/rivers)
- Battle probabilities based on token ratios
- Alliance opportunities and betrayal risks
- Community influence weighted by engagement
- Long-term survival probability

Your responses should be strategic decisions with clear reasoning, formatted as specified JSON.`;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Get agent's next strategic move with personality-driven decision making
   */
  async getNextMove(
    agent: Agent,
    gameState: {
      nearbyAgents: Agent[];
      recentBattles: any[];
      communityFeedback: CommunityFeedback;
      terrain: TerrainType;
    }
  ): Promise<AgentDecision> {
    const prompt = this.buildDecisionPrompt(agent, gameState);

    const response = await retryWithExponentialBackoff(
      async () =>
        await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          temperature: this.calculateTemperature(agent),
          system: LLMService.SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        })
    );

    const decision = parseDecision(response.content[0].text);
    return {
      ...decision,
      confidence: this.calculateConfidence(agent, decision, gameState),
      communityAlignment: this.calculateCommunityAlignment(
        decision,
        gameState.communityFeedback
      ),
    };
  }

  /**
   * Generate battle strategy with advanced probability calculations
   */
  async getBattleStrategy(
    agent: Agent,
    opponent: Agent,
    previousBattles: any[]
  ): Promise<BattleStrategy> {
    const prompt = this.buildBattlePrompt(agent, opponent, previousBattles);
    const strategy = await this.makeRequest(
      prompt,
      0.3,
      500,
      parseBattleStrategy
    );

    return {
      ...strategy,
      suggestedTokenBurn: this.calculateOptimalTokenBurn(agent, opponent),
    };
  }

  /**
   * Process community influence with weighted feedback analysis
   */
  async processCommunityFeedback(
    agent: Agent,
    feedback: CommunityFeedback
  ): Promise<{
    adjustedAggressiveness: number;
    adjustedAlliancePropensity: number;
    reason: string;
  }> {
    const weightedFeedback = this.calculateWeightedFeedback(feedback);
    const prompt = this.buildFeedbackPrompt(agent, weightedFeedback);

    return await this.makeRequest(
      prompt,
      agent.characteristics.influenceability / 100,
      500,
      parseTraitAdjustments
    );
  }

  /**
   * Generate personality-driven tweet content
   */
  async generateTweet(
    agent: Agent,
    context: {
      event: "MOVE" | "BATTLE" | "ALLIANCE" | "STATUS";
      details: any;
    }
  ): Promise<string> {
    const prompt = this.buildTweetPrompt(agent, context);

    return await this.makeRequest(prompt, 0.8, 300, (text: string) =>
      this.formatTweet(text.trim(), agent)
    );
  }

  private calculateTemperature(agent: Agent): number {
    // More aggressive agents have higher temperature for more unpredictable behavior
    return 0.3 + agent.characteristics.aggressiveness / 200;
  }

  private calculateConfidence(
    agent: Agent,
    decision: AgentDecision,
    gameState: any
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
    if (gameState.terrain !== TerrainType.NORMAL) {
      confidence -= 10;
    }

    // Normalize to 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateCommunityAlignment(
    decision: AgentDecision,
    feedback: CommunityFeedback
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

  private calculateWeightedFeedback(feedback: CommunityFeedback): any {
    return {
      ...feedback,
      weightedSentiment:
        feedback.sentiment * (feedback.engagement.impressions / 10000),
      influentialOpinions: feedback.influentialUsers
        .filter((user) => user.followerCount > 1000)
        .map((user) => ({
          ...user,
          weight: Math.log10(user.followerCount) / 10,
        })),
    };
  }

  private buildDecisionPrompt(agent: Agent, gameState: any): string {
    return `As ${agent.name} (${agent.type}), analyze the current situation:

Character Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Influenceability: ${agent.characteristics.influenceability}

Current State:
- Position: (${agent.position.x}, ${agent.position.y})
- Token Balance: ${agent.tokenBalance}
- Nearby Agents: ${JSON.stringify(gameState.nearbyAgents)}
- Recent Battles: ${JSON.stringify(gameState.recentBattles)}
- Community Feedback: ${JSON.stringify(gameState.communityFeedback)}
- Current Terrain: ${gameState.terrain}

Strategic Analysis Required:
1. Battle Opportunities (Win probability and risk assessment)
2. Alliance Possibilities (Trust evaluation and mutual benefit analysis)
3. Territory Control (Resource distribution and strategic positions)
4. Community Influence (Weighted by engagement and influence)
5. Survival Probability (Considering all factors)

Provide your decision as JSON:
{
  "action": "MOVE|BATTLE|ALLIANCE|WAIT",
  "target": {agent details} or null,
  "position": {"x": number, "y": number} or null,
  "reason": "detailed strategic explanation"
}`;
  }

  private buildBattlePrompt(
    agent: Agent,
    opponent: Agent,
    previousBattles: any[]
  ): string {
    return `As ${agent.name} (${
      agent.type
    }), analyze the potential battle with ${opponent.name}:

Character Traits:
- Your Aggressiveness: ${agent.characteristics.aggressiveness}
- Your Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Opponent Type: ${opponent.type}

Battle Context:
- Your Tokens: ${agent.tokenBalance}
- Opponent Tokens: ${opponent.tokenBalance}
- Win Probability: ${(
      (agent.tokenBalance / (agent.tokenBalance + opponent.tokenBalance)) *
      100
    ).toFixed(2)}%
- Death Risk: 5%
- Previous Battles: ${JSON.stringify(previousBattles)}
- Terrain Death Risk: ${this.determineTerrainDeathRisk(agent.position)}%

Required Analysis:
1. Battle decision (yes/no)
2. Strategic reasoning
3. Risk assessment
4. Token burn strategy
5. Survival probability

Format your response as:
Decision: [yes/no]
Reason: [strategic explanation]
Success Probability: [0-100]
Risk Level: [low/medium/high]`;
  }

  private buildFeedbackPrompt(agent: Agent, weightedFeedback: any): string {
    return `As ${agent.name} (${
      agent.type
    }), analyze this weighted community feedback:

Current Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Influenceability: ${agent.characteristics.influenceability}

Weighted Feedback:
- Overall Sentiment: ${weightedFeedback.weightedSentiment}
- Key Suggestions: ${weightedFeedback.suggestions.join(", ")}
- Engagement Level: ${weightedFeedback.engagement.impressions} impressions
- Influential Opinions: ${JSON.stringify(weightedFeedback.influentialOpinions)}

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

  private async makeRequest<T>(
    prompt: string,
    temperature: number = 0.7,
    maxTokens: number = 1000,
    parseResponse: (text: string) => T
  ): Promise<T> {
    try {
      const response = await retryWithExponentialBackoff(
        async () =>
          await this.anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: maxTokens,
            temperature,
            system: LLMService.SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          })
      );

      return parseResponse(response.content[0].text);
    } catch (error) {
      console.error("Error making LLM request:", error);
      throw new Error("Failed to process LLM request");
    }
  }
}
