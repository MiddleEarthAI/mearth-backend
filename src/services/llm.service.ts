import { Agent, TerrainType, BattleOutcome } from "../types/game";
import Anthropic from "@anthropic-ai/sdk";

export class LLMService {
  private anthropic: Anthropic;
  private static readonly SYSTEM_PROMPT = `You are an autonomous AI agent in the Middle Earth strategy game. You make decisions based on your character traits and the current game state. Your decisions should reflect your personality and be influenced by:

1. Character Traits:
- Aggressiveness (0-100): Determines battle likelihood
- Alliance Propensity (0-100): Determines cooperation likelihood
- Influenceability (0-100): How much community feedback affects decisions

2. Game State:
- Current position
- Nearby agents
- Token balance
- Active alliances
- Battle history
- Community sentiment

Your responses should be strategic decisions with clear reasoning.`;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Get agent's next strategic move
   */
  async getNextMove(
    agent: Agent,
    gameState: {
      nearbyAgents: Agent[];
      recentBattles: any[];
      communityFeedback: any[];
      terrain: TerrainType;
    }
  ): Promise<{
    action: "MOVE" | "BATTLE" | "ALLIANCE" | "WAIT";
    target?: Agent;
    position?: { x: number; y: number };
    reason: string;
  }> {
    const prompt = this.buildDecisionPrompt(agent, gameState);

    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      system: LLMService.SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return this.parseDecision(response.content[0].text);
  }

  /**
   * Generate battle strategy
   */
  async getBattleStrategy(
    agent: Agent,
    opponent: Agent,
    previousBattles: any[]
  ): Promise<{
    shouldFight: boolean;
    reason: string;
    estimatedSuccess: number;
  }> {
    const prompt = `As ${agent.name} (${
      agent.type
    }), analyze the potential battle with ${opponent.name}:

Character Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}

Battle Context:
- Your tokens: ${agent.tokenBalance}
- Opponent tokens: ${opponent.tokenBalance}
- Previous battles: ${JSON.stringify(previousBattles)}

Should you engage in battle? Consider your traits, token balance, and battle history. Provide:
1. Battle decision (yes/no)
2. Strategic reasoning
3. Estimated success probability (0-100)`;

    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 500,
      temperature: 0.3,
      system: LLMService.SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return this.parseBattleStrategy(response.content[0].text);
  }

  /**
   * Process community influence
   */
  async processCommunityFeedback(
    agent: Agent,
    feedback: {
      sentiment: number;
      suggestions: string[];
      engagement: number;
    }
  ): Promise<{
    adjustedAggressiveness: number;
    adjustedAlliancePropensity: number;
    reason: string;
  }> {
    const prompt = `As ${agent.name} (${
      agent.type
    }), analyze community feedback:

Current Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Influenceability: ${agent.characteristics.influenceability}

Community Feedback:
- Sentiment: ${feedback.sentiment}
- Suggestions: ${feedback.suggestions.join(", ")}
- Engagement Level: ${feedback.engagement}

How should your traits be adjusted based on this feedback? Consider your influenceability score.`;

    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 500,
      temperature: 0.5,
      system: LLMService.SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return this.parseTraitAdjustments(response.content[0].text);
  }

  /**
   * Generate tweet content
   */
  async generateTweet(
    agent: Agent,
    context: {
      event: "MOVE" | "BATTLE" | "ALLIANCE" | "STATUS";
      details: any;
    }
  ): Promise<string> {
    const prompt = `As ${agent.name} (${agent.type}), compose a tweet about:
${JSON.stringify(context)}

Your personality traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}

Write a tweet that:
1. Reflects your character traits
2. Is engaging and dramatic
3. Encourages community interaction
4. Uses appropriate emojis
5. Maximum 280 characters`;

    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 300,
      temperature: 0.8,
      system: LLMService.SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.content[0].text.trim();
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

What is your next strategic move? Consider:
1. Battle opportunities
2. Alliance possibilities
3. Territory exploration
4. Community suggestions
5. Terrain risks/rewards

Provide your decision as:
{
  "action": "MOVE|BATTLE|ALLIANCE|WAIT",
  "target": {agent details if applicable},
  "position": {"x": number, "y": number} if moving,
  "reason": "strategic explanation"
}`;
  }

  private parseDecision(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON found in response");
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse LLM decision:", error);
      return {
        action: "WAIT",
        reason: "Error processing decision",
      };
    }
  }

  private parseBattleStrategy(response: string): any {
    try {
      const lines = response.split("\n");
      const decision = lines
        .find((l) => l.toLowerCase().includes("decision"))
        ?.includes("yes");
      const probability = parseInt(
        lines.find((l) => l.includes("%"))?.match(/\d+/)?.[0] || "0"
      );
      const reason = lines
        .find((l) => l.toLowerCase().includes("reason"))
        ?.split(":")[1]
        ?.trim();

      return {
        shouldFight: decision,
        reason: reason || "Strategic decision",
        estimatedSuccess: probability,
      };
    } catch (error) {
      console.error("Failed to parse battle strategy:", error);
      return {
        shouldFight: false,
        reason: "Error processing strategy",
        estimatedSuccess: 0,
      };
    }
  }

  private parseTraitAdjustments(response: string): any {
    try {
      const lines = response.split("\n");
      const aggressiveness = parseInt(
        lines
          .find((l) => l.toLowerCase().includes("aggressiveness"))
          ?.match(/\d+/)?.[0] || "0"
      );
      const alliancePropensity = parseInt(
        lines
          .find((l) => l.toLowerCase().includes("alliance"))
          ?.match(/\d+/)?.[0] || "0"
      );
      const reason = lines
        .find((l) => l.toLowerCase().includes("reason"))
        ?.split(":")[1]
        ?.trim();

      return {
        adjustedAggressiveness: aggressiveness,
        adjustedAlliancePropensity: alliancePropensity,
        reason: reason || "Community influence",
      };
    } catch (error) {
      console.error("Failed to parse trait adjustments:", error);
      return {
        adjustedAggressiveness: 0,
        adjustedAlliancePropensity: 0,
        reason: "Error processing adjustments",
      };
    }
  }
}
