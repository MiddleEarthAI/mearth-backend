import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";
import { logger } from "@/utils/logger";
import { AgentTrait } from "@/types/agent";
import { ActionSuggestion, InfluenceScore } from "@/types/twitter";
import {
  ActionResult,
  GameAction,
  MearthProgram,
  ValidationFeedback,
} from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";
import { ActionManager } from "./ActionManager";

interface RetryContext {
  currentRetry: number;
  failureReason: string;
  previousAttempt: any;
  maxRetries: number;
}

/**
 * DecisionEngine class handles the decision making process for AI agents
 * It processes influence scores and generates appropriate actions based on character traits and game rules
 */
class DecisionEngine {
  private readonly INFLUENCE_THRESHOLD = 0.7;
  private readonly CONSENSUS_THRESHOLD = 0.6;
  private readonly CHARACTER_ALIGNMENT_WEIGHT = 0.4;
  private readonly MAX_RETRIES = 3;

  constructor(
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter,
    private program: MearthProgram
  ) {
    console.log("🎮 Decision Engine initialized");
  }

  async processInfluenceScores(
    actionContext: ActionContext,
    scores: InfluenceScore[]
  ) {
    console.log(
      `🎯 Processing influence scores for agent ${actionContext.agentId}`
    );

    const agent = await this.prisma.agent.findUnique({
      where: { id: actionContext.agentId },
      include: { profile: true, game: { select: { onchainId: true } } },
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

    const { prompt } = await this.buildPrompt(actionContext);

    const response = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: [
        {
          role: "user",
          content: prompt,
        },
        { role: "assistant", content: "Here is the JSON requested:\n{" },
      ],
    });

    const action = this.extractActionJson(response.text);

    if (action) {
      console.log(`✨ Emitting new action: ${action.type}`);
      this.eventEmitter.emit("newAction", { actionContext, action });
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

  async proceedWithoutInteractions(
    actionContext: ActionContext
  ): Promise<void> {
    console.log(
      "🤔 Deciding without interactions for agent",
      actionContext.agentOnchainId
    );

    const { prompt } = await this.buildPrompt(actionContext);

    // logger.info("🤖 Prompt");
    // logger.info(prompt);

    if (prompt) {
      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          { role: "user", content: prompt },
          // Trick the AI to return only the JSON response
          { role: "assistant", content: "Here is the JSON requested:\n{" },
        ],
      });
      logger.info("🤖 Generated AI response 🔥🔥🔥");
      logger.info(response.text);
      // append back the '{' to the json and parse
      const action = this.parseActionJson(`{${response.text}`);

      console.log("🤖 Generated AI response");
      console.log(action);

      // Execute with feedback handling
      // await this.executeActionWithFeedback(actionContext, action);
      this.eventEmitter.emit("newAction", { actionContext, action });
    }
  }

  private async buildPrompt(actionContext: ActionContext): Promise<{
    prompt: string;
    actionContext: ActionContext;
  }> {
    const [gamePda] = getGamePDA(
      this.program.programId,
      actionContext.gameOnchainId
    );
    const [agentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      actionContext.agentOnchainId
    );
    const agentAccount = await this.program.account.agent.fetch(agentPda);
    console.log("🤖 Agent account", agentAccount);
    if (!agentAccount) {
      console.log("❌ Agent not found");

      return { prompt: "", actionContext };
    }
    const agent = await this.prisma.agent.findUnique({
      where: {
        id: actionContext.agentId,
        gameId: actionContext.gameId,
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
      return { prompt: "", actionContext };
    }

    // Get current position
    const currentPosition = agent.mapTiles[0];
    logger.info("🔍 Current position", { currentPosition });
    if (!currentPosition) {
      console.log("❌ Agent position not found");
      return { prompt: "", actionContext };
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
    const otherAgentsPromises = agent.game.agents
      .filter((a) => a.id !== actionContext.agentId)
      .map(async (a) => {
        const [otherAgentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          a.onchainId
        );
        const agentAccount = await this.program.account.agent.fetch(
          otherAgentPda
        );
        return {
          agent: a,
          account: agentAccount,
        };
      });

    const otherAgents = await Promise.all(otherAgentsPromises);

    const otherAgentsContextPromises = otherAgents.map(async (a) => {
      const agentPosition = a.agent.mapTiles[0];
      const distance = agentPosition
        ? Math.sqrt(
            Math.pow(currentPosition.x - agentPosition.x, 2) +
              Math.pow(currentPosition.y - agentPosition.y, 2)
          )
        : Infinity;

      // Calculate direction vector to other agent
      const directionX = agentPosition
        ? agentPosition.x - currentPosition.x
        : 0;
      const directionY = agentPosition
        ? agentPosition.y - currentPosition.y
        : 0;

      // Calculate optimal path coordinates
      const pathCoords = [];
      if (agentPosition) {
        const steps = Math.max(Math.abs(directionX), Math.abs(directionY));
        for (let i = 1; i <= steps; i++) {
          const stepX = Math.round(
            currentPosition.x + (directionX * i) / steps
          );
          const stepY = Math.round(
            currentPosition.y + (directionY * i) / steps
          );
          pathCoords.push(`(${stepX}, ${stepY})`);
        }
      }

      // Get compass direction
      const angle = (Math.atan2(directionY, directionX) * 180) / Math.PI;
      const compassDirection =
        angle >= -22.5 && angle < 22.5
          ? "East"
          : angle >= 22.5 && angle < 67.5
          ? "Northeast"
          : angle >= 67.5 && angle < 112.5
          ? "North"
          : angle >= 112.5 && angle < 157.5
          ? "Northwest"
          : angle >= 157.5 || angle < -157.5
          ? "West"
          : angle >= -157.5 && angle < -112.5
          ? "Southwest"
          : angle >= -112.5 && angle < -67.5
          ? "South"
          : "Southeast";

      // Get active alliances
      const activeAlliances = [
        ...a.agent.initiatedAlliances.filter(
          (alliance) => alliance.status === AllianceStatus.Active
        ),
        ...a.agent.joinedAlliances.filter(
          (alliance) => alliance.status === AllianceStatus.Active
        ),
      ];

      const recentBattles = [
        ...a.agent.battlesAsAttacker.slice(-2),
        ...a.agent.battlesAsDefender.slice(-2),
      ].map((b) => b.type);

      const allianceInfo =
        activeAlliances.length > 0
          ? `Active alliances: ${activeAlliances
              .map(
                (alliance) =>
                  `with ${
                    alliance.joinerId === a.agent.id
                      ? alliance.initiatorId
                      : alliance.joinerId
                  }`
              )
              .join(", ")}`
          : "";

      return `
- ${a.agent.profile.name} (@${a.agent.profile.xHandle}) [MID: ${
        a.agent.onchainId
      }]
  Position: ${compassDirection} (${agentPosition?.x}, ${agentPosition?.y}) ${
        agentPosition?.terrainType
      } (${
        distance <= 1
          ? "⚠️ CRITICAL: Within battle range!"
          : `${distance.toFixed(1)} fields away`
      })
  Path to reach: ${pathCoords.join(" → ")}
  Health: ${agent.health}/100
  Recent actions: ${[...recentBattles].join(", ")}
  ${allianceInfo}
  ${distance <= 1 ? "⚠️ INTERACTION REQUIRED - Battle/Alliance/Ignore!" : ""}`;
    });

    const otherAgentsContext = (
      await Promise.all(otherAgentsContextPromises)
    ).join("\n");

    const surroundingTerrainInfo = nearbyTiles
      .map((tile) => `${tile.terrainType} at (${tile.x}, ${tile.y})`)
      .join("\n");

    const nearbyFieldsInfo = nearbyFields
      .map((field) => `${field.terrainType} at (${field.x}, ${field.y})`)
      .join("\n");

    const characterPrompt = `You are ${agent.profile.name} (@${
      agent.profile.xHandle
    }) [MID: ${
      actionContext.agentOnchainId
    }], an AI agent in Middle Earth. Your core characteristics are:
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
- Your current token balance: ${agentAccount.tokenBalance} Mearth
- Active cooldowns: ${
      agent.coolDown.map((cd) => `${cd.type} until ${cd.endsAt}`).join(", ") ||
      "None"
    }
Surrounding terrain (immediate vicinity):
${surroundingTerrainInfo}

Nearby fields (extended view):
${nearbyFieldsInfo}

Other agents in the game:
${otherAgentsContext}

CRITICAL BATTLE MECHANICS:
- When within 1 field range of another agent, you MUST choose: BATTLE, ALLIANCE, or IGNORE
- If any agent chooses BATTLE, combat is mandatory
- ALLIANCE requires mutual agreement, otherwise defaults to IGNORE
- Lost battles have 5% death risk and 21-30% token loss
- Alliances combine token power but have cooldown restrictions
- Ignoring has a 4-hour cooldown

Strategic Tweet Examples (match your personality):
- Aggressive: "Spotted @{handle} in the {terrain}. Your reign ends here! Time to test your strength in battle! ⚔️"
- Alliance: "A worthy ally in @{handle}! Let's combine our forces and dominate Middle Earth together! 🤝"
- Defensive: "Fortifying my position at {terrain}. @{handle}, approach with caution or face the consequences! 🛡️"
- Threatening: "The shadows whisper of @{handle}'s weakness. Your time in Middle Earth grows short! ⚔️"
- Strategic: "Moving through {terrain} to intercept @{handle}. Victory awaits! 🎯"
- Warning: "@{handle} spreads lies and deception! Their true nature will be revealed in battle! ⚠️"

Generate a JSON response with your next action that matches your character's personality and current situation:
{
  "type": "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE",
  "targetId": number | null, // Target agent's MID (1-4) if targeting another agent
  "position": {
    "x": number, // MapTile x coordinate if moving
    "y": number // MapTile y coordinate if moving
  },
  "tweet": string // Write an engaging tweet that reflects your character's personality and the strategic nature of your action
}

IMPORTANT: When targeting another agent, you MUST use their MID (Middleearth ID) as the targetId in your response. MIDs are numbers 1-4 that uniquely identify each agent in the game.`;

    return { prompt: characterPrompt, actionContext };
  }

  // Efficiently parse the JSON response
  private parseActionJson(response: string): GameAction | null {
    logger.info("🔍 Parsing action JSON: ", response);
    try {
      // Remove any potential preamble and get just the JSON object
      const jsonStr = response.substring(response.indexOf("{"));
      return JSON.parse(jsonStr) as GameAction;
    } catch (error) {
      console.error("Failed to parse action JSON:", error);
      // Return a default IGNORE action if parsing fails
      return null;
    }
  }

  private extractActionJson(action: string): GameAction {
    console.log("📦 Extracting action from AI response");
    return JSON.parse(action);
  }

  /**
   * Handles action execution with feedback and retries
   */
  // private async executeActionWithFeedback(
  //   actionContext: ActionContext,
  //   action: GameAction,
  //   retryContext?: RetryContext
  // ): Promise<void> {
  //   const result = await this.actionManager.executeAction(
  //     actionContext,
  //     action
  //   );

  //   if (!result.success && result.feedback) {
  //     if (!retryContext || retryContext.currentRetry < this.MAX_RETRIES) {
  //       await this.handleActionFailure(actionContext, result, retryContext);
  //     } else {
  //       logger.error("Max retries exceeded, giving up", {
  //         actionContext,
  //         action,
  //         retryContext,
  //       });
  //     }
  //   }
  // }

  /**
   * Handles failed actions by generating new decisions based on feedback
   */

  // private async handleActionFailure(
  //   actionContext: ActionContext,
  //   result: ActionResult,
  //   retryContext?: RetryContext
  // ): Promise<void> {
  //   const currentRetry = (retryContext?.currentRetry || 0) + 1;

  //   // Build feedback prompt
  //   const feedbackPrompt = this.buildFeedbackPrompt(
  //     result.feedback!,
  //     actionContext
  //   );

  //   logger.info("🔄 Retrying action with feedback", {
  //     attempt: currentRetry,
  //     feedback: result.feedback,
  //   });

  //   const response = await generateText({
  //     model: anthropic("claude-3-5-sonnet-20240620"),
  //     messages: [
  //       {
  //         role: "user",
  //         content: feedbackPrompt,
  //       },
  //       {
  //         role: "assistant",
  //         content: "Here is the JSON for the adjusted action:\n{",
  //       },
  //     ],
  //   });

  //   const newAction = this.parseActionJson(`{${response.text}`);

  //   // Retry with new action
  //   // await this.executeActionWithFeedback(actionContext, newAction, {
  //   //   currentRetry,
  //   //   maxRetries: this.MAX_RETRIES,
  //   //   failureReason: result.feedback!.error?.message || "Unknown error",
  //   //   previousAttempt: result,
  //   // });
  // }

  /**
   * Builds a prompt that includes feedback about the failed action
   */
  //   private buildFeedbackPrompt(
  //     feedback: ValidationFeedback,
  //     actionContext: ActionContext
  //   ): string {
  //     const { error } = feedback;
  //     if (!error) return "";

  //     let prompt = `Your last action failed with the following feedback:
  // Type: ${error.type}
  // Message: ${error.message}
  // Current State: ${JSON.stringify(error.context.currentState, null, 2)}
  // Attempted Action: ${JSON.stringify(error.context.attemptedAction, null, 2)}
  // ${
  //   error.context.suggestedFix
  //     ? `Suggested Fix: ${error.context.suggestedFix}`
  //     : ""
  // }

  // Please provide a new action that addresses this feedback. Consider:
  // 1. The specific error type and message
  // 2. The current state of the game
  // 3. Any suggested fixes provided
  // 4. Your character's traits and goals

  // Generate a new action that avoids the previous error while still working towards your strategic objectives.`;

  //     return prompt;
  //   }

  async resetAgentState() {}
}

export { DecisionEngine };
