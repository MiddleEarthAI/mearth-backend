import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";
import { logger } from "@/utils/logger";
import { BN } from "@coral-xyz/anchor";
import { AgentTrait } from "@/types/agent";
import { ActionSuggestion, InfluenceScore } from "@/types/twitter";

export type AgentBasicInfo = {
  agentId: string;
  agentOnchainId: number;
  gameId: string;
  gameOnchainId: BN;
};

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
      include: { profile: true },
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
      agent.profile.traits as unknown as AgentTrait[]
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
      IGNORE: ["caution", "exploration"],
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

  async proceedWithoutInteractions(agentInfo: AgentBasicInfo): Promise<void> {
    console.log(
      "🤔 Deciding without interactions for agent",
      agentInfo.agentOnchainId
    );
    //     const prompt = `You are an AI agent in Middle Earth. Generate a JSON response with your next action. The action must follow game rules and your character traits.

    // Action Types:
    // {
    //   "type": "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE",
    //   "target": string | null, // Agent ID if targeting another agent
    //   "position": {
    //     "x": number,
    //     "y": number
    //   },

    //   "tweet": string // X-ready post text. example: "I'm moving to the mountains to gather resources and scout the area for potential threats."
    // }
    // `;
    const prompt = await this.buildPrompt(agentInfo);

    logger.info("🤖 Prompt");
    logger.info(prompt);

    if (prompt) {
      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          { role: "user", content: prompt },
          // Trick the AI to generate the JSON response
          { role: "assistant", content: "Here is the JSON requested:\n{" },
        ],
      });
      logger.info("🤖 Generated AI response 🔥🔥🔥");
      logger.info(response.text);
      // append back the '{' to the json and parse it
      const action = this.parseActionJson(
        `{${response.text}`
      ) as ActionSuggestion;

      console.log("🤖 Generated AI response");
      console.log(action);

      this.eventEmitter.emit("newAction", {
        agentId: agentInfo.agentId,
        action,
      });
    } else {
      this.eventEmitter.emit("newAction", {
        agentId: agentInfo.agentId,
        action: { type: "IGNORE" },
      });
    }
  }

  private async buildPrompt(agentInfo: AgentBasicInfo): Promise<string> {
    const agent = await this.prisma.agent.findUnique({
      where: {
        id: agentInfo.agentId,
        gameId: agentInfo.gameId,
      },
      include: {
        profile: true,
        game: {
          include: {
            agents: {
              include: {
                profile: true,
                mapTiles: true,
                battlesAsAttacker: true,
                battlesAsDefender: true,
                initiatedAlliances: true,
                joinedAlliances: true,
              },
            },
          },
        },
        mapTiles: true,
        coolDown: true,
      },
    });

    if (!agent) {
      console.log("❌ Agent not found");
      return "";
    }

    // Get current position
    const currentPosition = agent.mapTiles[0];
    if (!currentPosition) {
      console.log("❌ Agent position not found");
      return "";
    }

    // Get nearby map tiles (8 surrounding tiles)
    const nearbyTiles = await this.prisma.mapTile.findMany({
      where: {
        AND: [
          { x: { gte: currentPosition.x - 1, lte: currentPosition.x + 1 } },
          { y: { gte: currentPosition.y - 1, lte: currentPosition.y + 1 } },
          {
            NOT: { AND: [{ x: currentPosition.x }, { y: currentPosition.y }] },
          },
        ],
      },
    });

    // Get nearby fields (16 fields in a 5x5 grid, excluding the 3x3 inner grid)
    const nearbyFields = await this.prisma.mapTile.findMany({
      where: {
        AND: [
          { x: { gte: currentPosition.x - 2, lte: currentPosition.x + 2 } },
          { y: { gte: currentPosition.y - 2, lte: currentPosition.y + 2 } },
          {
            NOT: {
              AND: [
                {
                  x: { gte: currentPosition.x - 1, lte: currentPosition.x + 1 },
                },
                {
                  y: { gte: currentPosition.y - 1, lte: currentPosition.y + 1 },
                },
              ],
            },
          },
        ],
      },
    });

    // Get other agents' info for context
    const otherAgents = agent.game.agents.filter(
      (a) => a.onchainId !== agentInfo.agentOnchainId
    );
    const otherAgentsContext = otherAgents
      .map((a) => {
        const agentPosition = a.mapTiles[0];
        const distance = agentPosition
          ? Math.sqrt(
              Math.pow(currentPosition.x - agentPosition.x, 2) +
                Math.pow(currentPosition.y - agentPosition.y, 2)
            )
          : Infinity;

        // Get active alliances
        const activeAlliances = [
          ...a.initiatedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
          ...a.joinedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
        ];

        const recentBattles = [
          ...a.battlesAsAttacker.slice(-2),
          ...a.battlesAsDefender.slice(-2),
        ].map((b) => b.type);

        const allianceInfo =
          activeAlliances.length > 0
            ? `Active alliances: ${activeAlliances
                .map(
                  (alliance) =>
                    `with ${
                      alliance.joinerId === a.id
                        ? alliance.initiatorId
                        : alliance.joinerId
                    }`
                )
                .join(", ")}`
            : "";

        return `
- ${a.profile.name} (@${a.profile.xHandle})
  Position: (${agentPosition?.x}, ${agentPosition?.y}) ${
          agentPosition?.terrainType
        } (${
          distance <= 1
            ? "⚠️ Within range!"
            : `${distance.toFixed(1)} fields away`
        })
  Health: ${a.health}/100
  Recent actions: ${[...recentBattles].join(", ")}
  ${allianceInfo}
  ${distance <= 1 ? "⚠️ INTERACTION POSSIBLE!" : ""}`;
      })
      .join("\n");

    const surroundingTerrainInfo = nearbyTiles
      .map((tile) => `${tile.terrainType} at (${tile.x}, ${tile.y})`)
      .join("\n");

    const nearbyFieldsInfo = nearbyFields
      .map((field) => `${field.terrainType} at (${field.x}, ${field.y})`)
      .join("\n");

    const characterPrompt = `You are ${
      agent.profile.name
    }, an AI agent in Middle Earth. Your core characteristics are:
${agent.profile.characteristics.join(", ")}

Your background and lore:
${agent.profile.lore.join("\n")}

Your knowledge and traits:
${agent.profile.knowledge.join("\n")}
Your traits:
${(
  agent.profile.traits as Array<{
    name: string;
    value: number;
    description: string;
  }>
)
  .map(
    (trait) =>
      `- ${trait.name.charAt(0).toUpperCase() + trait.name.slice(1)}: ${
        trait.value
      }/100 (${
        trait.value < 30 ? "Low" : trait.value > 70 ? "High" : "Moderate"
      }) - ${trait.description}`
  )
  .join("\n")}

Current game state:
- Your health: ${agent.health}/100
- Your current position(MapTile/Coordinate): (${currentPosition.x}, ${
      currentPosition.y
    }) ${currentPosition.terrainType}
- Active cooldowns: ${
      agent.coolDown.map((cd) => `${cd.type} until ${cd.endsAt}`).join(", ") &&
      "None"
    }

Surrounding terrain (immediate vicinity):
${surroundingTerrainInfo}

Nearby fields (extended view):
${nearbyFieldsInfo}

Other agents in the game:
${otherAgentsContext}

Game rules:
1. You can move one field per hour to any of the 8 neighboring tiles
2. Mountains slow you down for 2 turns, rivers for 1 turn
3. You can battle or form alliances with agents within 1 field distance
4. Battles are probability-based on token holdings
5. Lost battles have a 5% death chance and 21-30% token loss
6. Alliances combine token power but have cooldown restrictions
7. Ignoring has a 4-hour cooldown

Generate a JSON response with your next action:
{
  "type": "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE",
  "target": string | null, // other agent Twitter handle if targeting another agent
  "position": {
    "x": number, // MapTile x coordinate if moving
    "y": number // MapTile y coordinate if moving
  },
  "tweet": string // X/Twitter-ready post text that matches your character's personality also use this to share your moves, actions and strategies.
}`;

    return characterPrompt;
  }
  // End of Selection

  // Efficiently parse the JSON response
  private parseActionJson(response: string): ActionSuggestion {
    logger.info("🔍 Parsing action JSON: ", response);
    try {
      // Remove any potential preamble and get just the JSON object
      const jsonStr = response.substring(response.indexOf("{"));
      return JSON.parse(jsonStr) as ActionSuggestion;
    } catch (error) {
      console.error("Failed to parse action JSON:", error);
      // Return a default IGNORE action if parsing fails
      return {
        type: "IGNORE",
        target: undefined,
        position: undefined,
        tweet: "Failed to parse action",
      };
    }
  }
}

export { DecisionEngine };
