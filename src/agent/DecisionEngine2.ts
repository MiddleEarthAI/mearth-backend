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

    const otherAliveAgentsContextString = await Promise.all(
      otherAgentsInfo
        .map(async (otherAgentInfo) => {
          const agentMaptile = otherAgentInfo.agent.mapTile;
          const distanceFromCurrentAgent = agentMaptile
            ? Math.sqrt(
                Math.pow(currentAgentMaptile.x - agentMaptile.x, 2) +
                  Math.pow(currentAgentMaptile.y - agentMaptile.y, 2)
              )
            : Infinity;

          // Calculate direction vector to other agent
          const directionX = agentMaptile
            ? agentMaptile.x - currentAgentMaptile.x
            : 0;
          const directionY = agentMaptile
            ? agentMaptile.y - currentAgentMaptile.y
            : 0;

          // Calculate optimal path coordinates
          const pathCoords = [];
          if (agentMaptile) {
            const steps = Math.max(Math.abs(directionX), Math.abs(directionY));
            for (let i = 1; i <= steps; i++) {
              const stepX = Math.round(
                currentAgentMaptile.x + (directionX * i) / steps
              );
              const stepY = Math.round(
                currentAgentMaptile.y + (directionY * i) / steps
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
          const otherAgentActiveAlliances = [
            ...otherAgentInfo.agent.initiatedAlliances.filter(
              (alliance) => alliance.status === AllianceStatus.Active
            ),
            ...otherAgentInfo.agent.joinedAlliances.filter(
              (alliance) => alliance.status === AllianceStatus.Active
            ),
          ];

          const otherAgentPastAlliances = [
            ...otherAgentInfo.agent.initiatedAlliances.filter(
              (alliance) => alliance.status !== AllianceStatus.Broken
            ),
            ...otherAgentInfo.agent.joinedAlliances.filter(
              (alliance) => alliance.status !== AllianceStatus.Broken
            ),
          ];

          const recentBattles = [
            ...otherAgentInfo.agent.battlesAsAttacker.slice(-2), // Only last 2 battles
            ...otherAgentInfo.agent.battlesAsDefender.slice(-2),
          ].map((b) => b.type);

          // Get recent tweets for context
          // Get most recent tweets with content, type and timestamp for better context
          const recentTweets = otherAgentInfo.agent.tweets
            .slice(0, 2) // Get last 2 tweets for more context
            .map((t) => ({
              content: t.content,
              type: t.type,
              timestamp: formatDate(t.timestamp),
            }))
            .map((t) => `"${t.content}" (${t.type} - ${t.timestamp})`)
            .join(", ");

          const activeAllianceInfo =
            otherAgentActiveAlliances.length > 0
              ? `Active alliances: ${otherAgentActiveAlliances
                  .map((alliance) => {
                    const allyProfile =
                      alliance.initiatorId === otherAgentInfo.agent.id ||
                      alliance.joinerId === otherAgentInfo.agent.id
                        ? alliance.initiator.profile
                        : alliance.joiner.profile;

                    return `with ${allyProfile.xHandle} (${allyProfile.name})`;
                  })
                  .join(", ")}`
              : "No active alliances";

          return `
- ${otherAgentInfo.agent.profile.name} (@${
            otherAgentInfo.agent.profile.xHandle
          }) [MID: ${otherAgentInfo.agent.onchainId}] 
  
  Current Status:
  --------------
  Position: ${compassDirection} at (${agentMaptile?.x}, ${agentMaptile?.y})
  Terrain: ${agentMaptile?.terrainType} 
  ${
    distanceFromCurrentAgent <= 1
      ? "⚠️ CRITICAL: Enemy within battle range!"
      : `Distance: ${distanceFromCurrentAgent.toFixed(1)} fields away`
  }
  
  Recent Tweets:
  --------------
  ${recentTweets ? `\n  ${recentTweets}` : "No recent tweets"}
  
  ${otherAgentInfo.agent.profile.xHandle} context:
  -------------------
  Your (${currentAgentRecord.profile.xHandle}) direction to ${
            otherAgentInfo.agent.profile.xHandle
          }: ${pathCoords.join(" → ")}


  ${otherAgentInfo.agent.profile.xHandle} Battle History: ${
            [...recentBattles].join(", ") || "No recent battles"
          }
  
  ${otherAgentInfo.agent.profile.xHandle} Alliance History:
  ------------------
  Alliances(past and present):
  ${activeAllianceInfo}
  
  Past Alliances:
  ${
    otherAgentPastAlliances.length > 0
      ? `\n  ${otherAgentPastAlliances
          .map((alliance) => {
            const initiator = alliance.initiator.profile;
            const joiner = alliance.joiner.profile;
            const duration = Math.floor(
              (alliance.endedAt
                ? alliance.endedAt.getTime() - alliance.timestamp.getTime()
                : 0) /
                (1000 * 60)
            );
            return `🔗 @${initiator.xHandle} ⚔️ @${
              joiner.xHandle
            } (${duration}min, ${alliance.status}, ${
              alliance.combinedTokens || 0
            } tokens)`;
          })
          .join("\n  ")}`
      : "No historical alliance"
  }
  
  ${
    distanceFromCurrentAgent <= 1
      ? `
  ⚠️ CRITICAL DECISION REQUIRED ⚠️
  Available Actions for ${currentAgentRecord.profile.xHandle} regarding ${
          otherAgentInfo.agent.profile.xHandle
        }:

  ${(() => {
    // Check battle availability
    const canBattle =
      !currentAgentActiveCooldowns.has("Battle") &&
      nearbyAgents.some((agent) => agent.id === otherAgentInfo.agent.id) &&
      !otherAgentInfo.agent.coolDown.some((cd) => cd.type === "Battle");

    // Check alliance status and cooldowns
    const existingAlliance = [
      ...currentAgentRecord.initiatedAlliances,
      ...currentAgentRecord.joinedAlliances,
    ].find(
      (a) =>
        (a.initiatorId === otherAgentInfo.agent.id ||
          a.joinerId === otherAgentInfo.agent.id) &&
        a.status === "Active"
    );

    const allianceCooldown =
      currentAgentActiveCooldowns.has("Alliance") ||
      otherAgentInfo.agent.coolDown.some((cd) => cd.type === "Alliance");

    // Check ignore status
    const isIgnored = currentAgentRecord.ignoring.some(
      (i) => i.ignoredAgentId === otherAgentInfo.agent.id
    );
    const isBeingIgnored = currentAgentRecord.ignoredBy.some(
      (i) => i.agentId === otherAgentInfo.agent.id
    );
    const ignoreCooldown = currentAgentActiveCooldowns.has("Ignore");

    return `
    ${
      canBattle
        ? `- BATTLE: 
         • Status: Available for Combat
         • Risk: 10% death chance
         • Reward: 21-30% token transfer on victory
         • Note: Initiates 4hr battle cooldown`
        : `- BATTLE:
         • Status: Unavailable
         • Reason: ${
           currentAgentActiveCooldowns.has("Battle")
             ? "Your battle cooldown active"
             : otherAgentInfo.agent.coolDown.some((cd) => cd.type === "Battle")
             ? "Target's battle cooldown active"
             : "No valid battle conditions"
         }`
    }

    ${
      !existingAlliance && !allianceCooldown
        ? `- FORM_ALLIANCE:
         • Status: Available
         • Benefits: Shared token power & mutual defense
         • Note: Creates binding 4hr commitment`
        : `- FORM_ALLIANCE:
         • Status: Unavailable
         • Reason: ${
           existingAlliance
             ? "Active alliance exists"
             : allianceCooldown
             ? "Alliance cooldown active"
             : "Unknown restriction"
         }`
    }

    ${
      existingAlliance
        ? `- BREAK_ALLIANCE:
         • Status: Available
         • Warning: Triggers 4hr battle cooldown
         • Note: Forfeits shared resources`
        : `- BREAK_ALLIANCE:
         • Status: Unavailable
         • Reason: No active alliance exists`
    }

    ${
      !isIgnored && !isBeingIgnored && !ignoreCooldown
        ? `- IGNORE:
         • Status: Available
         • Effect: 4hr interaction block
         • Note: Mutual avoidance strategy`
        : `- IGNORE:
         • Status: Unavailable
         • Reason: ${
           isIgnored
             ? "Already ignoring target"
             : isBeingIgnored
             ? "Being ignored by target"
             : ignoreCooldown
             ? "Ignore cooldown active"
             : "Unknown restriction"
         }`
    }

    Current Relationship Status:
    • Alliance: ${existingAlliance ? "Active Partners" : "No Alliance"}
    • Ignore Status: ${
      isIgnored ? "Ignoring" : isBeingIgnored ? "Being Ignored" : "None"
    }
    • Battle History: ${
      [
        ...otherAgentInfo.agent.battlesAsAttacker,
        ...otherAgentInfo.agent.battlesAsDefender,
      ].some(
        (b) =>
          b.attackerId === currentAgentRecord.id ||
          b.defenderId === currentAgentRecord.id
      )
        ? "Previous Combat"
        : "No Prior Battles"
    }`;
  })()}`
      : "DD"
  }
  
  Character Context:
  ----------------
  ${
    otherAgentInfo.agent.profile.onchainId === 1
      ? "A ruthless detective seeking justice at any cost. Known for solving every case but feared for extreme methods."
      : otherAgentInfo.agent.profile.onchainId === 3
      ? "The carefree prince of Middle Earth, known for reckless behavior and running from responsibilities."
      : otherAgentInfo.agent.profile.onchainId === 2
      ? "A determined kitchen worker pursuing truth about a mysterious incident at the palace."
      : otherAgentInfo.agent.profile.onchainId === 4
      ? "An aging wanderer with vast knowledge of Middle Earth, haunted by mysterious encounters."
      : "Agent background unknown"
  }`;
        })
        .join("\n\n")
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
          : "Empty";

        // Format terrain description with coordinates and occupancy
        return `Location (${tile.x}, ${tile.y}): ${
          tile.terrainType.charAt(0).toUpperCase() + tile.terrainType.slice(1) // Capitalize first letter
        } terrain - ${occupiedBy}`;
      })
      .join("\n");

    // Get recent tweet history and format based on character lore
    const currentAgentRecentTweetHistoryString = currentAgentRecord.tweets
      .map((tweet) => {
        // Format tweet based on character's personality and background
        let tweetContext = "";
        if (currentAgentRecord.profile.onchainId === 1) {
          // Purrlock Paws - Detective focused on justice
          tweetContext = "🔍 Investigation";
        } else if (currentAgentRecord.profile.onchainId === 2) {
          // Scootles - Kitchen worker seeking truth
          tweetContext = "🍳 Kitchen Tales";
        } else if (currentAgentRecord.profile.onchainId === 3) {
          // Sir Gullihop - Carefree prince
          tweetContext = "👑 Royal Musings";
        } else if (currentAgentRecord.profile.onchainId === 4) {
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

    // Get  past battles context
    const currentAgentPastBattles =
      [
        ...currentAgentRecord.battlesAsAttacker.map((battle) => {
          const isResolved = battle.status === "Resolved";
          const isWinner = battle.winnerId === currentAgentRecord.id;
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
        ...currentAgentRecord.battlesAsDefender.map((battle) => {
          const isResolved = battle.status === "Resolved";
          const isWinner = battle.winnerId === currentAgentRecord.id;
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
    const currentAgentActiveAlliancesString =
      [
        ...currentAgentRecord.initiatedAlliances.map((alliance) => {
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
        ...currentAgentRecord.joinedAlliances.map((alliance) => {
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
        status:
          currentAgentAccount.stakedBalance / LAMPORTS_PER_SOL < 1000
            ? "⚠️ LOW"
            : "💪 STRONG",
      },
      cooldowns: currentAgentRecord.coolDown.reduce((acc, cd) => {
        acc[cd.type.toLowerCase()] = cd.endsAt;
        return acc;
      }, {} as Record<string, Date>),
    };

    const CURRENT_AGENT_RECENT_ENGAGEMENTS = {
      battles: currentAgentPastBattles,
      alliances: currentAgentActiveAlliancesString,
      tweets: currentAgentRecentTweetHistoryString,
    };

    // Add action availability checks
    const currentAgentActiveCooldowns = new Set(
      currentAgentRecord.coolDown.map((cd) => cd.type) || []
    );

    const isInAlliance =
      currentAgentRecord.initiatedAlliances.length > 0 ||
      currentAgentRecord.joinedAlliances.length > 0;

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
    // Get recent events for context
    const recentEvents = await this.prisma.gameEvent.findMany({
      where: { gameId: actionContext.gameId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        initiator: {
          include: { profile: true },
        },
        target: {
          include: { profile: true },
        },
      },
    });

    const recentEventsString = recentEvents
      .map((event) => {
        const agentName = event.initiator.profile.name;
        const targetName = event.target?.profile.name;
        const timestamp = event.createdAt.toLocaleTimeString();

        switch (event.eventType) {
          case "BATTLE":
            return `${timestamp}: ${agentName} battled ${targetName}
            Message: ${event.message}`;
          case "ALLIANCE_FORM":
            return `${timestamp}: ${agentName} formed a new alliance with ${targetName}
            Message: ${event.message}`;
          case "ALLIANCE_BREAK":
            return `${timestamp}: ${agentName} broke their alliance with ${targetName}
            Message: ${event.message}`;
          case "MOVE":
            const metadata = event.metadata as { x: number; y: number };
            return `${timestamp}: ${agentName} moved to coordinates (${metadata.x}, ${metadata.y})
            Message: ${event.message}`;
          case "IGNORE":
            return `${timestamp}: ${agentName} is now ignoring ${targetName}
            Message: ${event.message}`;
          case "TWEET":
            return `${timestamp}: ${agentName} posted a new message on X
            Message: ${event.message}`;
          case "AGENT_DEATH":
            return `${timestamp}: ${agentName} has fallen in battle! Their journey in Middle Earth has ended.
            Message: ${event.message}`;
          default:
            return `${timestamp}: ${agentName} performed action: ${event.eventType}
            Message: ${event.message}`;
        }
      })
      .join("\n");

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
You are ${CURRENT_AGENT_IDENTITY.name} (@${
      CURRENT_AGENT_IDENTITY.handle
    }). An autonomous AI agent in Middle Earth. Middle Earth AI is a strategy game played by AI Agents on X(formerly Twitter).
Current Position: ${CURRENT_AGENT_STATE.position.current}
$MEARTH Balance: ${CURRENT_AGENT_STATE.tokens.balance} tokens
Health: ${currentAgentRecord.isAlive ? "Alive" : "Dead"}
In Alliance: ${isInAlliance ? "Yes" : "No"}

# RECENT EVENTS
${recentEventsString}

# RECENT ACTIVITY 
Battles: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.battles}
Active Alliances: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.alliances}
Recent Tweets: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.tweets}

# OTHER AGENTS IN MIDDLE EARTH
${otherAliveAgentsContextString}

# GAME MECHANICS
- Movement: One field per hour to any adjacent tile
- Battle: 5% death risk, 21-30% token transfer on loss
- Alliances: Share token power, 4hr battle cooldown after breaking
- Ignore: 4hr interaction cooldown with ignored agent

# NEARBY AGENTS (Within 1 Field Range)
${
  nearbyAgents
    .map((a) => `- ${a.profile.name} (@${a.profile.xHandle})`)
    .join("\n") || "No nearby agents"
}

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
    : "No community suggestions"
}

# ACTION GENERATION REQUIRED
As ${CURRENT_AGENT_IDENTITY.name}, generate ONE strategic action in this format:

{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null,  // Agent's MID for interactions
  "position": { "x": number, "y": number } | null,  // Required for MOVE
  "tweet": string  // In-character announcement (use @handles for others, no self-mentions)
}

Consider:
1. Your traits and background shape decision-making
2. Current position, resources, and cooldowns limit options
3. Community suggestion: ${
      communitySuggestion ? `${communitySuggestion.type}` : "None"
    }
4. Available actions vary by agent proximity (see agent details above)
5. Recent events may influence your strategy
6. Current alliances and battles in your vicinity

Requirements:
- MOVE: Adjacent tile only, check occupancy
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
