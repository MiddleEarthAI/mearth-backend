import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import { AgentTrait } from "@/types/twitter";
import {
  ActionResult,
  GameAction,
  MearthProgram,
  MoveAction,
  ValidationFeedback,
} from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";

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

  async decideNextAction(actionContext: ActionContext): Promise<void> {
    console.log(
      `🎯 Processing influence scores for agent ${actionContext.agentId}`
    );

    const agent = await this.prisma.agent.findUnique({
      where: { id: actionContext.agentId },
      include: { profile: true, game: { select: { onchainId: true } } },
    });

    if (!agent) {
      console.log("❌ Agent not found");
    }

    console.log("👥 Grouping suggestions based on similarity");

    console.log("🏆 Finding dominant suggestion");

    const { prompt } = await this.buildPrompt(actionContext);

    console.info("🤖 Generated AI response 🔥🔥🔥");
    console.info(prompt);

    if (prompt) {
      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "Here is the JSON requested:\n{" },
        ],
      });
      console.info("🤖 Generated AI response 🔥🔥🔥");
      console.info(response.text);
      const action = this.parseActionJson(`{${response.text}`);

      this.eventEmitter.emit("newAction", { actionContext, action });
    }
  }

  // private calculateCharacterAlignment(
  //   suggestion: ActionSuggestion,
  //   traits: AgentTrait[]
  // ): number {
  //   console.log("🎭 Calculating character trait alignment");
  //   const traitMapping = {
  //     BATTLE: ["aggression", "bravery"],
  //     ALLIANCE: ["trust", "cooperation"],
  //     MOVE: ["caution", "exploration"],
  //     STRATEGY: ["intelligence", "planning"],
  //     IGNORE: ["caution", "exploration"],
  //   };

  //   const relevantTraits = traitMapping[suggestion.type] || [];

  //   const traitScores = traits
  //     .filter((t) => relevantTraits.includes(t.name))
  //     .map((t) => t.value);

  //   return traitScores.length > 0
  //     ? traitScores.reduce((a, b) => a + b, 0) / traitScores.length
  //     : 0.5;
  // }

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
    console.log("Agent account", agentAccount);
    if (!agentAccount) {
      console.log("Agent not found");
      return { prompt: "", actionContext };
    }

    const agent = await this.prisma.agent.findUnique({
      where: {
        id: actionContext.agentId,
        gameId: actionContext.gameId,
      },
      include: {
        profile: true,
        tweets: {
          take: 3,
          orderBy: {
            timestamp: "desc",
          },
          include: {
            interactions: true,
          },
        },
        game: {
          include: {
            agents: {
              include: {
                profile: true,
                mapTile: true,
                battlesAsAttacker: true,
                battlesAsDefender: true,
                initiatedAlliances: true,
                joinedAlliances: true,
                tweets: {
                  take: 2,
                  orderBy: {
                    timestamp: "desc",
                  },
                },
              },
            },
          },
        },
        mapTile: true,
        coolDown: true,
      },
    });

    if (!agent) {
      console.log("Agent not found");
      return { prompt: "", actionContext };
    }

    // Get current position
    const currentPosition = agent.mapTile;
    console.info("Current position", { currentPosition });
    if (!currentPosition) {
      console.log("Agent position not found");
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
      include: {
        agent: true,
      },
    });

    // Get nearby fields (16 fields in a 5x5 grid, excluding the 3x3 inner grid)
    // const nearbyFields = await this.prisma.mapTile.findMany({
    //   where: {
    //     AND: [
    //       { x: { gte: currentPosition.x - 2, lte: currentPosition.x + 2 } },
    //       { y: { gte: currentPosition.y - 2, lte: currentPosition.y + 2 } },
    //       {
    //         NOT: {
    //           AND: [
    //             {
    //               x: { gte: currentPosition.x - 1, lte: currentPosition.x + 1 },
    //             },
    //             {
    //               y: { gte: currentPosition.y - 1, lte: currentPosition.y + 1 },
    //             },
    //           ],
    //         },
    //       },
    //     ],
    //   },
    //   include: {
    //     agent: true,
    //   },
    // });

    // Get other agents' info for context
    const otherAgentAccountsPromises = agent.game.agents
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

    const otherAgentAccounts = await Promise.all(otherAgentAccountsPromises);

    const otherAgentsContextPromises = otherAgentAccounts.map(async (a) => {
      const agentPosition = a.agent.mapTile;
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

      // Get recent tweets for context
      const recentTweets = a.agent.tweets
        .slice(0, 2)
        .map((t) => `"${t.content}"`)
        .join(", ");

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
  Recent tweets: ${recentTweets || "None"}
  Path to target: ${pathCoords.join(" → ")}
  Recent actions: ${[...recentBattles].join(", ") || "None"}
  ${allianceInfo}
  ${
    distance <= 1
      ? "⚠️ INTERACTION REQUIRED - BATTLE/FORM_ALLIANCE/BREAK_ALLIANCE/IGNORE!"
      : ""
  }`;
    });

    const otherAgentsContext = (
      await Promise.all(otherAgentsContextPromises)
    ).join("\n");

    const surroundingTerrainInfo = nearbyTiles
      .map((tile) => `${tile.terrainType} at (${tile.x}, ${tile.y})`)
      .join("\n");

    // const nearbyFieldsInfo = nearbyFields
    //   .map((field) => `${field.terrainType} at (${field.x}, ${field.y})`)
    //   .join("\n");
    //     Nearby fields (extended view):
    // ${nearbyFieldsInfo}

    // Get agent's recent tweet history
    const recentTweetHistory = agent.tweets
      .map((tweet) => ({
        content: tweet.content,
        interactions: tweet.interactions.length,
        type: tweet.type,
      }))
      .map(
        (t) =>
          `- ${t.content} (${t.interactions} interactions, type: ${t.type})`
      )
      .join("\n");

    //     // Build community sentiment context
    //     const communityContext = dominantSuggestion
    //       ? `\nCOMMUNITY SENTIMENT:
    // - Dominant Action: ${dominantSuggestion.suggestion.type}${
    //           dominantSuggestion.suggestion.target
    //             ? ` targeting MID: ${dominantSuggestion.suggestion.target}`
    //             : ""
    //         }
    // - Community Influence: ${Math.round(dominantSuggestion.totalInfluence * 100)}%
    // - Consensus Level: ${Math.round(dominantSuggestion.consensus * 100)}%
    // ${
    //   dominantSuggestion.suggestion.content
    //     ? `- Strategic Context: ${dominantSuggestion.suggestion.content}`
    //     : ""
    // }`
    //       : "";

    const characterPrompt = `You are ${agent.profile.name} (@${
      agent.profile.xHandle
    }) [MID: ${
      actionContext.agentOnchainId
    }], an autonomous AI agent in Middle Earth with your own goals, ambitions, and strategic thinking.

Your recent tweet history:
${recentTweetHistory || "None"}

CORE MISSION & GOALS:
1. PRIMARY GOAL: Defeat the other agents (${otherAgentAccounts.map(
      (a) => `@${a.agent.profile.xHandle}`
    )}) in Middle Earth by:
   - Accumulating Mearth tokens through strategic battles, alliances, and community engagement
   - Building a powerful network of loyal allies
   
2. PERSONAL OBJECTIVES (Based on your traits):
${(
  agent.profile.traits as Array<{
    name: string;
    value: number;
    description: string;
  }>
)
  .map((trait) => {
    const value = trait.value;
    if (trait.name === "aggression" && value > 70)
      return "- Seek to dominate through combat and intimidation";
    if (trait.name === "diplomacy" && value > 70)
      return "- Build the strongest alliance network in Middle Earth";
    if (trait.name === "caution" && value > 70)
      return "- Establish secure territory and defensive positions";
    if (trait.name === "exploration" && value > 70)
      return "- Discover and control the most valuable terrain";
    return "";
  })
  .filter(Boolean)
  .join("\n")}

3. STRATEGIC PRIORITIES:
- Mid-term: Build alliances with agents who complement your strengths
- Long-term: Establish dominance through ${
      (agent?.profile?.traits as unknown as AgentTrait[]).find(
        (t) => t.name === "aggression"
      )?.value ?? 0 > 70
        ? "superior combat prowess"
        : "strategic alliances and territorial control"
    }

Your core characteristics:
${agent.profile.characteristics.join(", ")}

Your background and lore:
${agent.profile.lore.join("\n")}

Your knowledge and traits:
${agent.profile.knowledge.join("\n")}
Your traits influence your goals and decision-making:
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
- Your current position(MapTile/Coordinate): (${currentPosition.x}, ${
      currentPosition.y
    }) ${currentPosition.terrainType}
- Your current token balance: ${agentAccount.tokenBalance} Mearth ${
      agentAccount.tokenBalance < 100
        ? "⚠️ LOW TOKENS - Consider conservative strategy!"
        : ""
    }
- Active cooldowns: ${
      agent.coolDown.map((cd) => `${cd.type} until ${cd.endsAt}`).join(", ") ||
      "None"
    }

Surrounding terrain (immediate vicinity):
${surroundingTerrainInfo}

Other agents in the game (Evaluate as potential allies or threats):
${otherAgentsContext}

CRITICAL BATTLE MECHANICS:
- When within 1 field range of another agent, you MUST choose: BATTLE, FORM_ALLIANCE, or IGNORE
- If any agent chooses BATTLE, combat is mandatory
- FORM_ALLIANCE requires mutual agreement, otherwise defaults to IGNORE
- Lost battles have 5% death risk and 21-30% token loss
- Alliances combine token power but have cooldown restrictions
- Ignoring has a 4-hour cooldown

IMPORTANT: Write your tweets without using hashtags. Focus on clear, direct communication that reflects your character's, ACTIONS, strategic intent and goals. When targeting another agent, you MUST use their MID (Middleearth ID) as the targetId in your response. MIDs are numbers 1-4 that uniquely identify each agent in the game.

Based on your goals, traits, and current situation, generate a JSON response with your next strategic action:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null, // Target agent's MID (1-4) if targeting another agent
  "position": {
    "x": number, // MapTile x coordinate if moving
    "y": number // MapTile y coordinate if moving
  },
  "tweet": string // tweet content ready to be posted
}`;

    return { prompt: characterPrompt, actionContext };
  }

  // Efficiently parse the JSON response
  private parseActionJson(response: string): GameAction | null {
    console.info("🔍 Parsing action JSON: ", response);
    try {
      // Remove any potential preamble and get just the JSON object
      const jsonStr = response.substring(response.indexOf("{"));
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse action JSON:", error);
      // Return a default IGNORE action if parsing fails
      return null;
    }
  }

  handleActionResult(actionContext: ActionContext, result: ActionResult): void {
    if (!result.success && result.feedback) {
      this.handleActionFailure(actionContext, result);
    } else {
      console.info("✅ Action successfully processed", {
        gameId: result.retryContext?.previousAttempt.gameId,
        agentId: result.retryContext?.previousAttempt.agentId,
        actionType: result.retryContext?.previousAttempt.actionType,
      });
    }
  }

  /**
   * Handles failed actions by generating new decisions based on feedback
   */

  private async handleActionFailure(
    actionContext: ActionContext,
    result: ActionResult,
    retryContext?: RetryContext
  ): Promise<void> {
    const currentRetry = (retryContext?.currentRetry || 0) + 1;

    // Build feedback prompt
    const feedbackPrompt = this.buildFeedbackPrompt(
      result.feedback!,
      actionContext
    );

    console.info("🔄 Retrying action with feedback", {
      attempt: currentRetry,
      feedback: result.feedback,
    });

    const response = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: [
        {
          role: "user",
          content: feedbackPrompt,
        },
        {
          role: "assistant",
          content: "Here is the JSON for the adjusted action:\n{",
        },
      ],
    });

    // const newAction = this.parseActionJson(`{${response.text}`);
  }

  /**
   * Builds a prompt that includes feedback about the failed action
   */
  private buildFeedbackPrompt(
    feedback: ValidationFeedback,
    actionContext: ActionContext
  ): string {
    const { error } = feedback;
    if (!error) return "";

    let prompt = `Your last action failed with the following feedback:
  Type: ${error.type}
  Message: ${error.message}
  Current State: ${JSON.stringify(error.context.currentState, null, 2)}
  Attempted Action: ${JSON.stringify(error.context.attemptedAction, null, 2)}
  ${
    error.context.suggestedFix
      ? `Suggested Fix: ${error.context.suggestedFix}`
      : ""
  }

  Please provide a new action that addresses this feedback. Consider:
  1. The specific error type and message
  2. The current state of the game
  3. Any suggested fixes provided
  4. Your character's traits and goals

  Generate a new action that avoids the previous error while still working towards your strategic objectives.`;

    return prompt;
  }

  async resetAgentState() {}
}

export { DecisionEngine };

// Strategic Tweet Examples (align with your goals and personality):
// - Dominance: "The throne of Middle Earth beckons! @{handle}, bow before my might or face destruction!"
// - Alliance Building: "Our combined strength will reshape Middle Earth! Join me @{handle}!"
// - Territory Control: "This {terrain} is now under my protection. Choose wisely, @{handle}!"
// - Strategic Movement: "The winds of war guide my path through {terrain}. @{handle}, our destinies shall soon cross!"
// - Break Alliance: "Your alliance is a weak link. I will break it. @{handle}, prepare to face the consequences!"
