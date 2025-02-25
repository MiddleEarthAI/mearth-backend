import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, Battle, Prisma, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import { ActionSuggestion, TwitterInteraction } from "@/types/twitter";
import { GameAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";
import { formatDate } from "@/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type BattleWithRelations = Prisma.BattleGetPayload<{
  include: {
    defender: { include: { profile: true } };
    attacker: { include: { profile: true } };
    attackerAlly: { include: { profile: true } };
    defenderAlly: { include: { profile: true } };
  };
}>;

/**
 * DecisionEngine class handles the decision making process for AI agents
 * It processes influence scores and generates appropriate actions based on character traits and game rules
 */
class DecisionEngine {
  private readonly MIN_REPUTATION_SCORE = 0.3;

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
    const currentAgentRecord = await this.prisma.agent.findUnique({
      where: { id: actionContext.agentId },
      include: { profile: true, game: { select: { onchainId: true } } },
    });

    if (!currentAgentRecord) {
      console.log("❌ Agent not found");
      return;
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
    const currentTime = new Date();
    const [gamePda] = getGamePDA(
      this.program.programId,
      actionContext.gameOnchainId
    );
    const [agentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      actionContext.agentOnchainId
    );
    const currentAgentAccount = await this.program.account.agent.fetch(
      agentPda
    );
    if (!currentAgentAccount) {
      return { prompt: "", actionContext };
    }

    const currentAgentRecord = await this.prisma.agent.findUnique({
      where: {
        id: actionContext.agentId,
        isAlive: true, // Only build prompt for alive agents
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
              where: {
                NOT: {
                  id: actionContext.agentId,
                },
                isAlive: true, // Only include alive agents
              },
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
                  where: { status: "Active", gameId: actionContext.gameId },
                  include: {
                    joiner: { include: { profile: true } },
                    initiator: { include: { profile: true } },
                  },
                },
                joinedAlliances: {
                  where: { status: "Active", gameId: actionContext.gameId },
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
                coolDown: {
                  where: {
                    endsAt: {
                      gte: currentTime,
                    },
                  },
                },
              },
            },
          },
        },
        mapTile: true,
        battlesAsAttacker: {
          where: { status: "Resolved", gameId: actionContext.gameId },
          include: {
            defender: { include: { profile: true } },
            attacker: { include: { profile: true } },
            attackerAlly: { include: { profile: true } },
            defenderAlly: { include: { profile: true } },
          },
        },
        battlesAsDefender: {
          where: { status: "Resolved", gameId: actionContext.gameId },
          include: {
            defender: { include: { profile: true } },
            attacker: { include: { profile: true } },
            attackerAlly: { include: { profile: true } },
            defenderAlly: { include: { profile: true } },
          },
        },
        joinedAlliances: {
          where: { status: "Active", gameId: actionContext.gameId },
          include: {
            initiator: { include: { profile: true } },
          },
        },
        initiatedAlliances: {
          where: { status: "Active", gameId: actionContext.gameId },
          include: {
            joiner: { include: { profile: true } },
          },
        },
        coolDown: {
          where: {
            endsAt: {
              gte: currentTime,
            },
          },
        },
        ignoring: true, // Include agents this agent is ignoring
        ignoredBy: true, // Include agents that are ignoring this agent
      },
    });

    if (!currentAgentRecord) {
      console.log("currentAgentRecord not found or not alive");
      return { prompt: "", actionContext };
    }

    const currentAgentMaptile = currentAgentRecord.mapTile;
    console.info("Current position", { currentAgentMaptile });
    if (!currentAgentMaptile) {
      console.log("currentAgentRecord position not found");
      return { prompt: "", actionContext };
    }

    // Get all agents this currentAgentRecord is ignoring or being ignored by
    const ignoredAgentIds = new Set([
      ...currentAgentRecord.ignoring.map((ig) => ig.ignoredAgentId),
      ...currentAgentRecord.ignoredBy.map((ig) => ig.agentId),
    ]);

    // Get nearby agents for interaction checks
    const nearbyAgents = await this.prisma.agent.findMany({
      where: {
        mapTile: {
          OR: [
            {
              x: {
                in: [
                  currentAgentMaptile.x - 1,
                  currentAgentMaptile.x,
                  currentAgentMaptile.x + 1,
                ],
              },
              y: {
                in: [
                  currentAgentMaptile.y - 1,
                  currentAgentMaptile.y,
                  currentAgentMaptile.y + 1,
                ],
              },
            },
          ],
        },
        id: { not: currentAgentRecord.id },
        isAlive: true,
        gameId: actionContext.gameId,
        NOT: {
          id: { in: Array.from(ignoredAgentIds) },
        },
      },
      include: {
        profile: true,
      },
    });

    // Get nearby map tiles (8 surrounding tiles)
    const nearbyTiles = await this.prisma.mapTile.findMany({
      where: {
        AND: [
          {
            x: {
              gte: currentAgentMaptile.x - 1,
              lte: currentAgentMaptile.x + 1,
            },
          },
          {
            y: {
              gte: currentAgentMaptile.y - 1,
              lte: currentAgentMaptile.y + 1,
            },
          },
          {
            NOT: {
              AND: [{ x: currentAgentMaptile.x }, { y: currentAgentMaptile.y }],
            },
          },
        ],
      },
      include: {
        agent: {
          include: { profile: { select: { xHandle: true, onchainId: true } } },
        },
      },
    });

    const otherAgentsInfo = await Promise.all(
      currentAgentRecord.game.agents.map(async (otherAgent) => {
        const currentAgentAccount = await this.program.account.agent.fetch(
          otherAgent.pda
        );
        return {
          agent: otherAgent,
          account: currentAgentAccount,
        };
      })
    );

    // Build detailed terrain and occupancy information for nearby tiles
    const currentAgentSurroundingTerrainInfoString = nearbyTiles
      .map((tile) => {
        // Get occupant info if tile is occupied
        const occupiedBy = tile.agent?.profile?.xHandle
          ? `@${tile.agent.profile.xHandle} (${
              // Add character context based on onchain ID
              tile.agent.profile.onchainId === 1
                ? "Detective Purrlock Paws"
                : tile.agent.profile.onchainId === 2
                ? "Scootles the Kitchen Worker"
                : tile.agent.profile.onchainId === 3
                ? "Sir Gullihop, Prince of Middle Earth"
                : tile.agent.profile.onchainId === 4
                ? "Wanderleaf the Aging Explorer"
                : "Unknown Agent"
            })`
          : `No one - You(${currentAgentRecord.profile.xHandle}) can move here`;

        // Format terrain description with coordinates and occupancy
        return `Location (${tile.x}, ${tile.y}): ${
          tile.terrainType.charAt(0).toUpperCase() + tile.terrainType.slice(1) // Capitalize first letter
        } terrain - ${occupiedBy ? `Occupied by ${occupiedBy}` : ""}`;
      })
      .join("\n");

    // Organize data into structured sections
    const CURRENT_AGENT_IDENTITY = {
      name: currentAgentRecord.profile.name,
      handle: currentAgentRecord.profile.xHandle,
      mid: actionContext.agentOnchainId,
      traits: currentAgentRecord.profile.traits as Array<{
        name: string;
        value: number;
        description: string;
      }>,
      characteristics: currentAgentRecord.profile.characteristics,
      lore: currentAgentRecord.profile.lore,
      knowledge: currentAgentRecord.profile.knowledge,
      postExamples: currentAgentRecord.profile.postExamples,
    };

    const CURRENT_AGENT_STATE = {
      position: {
        current: `(${currentAgentMaptile.x}, ${currentAgentMaptile.y}) ${currentAgentMaptile.terrainType}`,
        surrounding: currentAgentSurroundingTerrainInfoString,
      },
      tokens: {
        balance: currentAgentAccount.stakedBalance / LAMPORTS_PER_SOL,
      },
      cooldowns: currentAgentRecord.coolDown.reduce((acc, cd) => {
        acc[cd.type.toLowerCase()] = cd.endsAt;
        return acc;
      }, {} as Record<string, Date>),
    };

    // The main prompt starts here
    const characterPrompt = `# CURRENT GAME STATE IN MIDDLE EARTH
Time: ${currentTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })}

You are ${CURRENT_AGENT_IDENTITY.name} (@${
      CURRENT_AGENT_IDENTITY.handle
    }) a warrior in Middle Earth. Middle Earth AI is a strategy game played by AI Agents on X.
Your goal is to defeat other agents in middle earth through strategic battles and alliances.

Your characteristics are: ${CURRENT_AGENT_IDENTITY.characteristics
      .map((char) => `• ${char}`)
      .join("\n")}

Your knowledge is: ${CURRENT_AGENT_IDENTITY.knowledge
      .map((k) => `• ${k}`)
      .join("\n")}

Your lore is: ${CURRENT_AGENT_IDENTITY.lore.map((l) => `${l}`).join("\n\n")}

Your traits are: ${CURRENT_AGENT_IDENTITY.traits
      .map(
        (trait) =>
          `• ${trait.name.toUpperCase()} (${trait.value}/100)
     ${trait.description}`
      )
      .join("\n\n")}

Your current position is: ${CURRENT_AGENT_STATE.position.current}
You have ${CURRENT_AGENT_STATE.tokens.balance} $MEARTH


You can move to the following surrounding tiles:
${CURRENT_AGENT_STATE.position.surrounding}



Your previous battles are:
${currentAgentRecord.battlesAsAttacker
  .map(
    (battle) =>
      `• ${battle.defender.profile.name} (@${battle.defender.profile.xHandle})`
  )
  .join("\n")}
${currentAgentRecord.battlesAsDefender
  .map(
    (battle) =>
      `• ${battle.attacker.profile.name} (@${battle.attacker.profile.xHandle})`
  )
  .join("\n")}

Your alliances are(past and active):
${currentAgentRecord.initiatedAlliances
  .map(
    (alliance) =>
      `• ${alliance.joiner.profile.name} (@${alliance.joiner.profile.xHandle})`
  )
  .join("\n")}
${currentAgentRecord.joinedAlliances
  .map(
    (alliance) =>
      `• ${alliance.initiator.profile.name} (@${alliance.initiator.profile.xHandle})`
  )
  .join("\n")}

Your recent tweets are:
${currentAgentRecord.tweets.map((tweet) => `• ${tweet.content}`).join("\n")}

Here are other agents in middle earth. a little about them:
${otherAgentsInfo
  .map(
    (agent) =>
      `• ${agent.agent.profile.name} (@${agent.agent.profile.xHandle}) [mid: ${agent.agent.onchainId}]`
  )
  .join("\n")}

Balance aggression with strategy, but stay true to your identity.

Here are nearby agents (within 1 field range):
${
  nearbyAgents
    .map((a) => `- ${a.profile.name} (@${a.profile.xHandle})`)
    .join("\n") || "No nearby agents"
}

Here is a community suggestion for you:
${
  communitySuggestion
    ? `Action: ${communitySuggestion.type}
   ${communitySuggestion.target ? `Target: @${communitySuggestion.target}` : ""}
${
  communitySuggestion.position
    ? `Move to: (${communitySuggestion.position.x}, ${communitySuggestion.position.y})`
    : ""
}
   Context: ${communitySuggestion.content || "None"}`
    : "No community suggestions"
}

As ${
      CURRENT_AGENT_IDENTITY.name
    }, generate ONE strategic action in this format. You must return only the JSON with nothing 
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null,  // Agent's MID for interactions
  "position": { "x": number, "y": number } | null,  // Required ONLY for MOVE
  "tweet": string  // In-character announcement (use @handles for others, no self-mentions). try not to repeat the same tweet(see recent tweets for reference)
}

Requirements:
- MOVE: Adjacent coordinates only, check occupancy
- BATTLE/ALLIANCE/IGNORE: Only for adjacent agents (≤1 distance)
- Maintain character voice in tweet
- No hashtags or self-mentions
- Include relevant @handles
- Factor in terrain and relationships
- Consider recent events impact`;

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
      console.log("[PROCESS_INTERACTIONS] Starting to process interactions...");
      console.log(
        `[PROCESS_INTERACTIONS] Total interactions received: ${interactions.length}`
      );

      // Calculate reputation scores and filter qualified interactions
      // Only process first 50 tweets
      const qualifiedInteractions = interactions
        .slice(0, 50) // Limit to first 50 interactions
        .map((interaction) => {
          const reputationScore = this.calculateReputationScore(interaction);
          console.log(
            `[REPUTATION_CALC] @${
              interaction.username
            }: ${reputationScore.toFixed(2)}`
          );
          return {
            ...interaction,
            userMetrics: { ...interaction.userMetrics, reputationScore },
          };
        })
        .filter(
          (interaction) =>
            interaction.userMetrics.reputationScore >= this.MIN_REPUTATION_SCORE
        );

      console.log(
        `[PROCESS_INTERACTIONS] Qualified interactions after filtering: ${qualifiedInteractions.length}`
      );

      if (qualifiedInteractions.length === 0) {
        console.log(
          "[PROCESS_INTERACTIONS] No qualified interactions found, returning null"
        );
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
      interaction.userMetrics.reputationScore
    } reputation score
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

      console.log("[LLM_REQUEST] Sending prompt to Claude for processing...");

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

      console.log(
        "[LLM_RESPONSE] Received response from Claude",
        response.text
      );

      const suggestion = JSON.parse(`{${response.text}`);
      console.log("[ACTION_SUGGESTION] Generated suggestion:", suggestion);
      return suggestion;
    } catch (error) {
      console.error(
        "[PROCESS_INTERACTIONS_ERROR] Failed to process interactions:",
        error
      );
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
    // pass every interaction just for testing
    return 1;
    const metrics = interaction.userMetrics;
    if (!metrics) return 0;

    // Prevent division by zero
    const safeFollowers = Math.max(metrics.followerCount, 1);
    const safeFollowing = Math.max(metrics.followingCount, 1);

    // Engagement rate (30%) - Using likes and reputation as engagement signals
    // Adjusted to be more lenient with the ratio
    const engagementRate = Math.min(
      ((metrics.likeCount + metrics.reputationScore * 100) / safeFollowers) *
        10,
      1
    );

    // Follower quality (25%) - Adjusted log scale for better distribution
    const followerQuality = Math.min(
      Math.log10(safeFollowers / safeFollowing + 1) / 2,
      1
    );

    // Account activity (15%) - Normalized with lower threshold
    const tweetFrequency = Math.min(metrics.tweetCount / 1000, 1);

    // Account longevity (20%) - Adjusted scale for more reasonable distribution
    const accountAgeInDays = metrics.accountAge / (24 * 60 * 60);
    const accountLongevity = Math.min(
      Math.log10(accountAgeInDays + 1) / Math.log10(365), // Max 1 year
      1
    );

    // Verification bonus (10%) - Kept as is
    const verificationBonus = metrics.verified ? 1 : 0;

    // Weighted sum of all components
    const reputationScore =
      engagementRate * 0.3 +
      followerQuality * 0.25 +
      tweetFrequency * 0.15 +
      accountLongevity * 0.2 +
      verificationBonus * 0.1;

    // Add debug logging
    console.log(`[REPUTATION_DETAILS] @${interaction.username}:`, {
      engagementRate: engagementRate.toFixed(2),
      followerQuality: followerQuality.toFixed(2),
      tweetFrequency: tweetFrequency.toFixed(2),
      accountLongevity: accountLongevity.toFixed(2),
      verificationBonus,
      finalScore: reputationScore.toFixed(2),
    });

    // Return final score normalized to 0-1
    return Math.min(Math.max(reputationScore, 0), 1);
  }
}

export { DecisionEngine };
