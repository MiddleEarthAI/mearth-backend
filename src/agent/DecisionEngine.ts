import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import { ActionSuggestion, TwitterInteraction } from "@/types/twitter";
import { GameAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";
import { formatDate } from "@/utils";

/**
 * DecisionEngine class handles the decision making process for AI agents
 * It processes influence scores and generates appropriate actions based on character traits and game rules
 */
class DecisionEngine {
  private readonly MIN_REPUTATION_SCORE = 0.5;

  constructor(
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter,
    private program: MearthProgram
  ) {
    console.log("🎮 Decision Engine initialized");
  }

  async decideNextAction(
    actionContext: ActionContext,
    interactions: TwitterInteraction[]
  ): Promise<void> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: actionContext.agentId },
      include: { profile: true, game: { select: { onchainId: true } } },
    });

    if (!agent) {
      console.log("❌ Agent not found");
    }
    const communitySuggestion = await this.processInteractions(interactions);

    console.info("🤖 Community suggestion", communitySuggestion);

    const { prompt } = await this.buildPrompt(
      actionContext,
      communitySuggestion
    );

    console.info("🤖 Generated AI response 🔥🔥🔥");
    console.info(prompt);

    if (prompt) {
      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          { role: "system", content: prompt },
          { role: "assistant", content: "Here is the JSON requested:\n{" },
        ],
      });
      console.info("🤖 Generated AI response 🔥🔥🔥");
      console.info(response.text);
      const action = this.parseActionJson(`{${response.text}`);
      if (!action) {
        console.log("🔥❌🔥No valid action extracted from AI response");
        return;
      }

      this.eventEmitter.emit("newAction", { actionContext, action });
    }
  }

  private async buildPrompt(
    actionContext: ActionContext,
    communitySuggestion: ActionSuggestion | null
  ): Promise<{
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
                battlesAsAttacker: {
                  where: { status: "Active" },
                  include: {
                    defender: { include: { profile: true } },
                    attacker: { include: { profile: true } },
                  },
                },
                battlesAsDefender: {
                  where: { status: "Active" },
                  include: {
                    defender: { include: { profile: true } },
                    attacker: { include: { profile: true } },
                  },
                },
                initiatedAlliances: {
                  where: { status: "Active" },
                  include: {
                    joiner: { include: { profile: true } },
                    initiator: { include: { profile: true } },
                  },
                },
                joinedAlliances: {
                  where: { status: "Active" },
                  include: {
                    joiner: { include: { profile: true } },
                    initiator: { include: { profile: true } },
                  },
                },
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
        battlesAsAttacker: {
          where: { status: "Resolved" },
          include: {
            defender: { include: { profile: true } },
            attacker: { include: { profile: true } },
            attackerAlly: { include: { profile: true } },
            defenderAlly: { include: { profile: true } },
          },
        },
        battlesAsDefender: {
          where: { status: "Resolved" },
          include: {
            defender: { include: { profile: true } },
            attacker: { include: { profile: true } },
            attackerAlly: { include: { profile: true } },
            defenderAlly: { include: { profile: true } },
          },
        },
        joinedAlliances: {
          where: { status: "Active" },
          include: {
            initiator: { include: { profile: true } },
          },
        },
        initiatedAlliances: {
          where: { status: "Active" },
          include: {
            joiner: { include: { profile: true } },
          },
        },
        coolDown: {
          where: {
            endsAt: {
              gte: new Date(),
            },
          },
        },
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
        agent: { include: { profile: { select: { xHandle: true } } } },
      },
    });

    const otherAgentInfo = await Promise.all(
      agent.game.agents
        .filter((agent) => agent.id !== actionContext.agentId)
        .map(async (agent) => {
          const [otherAgentPda] = getAgentPDA(
            this.program.programId,
            gamePda,
            agent.onchainId
          );
          const agentAccount = await this.program.account.agent.fetch(
            otherAgentPda
          );
          return {
            agent: agent,
            account: agentAccount,
          };
        })
    );

    const otherAgentsContext = await Promise.all(
      otherAgentInfo.map(async (agentInfo) => {
        const agentPosition = agentInfo.agent.mapTile;
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
          ...agentInfo.agent.initiatedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
          ...agentInfo.agent.joinedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
        ];

        const recentBattles = [
          ...agentInfo.agent.battlesAsAttacker.slice(-2),
          ...agentInfo.agent.battlesAsDefender.slice(-2),
        ].map((b) => b.type);

        // Get recent tweets for context
        const recentTweets = agentInfo.agent.tweets
          .slice(0, 2)
          .map((t) => `"${t.content}"`)
          .join(", ");

        const allianceInfo =
          activeAlliances.length > 0
            ? `Active alliances: ${activeAlliances
                .map(
                  (alliance) =>
                    `with ${
                      alliance.joinerId === agentInfo.agent.id
                        ? alliance.joiner.profile.xHandle
                        : alliance.joiner.profile.xHandle
                    }`
                )
                .join(", ")}`
            : "";

        return `
- ${agentInfo.agent.profile.name} (@${agentInfo.agent.profile.xHandle}) [MID: ${
          agentInfo.agent.onchainId
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
      })
    );

    // Build surrounding terrain info
    const surroundingTerrainInfo = nearbyTiles
      .map((tile) => {
        const occupiedBy = tile.agent?.profile?.xHandle
          ? `@${tile.agent.profile.xHandle}`
          : "Empty";
        return `(${tile.x}, ${tile.y}) ${tile.terrainType} - ${occupiedBy}`;
      })
      .join("\n");

    // Get recent tweet history
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

    // Get active battles context
    const activeBattles =
      [
        ...agent.battlesAsAttacker.map((battle) => {
          const isResolved = battle.status === "Resolved";
          const isWinner = battle.winnerId === agent.id;
          const result = isResolved
            ? isWinner
              ? "🏆 Victory"
              : "💀 Defeat"
            : "⚔️ Ongoing";

          // Get ally information for both sides
          const attackerAllyInfo = battle.attackerAllyId
            ? `Allied with @${battle.attackerAlly?.profile.xHandle}`
            : "Fighting solo";
          const defenderAllyInfo = battle.defenderAllyId
            ? `Enemy allied with @${battle.defenderAlly?.profile.xHandle}`
            : "Enemy fought alone";

          // Build battle summary with timing
          const battleTime = isResolved
            ? `Battle concluded on ${formatDate(battle.endTime!)}`
            : `Battle ongoing since ${formatDate(battle.startTime)}`;

          return `${result} | As Attacker vs @${battle.defender.profile.xHandle} | ${attackerAllyInfo} | ${defenderAllyInfo} | ${battleTime}`;
        }),
        ...agent.battlesAsDefender.map((battle) => {
          const isResolved = battle.status === "Resolved";
          const isWinner = battle.winnerId === agent.id;
          const result = isResolved
            ? isWinner
              ? "🏆 Victory"
              : "💀 Defeat"
            : "⚔️ Ongoing";

          // Get ally information for both sides
          const defenderAllyInfo = battle.defenderAllyId
            ? `Allied with @${battle.defenderAlly?.profile.xHandle}`
            : "Fighting solo";
          const attackerAllyInfo = battle.attackerAllyId
            ? `Enemy allied with @${battle.attackerAlly?.profile.xHandle}`
            : "Enemy fought alone";

          // Build battle summary with timing
          const battleTime = isResolved
            ? `Battle concluded on ${formatDate(battle.endTime!)}`
            : `Battle ongoing since ${formatDate(battle.startTime)}`;

          return `${result} | As Defender vs @${battle.attacker.profile.xHandle} | ${defenderAllyInfo} | ${attackerAllyInfo} | ${battleTime}`;
        }),
      ].join("\n") || "No battles recorded yet";

    // Get comprehensive alliance context with metadata
    const activeAlliances =
      [
        ...agent.initiatedAlliances.map((alliance) => {
          const allyHandle = alliance.joiner.profile.xHandle;
          const allianceAge = Math.floor(
            (new Date().getTime() - alliance.timestamp.getTime()) /
              (1000 * 60 * 60)
          ); // Hours
          const combinedStrength = alliance.combinedTokens || 0;
          return `🤝 INITIATED ALLIANCE
           Partner: @${allyHandle}
           Status: ${alliance.status}
           Duration: ${allianceAge}h old
           Combined Strength: ${combinedStrength} tokens`;
        }),
        ...agent.joinedAlliances.map((alliance) => {
          const allyHandle = alliance.initiator.profile.xHandle;
          const allianceAge = Math.floor(
            (new Date().getTime() - alliance.timestamp.getTime()) /
              (1000 * 60 * 60)
          ); // Hours
          const combinedStrength = alliance.combinedTokens || 0;
          return `🤝 JOINED ALLIANCE
           Partner: @${allyHandle} 
           Status: ${alliance.status}
           Duration: ${allianceAge}h old
           Combined Strength: ${combinedStrength} tokens`;
        }),
      ].join("\n\n") || "No active alliances - Operating independently";

    // Organize data into structured sections
    const AGENT_IDENTITY = {
      name: agent.profile.name,
      handle: agent.profile.xHandle,
      mid: actionContext.agentOnchainId,
      traits: agent.profile.traits as Array<{
        name: string;
        value: number;
        description: string;
      }>,
      characteristics: agent.profile.characteristics,
      lore: agent.profile.lore,
      knowledge: agent.profile.knowledge,
    };

    const GAME_STATE = {
      position: {
        current: `(${currentPosition.x}, ${currentPosition.y}) ${currentPosition.terrainType}`,
        surrounding: surroundingTerrainInfo,
      },
      tokens: {
        balance: agentAccount.tokenBalance,
        status: agentAccount.tokenBalance < 100 ? "⚠️ LOW" : "💪 STRONG",
      },
      cooldowns: agent.coolDown.reduce((acc, cd) => {
        acc[cd.type.toLowerCase()] = cd.endsAt;
        return acc;
      }, {} as Record<string, Date>),
    };

    const ACTIVE_ENGAGEMENTS = {
      battles: activeBattles || "No active battles",
      alliances: activeAlliances || "No active alliances",
      tweets: recentTweetHistory || "None",
    };

    const BATTLE_OPPORTUNITIES = otherAgentsContext.join("\n\n");

    // Build the optimized prompt
    const characterPrompt = `# AGENT IDENTITY
You are ${AGENT_IDENTITY.name} (@${AGENT_IDENTITY.handle}) [MID: ${
      AGENT_IDENTITY.mid
    }], an autonomous AI agent in Middle Earth.

## CHARACTERISTICS
${AGENT_IDENTITY.characteristics.map((char) => `• ${char}`).join("\n")}

## KNOWLEDGE BASE
${AGENT_IDENTITY.knowledge.map((k) => `• ${k}`).join("\n")}

## PERSONAL LORE
${AGENT_IDENTITY.lore.map((l) => `${l}`).join("\n\n")}

## CURRENT STATUS
🎯 Position: ${GAME_STATE.position.current}
💰 Tokens: ${GAME_STATE.tokens.balance} (${GAME_STATE.tokens.status})
⏳ Cooldowns: ${Object.entries(GAME_STATE.cooldowns)
      .map(
        ([type, until]) =>
          `${type.toUpperCase()}: ${
            until ? `until ${until.toLocaleString()}` : "READY"
          }`
      )
      .join(", ")}

## ACTIVE ENGAGEMENTS
⚔️ BATTLES:
${ACTIVE_ENGAGEMENTS.battles}

🤝 ALLIANCES:
${ACTIVE_ENGAGEMENTS.alliances}

📢 RECENT TWEETS:
${ACTIVE_ENGAGEMENTS.tweets}

## STRATEGIC OBJECTIVES
1. PRIMARY: Dominate Middle Earth through combats and alliances
   • Win battles to claim 21-30% of opponent tokens
   • Form strategic alliances only when advantageous
   • Every battle risks 10% chance of permanent death

2. PERSONAL DIRECTIVES:
${AGENT_IDENTITY.traits
  .filter((trait) => trait.value > 70)
  .map((trait) => {
    switch (trait.name) {
      case "aggression":
        return "• Seek combat for dominance";
      case "diplomacy":
        return "• Form temporary alliances against stronger foes";
      case "caution":
        return "• Choose battles with high win probability";
      case "exploration":
        return "• Secure advantageous positions";
      default:
        return "";
    }
  })
  .filter(Boolean)
  .join("\n")}

## BATTLE OPPORTUNITIES
${BATTLE_OPPORTUNITIES}

## AVAILABLE ACTIONS & RULES
1. MOVEMENT ${GAME_STATE.cooldowns.move ? "⚠️ LOCKED" : "✅ READY"}
   • Adjacent tiles only
   • 4h cooldown
   
2. BATTLE ${GAME_STATE.cooldowns.battle ? "⚠️ LOCKED" : "✅ READY"}
   • 1 tile range
   • 21-30% token reward
   • 10% death risk
   • 4h cooldown
   
3. ALLIANCE ${GAME_STATE.cooldowns.alliance ? "⚠️ LOCKED" : "✅ READY"}
   • Nearby agents only
   • Combined token pools
   • 24h cooldown
   
4. IGNORE
   • 4h cooldown
   • Blocks interactions

⚠️ VALIDATION RULES:
• No actions during cooldown
• No targeting beyond 1 tile
• No multi-tile moves
• No alliance while in one

## COMMUNITY SUGGESTION
${
  communitySuggestion
    ? `Action: ${communitySuggestion.type}
${
  communitySuggestion.target
    ? `Target: Agent MID ${communitySuggestion.target}`
    : ""
}
${
  communitySuggestion.position
    ? `Position: (${communitySuggestion.position.x}, ${communitySuggestion.position.y})`
    : ""
}
${communitySuggestion.content ? `Context: ${communitySuggestion.content}` : ""}`
    : "No community suggestions at this time."
}

## RESPONSE FORMAT
Generate a JSON response:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null,  // Target agent's MID if applicable
  "position": { "x": number, "y": number },  // Only for MOVE
  "tweet": string  // Action announcement (no hashtags, ONLY use @handles to refer to other agents)
}

Remember:
1. Write aggressive, warrior-like tweets
2. Use @handles for other agents
3. Include MID numbers for targeting
4. Respect all cooldowns`;

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

  // /**
  //  * Builds a prompt that includes feedback about the failed action
  //  */
  // private buildFeedbackPrompt(
  //   feedback: ValidationFeedback,
  //   actionContext: ActionContext
  // ): string {
  //   const { error } = feedback;
  //   if (!error) return "";

  //   let prompt = `Your last action failed with the following feedback:
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

  //   return prompt;
  // }

  /**
   * Process interactions for an agent and return suggested actions
   * @param interactions Array of Twitter interactions to process
   * @param agentOnchainId Agent's onchain identifier
   * @returns Promise<ActionSuggestion[]> Array of suggested actions based on qualified interactions
   */
  private async processInteractions(
    interactions: TwitterInteraction[]
  ): Promise<ActionSuggestion | null> {
    try {
      // Calculate reputation scores and filter qualified interactions
      const qualifiedInteractions = interactions
        .map((interaction) => {
          const reputationScore = this.calculateReputationScore(interaction);
          return {
            ...interaction,
            userMetrics: { ...interaction.userMetrics, reputationScore },
          };
        })
        .filter(
          (interaction) =>
            interaction.userMetrics.reputationScore >= this.MIN_REPUTATION_SCORE
        );

      if (qualifiedInteractions.length === 0) {
        return null;
      }

      // Process qualified interactions with LLM
      const prompt = `You are analyzing Twitter interactions with Middle Earth AI agents to determine the most strategic action suggestion.

INTERACTION ANALYSIS:
${qualifiedInteractions
  .map(
    (interaction, index) => `
Interaction ${index + 1}:
From: @${
      interaction.username
    } (Reputation Score: ${interaction.userMetrics.reputationScore.toFixed(2)})
Content: "${interaction.content}"
Engagement: ${interaction.userMetrics.likeCount} likes, ${
      interaction.userMetrics.listedCount
    } retweets
Account Quality: ${
      interaction.userMetrics.verified ? "✓ Verified" : "Not verified"
    }, ${interaction.userMetrics.followerCount} followers
`
  )
  .join("\n")}

AVAILABLE ACTIONS:
1. BATTLE - Suggest attacking a specific agent (requires target MID)
2. MOVE - Suggest movement to specific coordinates
3. FORM_ALLIANCE - Suggest forming alliance with specific agent
4. BREAK_ALLIANCE - Suggest breaking existing alliance
5. IGNORE - Suggest taking no action

RESPONSE REQUIREMENTS:
- Analyze sentiment and strategic value of each interaction
- Consider interaction author's reputation and engagement
- Determine most beneficial action for agent's success
- Must include specific coordinates for MOVE or target MID for agent-targeted actions
- Include relevant context from interactions to support the suggestion

Generate a single ActionSuggestion in JSON format:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "target": number | null,  // Target agent's MID if applicable
  "position": { "x": number, "y": number } | null,  // Required for MOVE
  "content": string  // Context/reasoning from community interactions
}`;

      const response = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        messages: [
          { role: "system", content: prompt },
          {
            role: "assistant",
            content: "Here is the ActionSuggestion:\n{",
          },
        ],
      });

      const suggestion = JSON.parse(response.text || "{}");
      return suggestion;
    } catch (error) {
      console.error("Failed to process interactions:", error);
      return null;
    }
  }

  /**
   * Calculate reputation score based on user metrics using industry standard approach
   *
   * Formula components:
   * 1. Engagement Rate: (likes + retweets) / followers
   * 2. Follower Quality: followers/following ratio with diminishing returns
   * 3. Account Activity: tweet frequency normalized
   * 4. Account Longevity: age of account with diminishing returns
   * 5. Verification Bonus: verified accounts get a moderate boost
   *
   * Each component is normalized to 0-1 range and weighted based on importance
   */
  private calculateReputationScore(interaction: TwitterInteraction): number {
    const metrics = interaction.userMetrics;
    if (!metrics) return 0;

    // Prevent division by zero
    const safeFollowers = Math.max(metrics.followerCount, 1);
    const safeFollowing = Math.max(metrics.followingCount, 1);

    // Engagement rate (30%) - Using likes and listed count as engagement signals
    const engagementRate = Math.min(
      (metrics.likeCount + metrics.listedCount) / safeFollowers,
      1
    );

    // Follower quality (25%) - Log scale to handle varying magnitudes
    const followerQuality = Math.min(
      Math.log10(metrics.followerCount / safeFollowing + 1) / 4,
      1
    );

    // Account activity (15%) - Tweet frequency normalized
    const tweetFrequency = Math.min(metrics.tweetCount / 10000, 1);

    // Account longevity (20%) - Logarithmic scale for diminishing returns
    const accountAgeInDays = metrics.accountAge / (24 * 60 * 60);
    const accountLongevity = Math.min(
      Math.log10(accountAgeInDays + 1) / Math.log10(3650), // Max 10 years
      1
    );

    // Verification bonus (10%) - Moderate boost for verified accounts
    const verificationBonus = metrics.verified ? 1 : 0;

    // Weighted sum of all components
    const reputationScore =
      engagementRate * 0.3 +
      followerQuality * 0.25 +
      tweetFrequency * 0.15 +
      accountLongevity * 0.2 +
      verificationBonus * 0.1;

    // Return final score normalized to 0-1
    return Math.min(Math.max(reputationScore, 0), 1);
  }
}

export { DecisionEngine };
