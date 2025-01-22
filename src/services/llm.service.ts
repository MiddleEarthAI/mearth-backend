import {
  Agent,
  TerrainType,
  AgentDecision,
  BattleStrategy,
  CommunityFeedback,
  Position,
  Battle,
  GameState,
} from "../types/game";
import { Anthropic } from "@anthropic-ai/sdk";
import { retryWithExponentialBackoff } from "../utils/retry";

import { logger } from "../utils/logger";
import NodeCache from "node-cache";
import { ILLMService } from "../types/services";
import { PrismaClient } from "@prisma/client";
import { LLMConfig } from "@/config";

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

/**
 * Service for managing LLM interactions with sophisticated context management
 */
export class LLMService implements ILLMService {
  private anthropic: Anthropic;
  private readonly MAX_CONTEXT_LENGTH = 16000;
  private readonly config: LLMConfig;
  private readonly cache: NodeCache;

  constructor(config: LLMConfig, private readonly prisma: PrismaClient) {
    this.config = config;

    if (!this.config.apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable");
    }

    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey,
    });

    this.cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
    logger.info("LLM service initialized");
  }

  /**
   * Builds a comprehensive context for an agent
   */
  private async buildAgentContext(agentId: string): Promise<string> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        personality: true,
        context: true,
        memory: true,
        movements: {
          take: 5,
          orderBy: { timestamp: "desc" },
        },
        initiatedBattles: {
          take: 3,
          orderBy: { timestamp: "desc" },
        },
        defendedBattles: {
          take: 3,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!agent) throw new Error(`Agent ${agentId} not found`);

    // Build base context
    const baseContext = `
You are ${
      agent.name
    }, a unique agent in the Middle Earth AI game. Here's your core identity:

PERSONALITY TRAITS:
- Openness: ${agent.personality?.openness}/100 (${this.interpretTrait(
      "openness",
      agent.personality?.openness
    )})
- Conscientiousness: ${
      agent.personality?.conscientiousness
    }/100 (${this.interpretTrait(
      "conscientiousness",
      agent.personality?.conscientiousness
    )})
- Extraversion: ${agent.personality?.extraversion}/100 (${this.interpretTrait(
      "extraversion",
      agent.personality?.extraversion
    )})
- Agreeableness: ${agent.personality?.agreeableness}/100 (${this.interpretTrait(
      "agreeableness",
      agent.personality?.agreeableness
    )})
- Risk Tolerance: ${
      agent.personality?.riskTolerance
    }/100 (${this.interpretTrait(
      "riskTolerance",
      agent.personality?.riskTolerance
    )})

CURRENT STATE:
- Position: (${agent.positionX}, ${agent.positionY})
- Token Balance: ${agent.tokenBalance}
- Current Mood: ${agent.personality?.currentMood}
- Stress Level: ${agent.personality?.stressLevel}/100
- Confidence: ${agent.personality?.confidenceLevel}/100

BACKGROUND:
${agent.context?.backstory}

CURRENT GOALS:
${agent.context?.goals?.join("\n")}

CORE VALUES:
${agent.context?.values?.join("\n")}

FEARS:
${agent.context?.fears?.join("\n")}

RECENT MEMORIES:
${this.formatRecentMemories(agent.memory?.recentEvents)}

RELATIONSHIP STATUS:
${this.formatRelationships(agent.context?.relationshipMap)}

BEHAVIORAL GUIDELINES:
1. Always maintain your unique personality traits
2. Consider your current mood and stress level in decisions
3. Remember past interactions and learn from them
4. Stay true to your core values while pursuing goals
5. React to community feedback based on your adaptability level
6. Make decisions that align with your risk tolerance
`;

    return baseContext;
  }

  /**
   * Interprets numerical trait values into descriptive text
   */
  private interpretTrait(trait: string, value?: number): string {
    if (!value) return "undefined";

    const interpretations: Record<string, Record<string, string>> = {
      openness: {
        high: "Very adventurous and creative",
        medium: "Moderately open to new experiences",
        low: "Prefers familiar and traditional approaches",
      },
      // Add other trait interpretations...
    };

    const level = value >= 70 ? "high" : value >= 30 ? "medium" : "low";
    return interpretations[trait]?.[level] || `${level} ${trait}`;
  }

  /**
   * Formats recent memories into readable text
   */
  private formatRecentMemories(memories: any): string {
    if (!memories) return "No recent memories";

    try {
      const recentEvents = JSON.parse(memories.toString());
      return Object.entries(recentEvents)
        .map(([time, event]) => `${time}: ${event}`)
        .join("\n");
    } catch (error) {
      logger.error("Error parsing memories:", error);
      return "Memory data corrupted";
    }
  }

  /**
   * Formats relationship data into readable text
   */
  private formatRelationships(relationships: any): string {
    if (!relationships) return "No relationship data";

    try {
      const relationshipMap = JSON.parse(relationships.toString());
      return Object.entries(relationshipMap)
        .map(([agentId, status]) => `${agentId}: ${status}`)
        .join("\n");
    } catch (error) {
      logger.error("Error parsing relationships:", error);
      return "Relationship data corrupted";
    }
  }

  /**
   * Gets the next move for an agent
   */
  async getNextMove(agentId: string): Promise<any> {
    try {
      const context = await this.buildAgentContext(agentId);

      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `${context}

Based on your current state, personality, and recent events, what is your next move? Consider:
1. Your current position and nearby terrain
2. Nearby agents and your relationships with them
3. Your current goals and strategy
4. Community feedback and influence
5. Your mood and stress level

Respond in character as ${agentId}, explaining your thought process and decision.`,
          },
        ],
      });

      return response.content;
    } catch (error) {
      logger.error(`Error getting next move for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Gets battle strategy against an opponent
   */
  async getBattleStrategy(agentId: string, opponentId: string): Promise<any> {
    try {
      const [agentContext, opponentData] = await Promise.all([
        this.buildAgentContext(agentId),
        this.prisma.agent.findUnique({
          where: { id: opponentId },
          include: {
            personality: true,
            context: true,
          },
        }),
      ]);

      if (!opponentData) throw new Error(`Opponent ${opponentId} not found`);

      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `${agentContext}

You're facing ${opponentData.name} in battle. Consider:
1. Your battle history with them
2. Their personality traits and current state
3. Token balance comparison
4. Your current mood and confidence
5. Community support and feedback

Develop a battle strategy and explain your approach in character.`,
          },
        ],
      });

      return response.content;
    } catch (error) {
      logger.error(
        `Error getting battle strategy for agent ${agentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Processes community feedback and updates agent behavior
   */
  async processCommunityFeedback(feedback: any): Promise<any> {
    // Implementation for processing community feedback
    // This would analyze tweet interactions and update agent context
    return null;
  }

  /**
   * Generates a tweet based on an event
   */
  async generateTweet(agentId: string, event: string): Promise<string> {
    try {
      const context = await this.buildAgentContext(agentId);

      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 280, // Twitter limit
        messages: [
          {
            role: "user",
            content: `${context}

Event: ${event}

Generate a tweet about this event that:
1. Matches your personality and current mood
2. Reflects your relationship with involved agents
3. Aligns with your communication style
4. Considers your deception level for strategic advantage
5. Stays within 280 characters

Respond with just the tweet text, no additional explanation.`,
          },
        ],
      });

      return response.content[0]?.toString() || "";
    } catch (error) {
      logger.error(`Error generating tweet for agent ${agentId}:`, error);
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
    // if (gameState.terrain !== TerrainType.PLAIN) {
    //   confidence -= 10;
    // }

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

  //   private buildMovePrompt(agent: Agent, gameState: GameState): string {
  //     return `You are ${agent.name}, a ${agent.type} agent in the Middle Earth game.
  // Your characteristics:
  // - Aggressiveness: ${agent.characteristics.aggressiveness}/100
  // - Alliance Propensity: ${agent.characteristics.alliancePropensity}/100
  // - Influenceability: ${agent.characteristics.influenceability}/100

  // Current game state:
  // - Nearby agents: ${gameState.nearbyAgents.map((a) => a.name).join(", ")}
  // - Recent battles: ${gameState.recentBattles.length}
  // - Community sentiment: ${gameState.communityFeedback.sentiment}
  // - Current terrain: ${gameState.terrain}

  // Based on your characteristics and the current game state, what is your next move?
  // Respond with a structured decision including action type (MOVE/BATTLE/ALLIANCE/WAIT) and reasoning.`;
  //   }

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
    return `As ${agent.name} (${
      agent.type
    }), analyze this weighted community feedback:

Current Traits:
- Aggressiveness: ${agent.characteristics.aggressiveness}
- Alliance Propensity: ${agent.characteristics.alliancePropensity}
- Influenceability: ${agent.characteristics.influenceability}

Weighted Feedback:
- Overall Sentiment: ${
      weightedFeedback.weightedSentiment || weightedFeedback.sentiment
    }
- Key Suggestions: ${weightedFeedback.suggestions.join(", ")}
- Engagement Level: ${weightedFeedback.engagement.impressions} impressions
- Influential Opinions: ${JSON.stringify(
      weightedFeedback.influentialOpinions || []
    )}

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
