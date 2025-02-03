import { PrismaClient } from "@prisma/client";
import EventEmitter from "events";

// Decision Engine
class DecisionEngine {
  private readonly INFLUENCE_THRESHOLD = 0.7;
  private readonly CONSENSUS_THRESHOLD = 0.6;
  private readonly CHARACTER_ALIGNMENT_WEIGHT = 0.4;

  constructor(
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter
  ) {}

  async processInfluenceScores(
    agentId: string,
    scores: InfluenceScore[]
  ): Promise<ActionSuggestion | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { traits: true },
    });

    if (!agent) return null;

    const groupedSuggestions = this.groupSuggestions(scores);
    const dominantSuggestion = this.findDominantSuggestion(groupedSuggestions);

    if (!dominantSuggestion) return null;

    const alignmentScore = this.calculateCharacterAlignment(
      dominantSuggestion.suggestion,
      agent.traits
    );

    const shouldAct =
      dominantSuggestion.totalInfluence > this.INFLUENCE_THRESHOLD &&
      dominantSuggestion.consensus > this.CONSENSUS_THRESHOLD &&
      alignmentScore > this.CHARACTER_ALIGNMENT_WEIGHT;

    if (shouldAct) {
      const action = this.generateAction(dominantSuggestion.suggestion, agent);
      this.eventEmitter.emit("newAction", { agentId, action });
      return action;
    }

    return null;
  }

  private groupSuggestions(scores: InfluenceScore[]): Map<string, any> {
    const groups = new Map();

    // explanation
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
    // Map action types to relevant traits
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

  private generateAction(
    suggestion: ActionSuggestion,
    agent: any
  ): ActionSuggestion {
    // Add randomization to maintain unpredictability
    const randomFactor = 0.8 + Math.random() * 0.4;

    // Clone and modify suggestion
    return {
      ...suggestion,
      content: this.generateActionContent(suggestion, agent),
    };
  }

  private generateActionContent(
    suggestion: ActionSuggestion,
    agent: any
  ): string {
    // Template-based content generation
    const templates = {
      BATTLE: [
        "Time to face {target}! They won't know what hit them.",
        "I've had enough of {target}'s schemes. Let's settle this!",
        "The moment has come to challenge {target}!",
      ],
      ALLIANCE: [
        "Together we're stronger, {target}. Let's join forces!",
        "I propose an alliance, {target}. What do you say?",
        "{target}, we could achieve great things together.",
      ],
      MOVE: [
        "Heading to {position}. The journey continues...",
        "My path leads to {position}. Who knows what awaits?",
        "Moving towards {position}. Keep your eyes open!",
      ],
      STRATEGY: [
        "Time to put this plan into action!",
        "A new strategy unfolds...",
        "Watch closely as this plan comes together.",
      ],
    };

    const template =
      templates[suggestion.type][
        Math.floor(Math.random() * templates[suggestion.type].length)
      ];

    return template
      .replace("{target}", suggestion.target || "")
      .replace("{position}", JSON.stringify(suggestion.position || ""));
  }
}

export { DecisionEngine };
