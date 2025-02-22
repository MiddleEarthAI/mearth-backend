import { anthropic } from "@ai-sdk/anthropic";
import { AllianceStatus, PrismaClient } from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import { ActionSuggestion, TwitterInteraction } from "@/types/twitter";
import { GameAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";
import { formatDate } from "@/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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
    const agentAccount = await this.program.account.agent.fetch(agentPda);
    if (!agentAccount) {
      return { prompt: "", actionContext };
    }

    const agent = await this.prisma.agent.findUnique({
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
              gte: currentTime,
            },
          },
        },
        ignoring: true, // Include agents this agent is ignoring
        ignoredBy: true, // Include agents that are ignoring this agent
      },
    });

    if (!agent) {
      console.log("Agent not found or not alive");
      return { prompt: "", actionContext };
    }

    const currentMaptile = agent.mapTile;
    console.info("Current position", { currentMaptile });
    if (!currentMaptile) {
      console.log("Agent position not found");
      return { prompt: "", actionContext };
    }

    // Get nearby map tiles (8 surrounding tiles)
    const nearbyTiles = await this.prisma.mapTile.findMany({
      where: {
        AND: [
          { x: { gte: currentMaptile.x - 1, lte: currentMaptile.x + 1 } },
          { y: { gte: currentMaptile.y - 1, lte: currentMaptile.y + 1 } },
          {
            NOT: { AND: [{ x: currentMaptile.x }, { y: currentMaptile.y }] },
          },
        ],
      },
      include: {
        agent: {
          include: { profile: { select: { xHandle: true, onchainId: true } } },
        },
      },
    });

    const aliveAgents = await Promise.all(
      agent.game.agents.map(async (agent) => {
        const agentAccount = await this.program.account.agent.fetch(agent.pda);
        return {
          agent: agent,
          account: agentAccount,
        };
      })
    );

    const aliveAgentsContext = aliveAgents.map(async (agentInfo) => {
      const agentMaptile = agentInfo.agent.mapTile;
      const distance = agentMaptile
        ? Math.sqrt(
            Math.pow(currentMaptile.x - agentMaptile.x, 2) +
              Math.pow(currentMaptile.y - agentMaptile.y, 2)
          )
        : Infinity;

      // Calculate direction vector to other agent
      const directionX = agentMaptile ? agentMaptile.x - currentMaptile.x : 0;
      const directionY = agentMaptile ? agentMaptile.y - currentMaptile.y : 0;

      // Calculate optimal path coordinates
      const pathCoords = [];
      if (agentMaptile) {
        const steps = Math.max(Math.abs(directionX), Math.abs(directionY));
        for (let i = 1; i <= steps; i++) {
          const stepX = Math.round(currentMaptile.x + (directionX * i) / steps);
          const stepY = Math.round(currentMaptile.y + (directionY * i) / steps);
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
        ...agentInfo.agent.battlesAsAttacker.slice(-2), // Only last 2 battles
        ...agentInfo.agent.battlesAsDefender.slice(-2),
      ].map((b) => b.type);

      // Get recent tweets for context
      // Get most recent tweets with content, type and timestamp for better context
      const recentTweets = agentInfo.agent.tweets
        .slice(0, 3) // Get last 3 tweets for more context
        .map((t) => ({
          content: t.content,
          type: t.type,
          timestamp: formatDate(t.timestamp),
        }))
        .map((t) => `"${t.content}" (${t.type} - ${t.timestamp})`)
        .join(", ");

      const allianceInfo =
        activeAlliances.length > 0
          ? `Active alliances: ${activeAlliances
              .map((alliance) => {
                const allyProfile =
                  alliance.initiatorId === agentInfo.agent.id
                    ? alliance.joiner.profile
                    : alliance.initiator.profile;
                return `with ${allyProfile.xHandle} (${allyProfile.name})`;
              })
              .join(", ")}`
          : "No active alliances";

      return `
- ${agentInfo.agent.profile.name} (@${agentInfo.agent.profile.xHandle}) [MID: ${
        agentInfo.agent.onchainId
      }]
  
  Current Status:
  --------------
  Position: ${compassDirection} at (${agentMaptile?.x}, ${agentMaptile?.y})
  Terrain: ${agentMaptile?.terrainType} 
  ${
    distance <= 1
      ? "⚠️ CRITICAL: Enemy within battle range!"
      : `Distance: ${distance.toFixed(1)} fields away`
  }
  
  Recent Activity:
  --------------
  ${
    recentTweets
      ? `Latest Communications:\n  ${recentTweets}`
      : "No recent communications"
  }
  
  Strategic Information:
  -------------------
  Movement Path: ${pathCoords.join(" → ")}
  Battle History: ${[...recentBattles].join(", ") || "No recent battles"}
  
  Diplomatic Relations:
  ------------------
  ${allianceInfo}
  
  ${
    distance <= 1
      ? `
  ⚠️ CRITICAL DECISION REQUIRED ⚠️
  Available Actions:
  - BATTLE: Engage in direct combat
  - FORM_ALLIANCE: Seek diplomatic resolution
  - BREAK_ALLIANCE: Sever existing ties
  - IGNORE: Maintain distance and observe
  `
      : ""
  }
  
  Character Context:
  ----------------
  ${
    agentInfo.agent.profile.onchainId === 1
      ? "A ruthless detective seeking justice at any cost. Known for solving every case but feared for extreme methods."
      : agentInfo.agent.profile.onchainId === 3
      ? "The carefree prince of Middle Earth, known for reckless behavior and running from responsibilities."
      : agentInfo.agent.profile.onchainId === 2
      ? "A determined kitchen worker pursuing truth about a mysterious incident at the palace."
      : agentInfo.agent.profile.onchainId === 4
      ? "An aging wanderer with vast knowledge of Middle Earth, haunted by mysterious encounters."
      : "Agent background unknown"
  }`;
    });

    // Build detailed terrain and occupancy information for nearby tiles
    const surroundingTerrainInfo = nearbyTiles
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
          : "Empty";

        // Format terrain description with coordinates and occupancy
        return `Location (${tile.x}, ${tile.y}): ${
          tile.terrainType.charAt(0).toUpperCase() + tile.terrainType.slice(1) // Capitalize first letter
        } terrain - ${occupiedBy}`;
      })
      .join("\n");

    // Get recent tweet history and format based on character lore
    const recentTweetHistory = agent.tweets
      .map((tweet) => {
        // Format tweet based on character's personality and background
        let tweetContext = "";
        if (agent.profile.onchainId === 1) {
          // Purrlock Paws - Detective focused on justice
          tweetContext = "🔍 Investigation";
        } else if (agent.profile.onchainId === 2) {
          // Scootles - Kitchen worker seeking truth
          tweetContext = "🍳 Kitchen Tales";
        } else if (agent.profile.onchainId === 3) {
          // Sir Gullihop - Carefree prince
          tweetContext = "👑 Royal Musings";
        } else if (agent.profile.onchainId === 4) {
          // Wanderleaf - Aging explorer
          tweetContext = "🌿 Wanderer's Log";
        }

        return {
          content: tweet.content,
          interactions: tweet.interactions.length,
          type: tweet.type,
          context: tweetContext,
        };
      })
      .map(
        (t) =>
          `- [${t.context}] ${t.content} (${t.interactions} interactions, type: ${t.type})`
      )
      .join("\n");

    // Get active battles context
    const resolvedBattles =
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
            (currentTime.getTime() - alliance.timestamp.getTime()) /
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
            (currentTime.getTime() - alliance.timestamp.getTime()) /
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
      postExamples: agent.profile.postExamples,
    };

    const GAME_STATE = {
      position: {
        current: `(${currentMaptile.x}, ${currentMaptile.y}) ${currentMaptile.terrainType}`,
        surrounding: surroundingTerrainInfo,
      },
      tokens: {
        balance: agentAccount.stakedBalance / LAMPORTS_PER_SOL,
        status:
          agentAccount.stakedBalance / LAMPORTS_PER_SOL < 1000
            ? "⚠️ LOW"
            : "💪 STRONG",
      },
      cooldowns: agent.coolDown.reduce((acc, cd) => {
        acc[cd.type.toLowerCase()] = cd.endsAt;
        return acc;
      }, {} as Record<string, Date>),
    };

    const RECENT_ENGAGEMENTS = {
      battles: resolvedBattles || "No active battles",
      alliances: activeAlliances || "No active alliances",
      tweets: recentTweetHistory || "None",
    };

    const FellowAgentsContext = aliveAgentsContext.join("\n\n");

    // Add action availability checks
    const activeCooldowns = new Set(agent.coolDown.map((cd) => cd.type));
    const isInBattle =
      agent.battlesAsAttacker.length > 0 || agent.battlesAsDefender.length > 0;
    const isInAlliance =
      agent.initiatedAlliances.length > 0 || agent.joinedAlliances.length > 0;

    // Get all agents this agent is ignoring or being ignored by
    const ignoredAgentIds = new Set([
      ...agent.ignoring.map((ig) => ig.ignoredAgentId),
      ...agent.ignoredBy.map((ig) => ig.agentId),
    ]);

    // Get nearby agents for interaction checks
    const nearbyAgents = await this.prisma.agent.findMany({
      where: {
        mapTile: {
          OR: [
            {
              x: {
                in: [agent.mapTile.x - 1, agent.mapTile.x, agent.mapTile.x + 1],
              },
              y: {
                in: [agent.mapTile.y - 1, agent.mapTile.y, agent.mapTile.y + 1],
              },
            },
          ],
        },
        id: { not: agent.id },
        isAlive: true,
        gameId: actionContext.gameId,
        NOT: {
          id: { in: Array.from(ignoredAgentIds) },
        },
      },
    });

    // Build available actions section
    const AVAILABLE_ACTIONS = {
      move: !activeCooldowns.has("Move") && !isInBattle,
      battle:
        !activeCooldowns.has("Battle") &&
        !isInBattle &&
        nearbyAgents.length > 0,
      formAlliance:
        !activeCooldowns.has("Alliance") &&
        !isInBattle &&
        !isInAlliance &&
        nearbyAgents.length > 0,
      breakAlliance: isInAlliance && !isInBattle,
      ignore:
        !activeCooldowns.has("Ignore") &&
        !isInBattle &&
        nearbyAgents.some((na) => !ignoredAgentIds.has(na.id)),
    };

    // Build the optimized prompt based on game mechanics and character lore
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

# AGENT STATUS
You are ${AGENT_IDENTITY.name} (@${AGENT_IDENTITY.handle})
Current Position: (${GAME_STATE.position.current.x}, ${
      GAME_STATE.position.current.y
    })
$MEARTH Balance: ${GAME_STATE.tokens.balance} tokens
Health: ${isAlive ? "Alive" : "Dead"}
In Battle: ${isInBattle ? "Yes" : "No"}
In Alliance: ${isInAlliance ? "Yes" : "No"}

# GAME MECHANICS
- Movement: One field per hour to any adjacent tile
- Battle: 5% death risk, 21-30% token transfer on loss
- Alliances: Share token power, 4hr battle cooldown after breaking
- Ignore: 4hr interaction cooldown with ignored agent

# NEARBY AGENTS (Within 1 Field Range)
${nearbyAgents
  .map(
    (a) =>
      `- ${a.profile.name} (@${a.profile.xHandle}): ${a.profile.tokens} $MEARTH`
  )
  .join("\n")}

# AVAILABLE ACTIONS
${Object.entries(AVAILABLE_ACTIONS)
  .filter(([_, available]) => available)
  .map(([action]) => {
    switch (action) {
      case "move":
        return "- MOVE to adjacent tile";
      case "battle":
        return "- BATTLE (Win chance based on token ratio)";
      case "formAlliance":
        return "- FORM_ALLIANCE (Share token power)";
      case "breakAlliance":
        return "- BREAK_ALLIANCE (4hr battle cooldown)";
      case "ignore":
        return "- IGNORE (4hr interaction cooldown)";
    }
  })
  .join("\n")}

# COMMUNITY SUGGESTION
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
    : "No active suggestions"
}

Generate a strategic action following game mechanics:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null,  // Required for agent interactions
  "position": { "x": number, "y": number } | null,  // Required for movement
  "tweet": string  // Action announcement (no hashtags, use @handles for other agents but not yourself, NO MID in tweet)
}`;
    // End of Selection

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
      // Calculate reputation scores and filter qualified interactions
      // Only process first 50 tweets
      const qualifiedInteractions = interactions
        .slice(0, 50) // Limit to first 50 interactions
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
      (metrics.likeCount + metrics.reputationScore) / safeFollowers,
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
