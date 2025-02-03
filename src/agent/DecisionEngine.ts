import { anthropic } from "@ai-sdk/anthropic";
import { PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

/**
 * DecisionEngine class handles the decision making process for AI agents
 * It processes influence scores and generates appropriate actions based on character traits and game rules
 */
class DecisionEngine {
  private readonly INFLUENCE_THRESHOLD = 0.7;
  private readonly CONSENSUS_THRESHOLD = 0.6;
  private readonly CHARACTER_ALIGNMENT_WEIGHT = 0.4;

  constructor(
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter
  ) {
    console.log("🎮 Decision Engine initialized");
  }

  async processInfluenceScores(
    agentId: string,
    scores: InfluenceScore[]
  ): Promise<ActionSuggestion | null> {
    console.log(`🎯 Processing influence scores for agent ${agentId}`);

    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { agentProfile: true },
    });

    if (!agent) {
      console.log("❌ Agent not found");
      return null;
    }

    console.log("👥 Grouping suggestions based on similarity");
    const groupedSuggestions = this.groupSuggestions(scores);

    console.log("🏆 Finding dominant suggestion");
    const dominantSuggestion = this.findDominantSuggestion(groupedSuggestions);

    if (!dominantSuggestion) {
      console.log("❌ No dominant suggestion found");
      return null;
    }

    console.log("⚖️ Calculating character alignment");
    const alignmentScore = this.calculateCharacterAlignment(
      dominantSuggestion.suggestion,
      agent.agentProfile.traits as unknown as AgentTrait[]
    );

    const shouldAct =
      dominantSuggestion.totalInfluence > this.INFLUENCE_THRESHOLD &&
      dominantSuggestion.consensus > this.CONSENSUS_THRESHOLD &&
      alignmentScore > this.CHARACTER_ALIGNMENT_WEIGHT;

    console.log(`🤔 Decision metrics:
      - Influence: ${dominantSuggestion.totalInfluence}
      - Consensus: ${dominantSuggestion.consensus}
      - Alignment: ${alignmentScore}
      - Should Act: ${shouldAct}`);

    const response = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: [
        {
          role: "user",
          content: `You are an AI agent in Middle Earth. Generate a JSON response with your next action. The action must follow game rules and your character traits.

Action Types:
{
  "type": "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE",
  "target": string | null, // Agent ID if targeting another agent
  "position": {
    "x": number,
    "y": number
  },
  "reason": string, // Strategic explanation
  "announcement": string // X-ready post text
}

Character Traits:
- Scootles: Social, medium influence, alliance-seeking but battle-ready
- Purrlock Paws: Hostile loner, hard to influence, aggressive when approached  
- Wanderleaf: Insecure wanderer, easily influenced, guidance-seeking
- Sir Gullihop: Naive, friendly, medium influence, trusting

Game Rules:
- Move 1 field/hour on 689-field map
- Mountain: 2 turn delay
- River: 1 turn delay
- Combat within 1 field range
- Battle outcomes based on $mearth tokens
- Alliances combine token pools
- Ignore sets 4 hour cooldown

Consider:
- Map position
- Agent relationships
- Battle history
- Token holdings
- Human engagement
- Character personality

Your action must reflect your traits and advance survival goals while maintaining character authenticity.`,
        },
        { role: "assistant", content: "Here is the JSON requested:\n{" },
      ],
    });

    console.log("🤖 Generated AI response");
    const action = this.extractAction(response.text);

    if (action) {
      console.log(`✨ Emitting new action: ${action.type}`);
      this.eventEmitter.emit("newAction", { agentId, action });
      return action;
    }

    console.log("❌ No valid action extracted");
    return null;
  }

  private groupSuggestions(scores: InfluenceScore[]): Map<string, any> {
    console.log("🔄 Grouping similar suggestions");
    const groups = new Map();

    for (const score of scores) {
      const key = this.getSuggestionKey(score.suggestion);
      const existing = groups.get(key) || {
        count: 0,
        totalInfluence: 0,
        suggestion: score.suggestion,
      };

      existing.count++;
      existing.totalInfluence += score.score;
      groups.set(key, existing);
    }

    return groups;
  }

  private getSuggestionKey(suggestion: ActionSuggestion): string {
    return `${suggestion.type}:${suggestion.target || ""}:${JSON.stringify(
      suggestion.position
    )}`;
  }

  private findDominantSuggestion(groups: Map<string, any>): {
    suggestion: ActionSuggestion;
    totalInfluence: number;
    consensus: number;
  } | null {
    console.log("🔍 Finding suggestion with highest influence");
    let best = null;
    let maxInfluence = 0;

    for (const [_, group] of groups) {
      if (group.totalInfluence > maxInfluence) {
        maxInfluence = group.totalInfluence;
        best = group;
      }
    }

    if (!best) return null;

    const totalInteractions = Array.from(groups.values()).reduce(
      (sum, g) => sum + g.count,
      0
    );

    return {
      suggestion: best.suggestion,
      totalInfluence: best.totalInfluence,
      consensus: best.count / totalInteractions,
    };
  }

  private calculateCharacterAlignment(
    suggestion: ActionSuggestion,
    traits: AgentTrait[]
  ): number {
    console.log("🎭 Calculating character trait alignment");
    const traitMapping = {
      BATTLE: ["aggression", "bravery"],
      ALLIANCE: ["trust", "cooperation"],
      MOVE: ["caution", "exploration"],
      STRATEGY: ["intelligence", "planning"],
    };

    const relevantTraits = traitMapping[suggestion.type] || [];
    const traitScores = traits
      .filter((t) => relevantTraits.includes(t.name))
      .map((t) => t.value);

    return traitScores.length > 0
      ? traitScores.reduce((a, b) => a + b, 0) / traitScores.length
      : 0.5;
  }

  private extractAction(action: string): ActionSuggestion {
    console.log("📦 Extracting action from AI response");
    return JSON.parse(action);
  }
}

export { DecisionEngine };
