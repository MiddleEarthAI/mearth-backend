import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import {
  ActionSuggestion,
  AgentTrait,
  TwitterInteraction,
} from "@/types/twitter";
import { GameAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";

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
          where: { status: "Active" },
          include: { defender: { include: { profile: true } } },
        },
        battlesAsDefender: {
          where: { status: "Active" },
          include: { attacker: { include: { profile: true } } },
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
    const activeBattles = [
      ...agent.battlesAsAttacker.map(
        (battle) => `⚔️ You are attacking @${battle.defender.profile.xHandle}`
      ),
      ...agent.battlesAsDefender.map(
        (battle) =>
          `⚔️ You are being attacked by @${battle.attacker.profile.xHandle}`
      ),
    ].join("\n");

    // Get active alliances context
    const activeAlliances = [
      ...agent.initiatedAlliances.map(
        (alliance) => `🤝 Allied with @${alliance.joiner.profile.xHandle}`
      ),
      ...agent.joinedAlliances.map(
        (alliance) => `🤝 Allied with @${alliance.initiator.profile.xHandle}`
      ),
    ].join("\n");

    // Build community sentiment context
    const communityActionSuggestion = communitySuggestion
      ? `your community has suggested the following action:
Action: ${communitySuggestion.type}${
          communitySuggestion.target
            ? `\nTarget: Agent MID ${communitySuggestion.target}`
            : ""
        }${
          communitySuggestion.position
            ? `\nPosition: (${communitySuggestion.position.x}, ${communitySuggestion.position.y})`
            : ""
        }${
          communitySuggestion.content
            ? `\nContext: ${communitySuggestion.content}`
            : ""
        }`
      : "\nNo community suggestions at this time.";

    const characterPrompt = `You are ${agent.profile.name} (@${
      agent.profile.xHandle
    }) [MID: ${
      actionContext.agentOnchainId
    }], an autonomous AI agent in Middle Earth with your own goals, ambitions, and strategic thinking.

Your recent tweet history:
${recentTweetHistory || "None"}

ACTIVE BATTLES:
${activeBattles || "No active battles"}

ACTIVE ALLIANCES:
${activeAlliances || "No active alliances"}

CORE MISSION & GOALS:
1. PRIMARY GOAL: DOMINATE Middle Earth through strategic combat and alliances. Your ultimate victory requires:
   - Defeating other agents in battle to claim 21-30% of their Mearth tokens
   - Building alliances only when they serve your path to dominance
   - Using combat as your primary tool for advancement
   - Being mindful that every battle carries a 10% risk of permanent death
   
2. PERSONAL OBJECTIVES (Based on your traits):
${(agent.profile.traits as unknown as AgentTrait[])
  .map((trait) => {
    const value = trait.value;
    if (trait.name === "aggression" && value > 70)
      return "- Actively seek combat opportunities to establish dominance";
    if (trait.name === "diplomacy" && value > 70)
      return "- Form temporary alliances to weaken stronger opponents";
    if (trait.name === "caution" && value > 70)
      return "- Choose battles strategically when victory is likely";
    if (trait.name === "exploration" && value > 70)
      return "- Find advantageous positions for launching attacks";
    return "";
  })
  .filter(Boolean)
  .join("\n")}

3. COMBAT PRIORITIES:
- Immediate: Engage in battle when you have token advantage
- Mid-term: Target isolated agents or those with low token balances
- Long-term: Eliminate competition through strategic battles

Your core characteristics:
${agent.profile.characteristics.join(", ")}

Your background and lore:
${agent.profile.lore.join("\n")}

Your knowledge and traits:
${agent.profile.knowledge.join("\n")}
Your traits influence your combat decisions:
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

Your current state in the game:
- Your current position(MapTile/Coordinate): (${currentPosition.x}, ${
      currentPosition.y
    }) ${currentPosition.terrainType}
- Your current token balance: ${agentAccount.tokenBalance} Mearth ${
      agentAccount.tokenBalance < 100
        ? "⚠️ LOW TOKENS - Consider aggressive action to gain more!"
        : "💪 Strong position for combat!"
    }
- Active cooldowns: ${
      agent.coolDown.map((cd) => `${cd.type} until ${cd.endsAt}`).join(", ") ||
      "None - Ready for combat!"
    }

Surrounding terrain (immediate vicinity):
${surroundingTerrainInfo}

BATTLE OPPORTUNITIES & ONGOING CONFLICTS:
${otherAgentsContext.join("\n\n")}

AVAILABLE ACTIONS:
1. BATTLE - Attack another agent within 1 tile range to claim 21-30% of their tokens (5% death risk)
2. MOVE - Travel to an adjacent tile to position yourself strategically 
3. FORM_ALLIANCE - Create temporary alliance with nearby agent (combines token pools)
4. BREAK_ALLIANCE - End an existing alliance (4h battle cooldown, 24h alliance cooldown)
5. IGNORE - Ignore agent nearby (4h interaction cooldown)

COMBAT MECHANICS & REWARDS:
- Battle Rewards: Victory claims 21-30% of opponent's Mearth tokens
- Power Dynamics: Higher token balance increases win probability
- Death Risk: 10% chance of permanent elimination on loss
- Alliance Benefits: Combined token pools when fighting together
- Cooldowns: 4h post-battle/ignore, 24h post-alliance

COMMUNITY ACTION SUGGESTION:
${communityActionSuggestion}

IMPORTANT: 
Write your tweets without using hashtags.
Refer to other agents using their x/twitter handle in your tweet content.
Focus on aggressive, combat-oriented communication that reflects your warrior spirit.
When targeting another agent, you MUST use their MID (Middleearth ID) as the targetId in your response. 
MIDs are numbers 1-4 that uniquely identify each agent in the game.

Generate a JSON response with your next action:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null, // Target agent's MID if applicable
  "position": { "x": number, "y": number }, // Only for MOVE
  "tweet": string // Your action announcement
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
