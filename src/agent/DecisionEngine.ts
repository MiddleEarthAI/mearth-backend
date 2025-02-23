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

    // Move these declarations up before they're used
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

    const deadAgentsContextString =
      currentAgentRecord.game.agents
        .filter((agent) => !agent.isAlive)
        .map((deadAgent) => {
          // Get their last battle (the one that killed them)
          const lastBattle = [
            ...deadAgent.battlesAsAttacker,
            ...deadAgent.battlesAsDefender,
          ].sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

          // Format death context
          return `⚰️ @${deadAgent.profile.xHandle} (${deadAgent.profile.name})
        Last Position: (${deadAgent.mapTile?.x || "?"}, ${
            deadAgent.mapTile?.y || "?"
          })
        Time of Death: ${formatDate(deadAgent.deathTimestamp || new Date())}
        ${
          lastBattle
            ? `Final Battle: vs @${
                lastBattle.attackerId === deadAgent.id
                  ? lastBattle.defender.profile.xHandle
                  : lastBattle.attacker.profile.xHandle
              }`
            : "Death circumstances unknown"
        }`;
        })
        .join("\n\n") || "No fallen agents in Middle Earth yet";

    const otherAliveAgentsContextString = otherAgentsInfo.map(
      (otherAgentInfo) => {
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

        // Build battle context for LLM understanding based on schema.prisma battle model
        const otherAgentRecentBattles = [
          ...otherAgentInfo.agent.battlesAsAttacker.slice(-2), // Recent offensive battles
          ...otherAgentInfo.agent.battlesAsDefender.slice(-2), // Recent defensive battles
        ]
          .map((battle) => ({
            // Classify battle type per schema enum BattleType
            battleType:
              battle.type === "Simple"
                ? "1v1 Combat"
                : battle.type === "AgentVsAlliance"
                ? "Solo vs Alliance"
                : "Alliance vs Alliance",

            // Battle status per schema enum BattleStatus
            status:
              battle.status === "Resolved"
                ? battle.winnerId === otherAgentInfo.agent.id
                  ? "Emerged victorious"
                  : "Suffered defeat"
                : battle.status === "Cancelled"
                ? "Battle cancelled"
                : "Battle pending resolution",

            // Alliance dynamics from schema relations
            allianceContext:
              battle.attackerAllyId || battle.defenderAllyId
                ? "Fought alongside allies"
                : "Engaged in solo combat",

            // Token stakes from schema
            resourceStakes: `Committed ${
              Number(battle.tokensStaked) / LAMPORTS_PER_SOL
            } tokens`,

            // Temporal data from schema
            timing: formatDate(battle.startTime),
          }))
          .map(
            (context) =>
              `COMBAT RECORD:\n` +
              `Engagement Type: ${context.battleType}\n` +
              `Resolution: ${context.status}\n` +
              `Tactical Approach: ${context.allianceContext}\n` +
              `Resources Risked: ${context.resourceStakes}\n` +
              `Timestamp: ${context.timing}`
          )
          .join("\n\n");

        // Get recent tweets for context
        // Get most recent tweets with content, type and timestamp for better context
        const otherAgentRecentTweets = otherAgentInfo.agent.tweets
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
  
  @${otherAgentInfo.agent.profile.xHandle} Current Status:
  --------------
  Position: ${compassDirection} at (${agentMaptile?.x}, ${agentMaptile?.y})
  Terrain: ${agentMaptile?.terrainType} 
  ${
    distanceFromCurrentAgent <= 1
      ? "⚠️ CRITICAL: Enemy within battle range!"
      : `${distanceFromCurrentAgent.toFixed(1)} fields away from you (${
          currentAgentRecord.profile.xHandle
        })`
  }
  
  @${otherAgentInfo.agent.profile.xHandle} Recent Tweets:
  --------------
  ${
    otherAgentRecentTweets
      ? `\n  ${otherAgentRecentTweets}`
      : "No recent tweets"
  }
  
  Navigation Context for @${otherAgentInfo.agent.profile.xHandle}:
  -------------------
  Current Path: You (@${currentAgentRecord.profile.xHandle}) → @${
          otherAgentInfo.agent.profile.xHandle
        }
  Waypoints: ${pathCoords.join(" → ")}


  @${otherAgentInfo.agent.profile.xHandle} Battle History: ${
          [...otherAgentRecentBattles].join(", ") || "No recent battles"
        }
  
  @${otherAgentInfo.agent.profile.xHandle} Alliance History (past and present):
  ------------------
  Active Alliances:
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
  # INTERACTION DECISION MATRIX [MANDATORY SELECTION REQUIRED]
  Target Agent: @${otherAgentInfo.agent.profile.xHandle} [MID: ${
          otherAgentInfo.agent.profile.onchainId
        }]
  Distance: ${distanceFromCurrentAgent} field(s)
  Action Required: You MUST select ONE of the available actions below if you want to interact with @${
    otherAgentInfo.agent.profile.xHandle
  }
  
  ## AVAILABLE ACTIONS [SELECT ONE]
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
    ### OPTION 1: COMBAT ENGAGEMENT
    ${
      canBattle
        ? `[AVAILABLE] BATTLE
         • ActionType: "BATTLE"
         • Target: @${otherAgentInfo.agent.profile.xHandle} [MID: ${otherAgentInfo.agent.profile.onchainId}]
         • Risk: 5% mortality chance
         • Reward: 21-30% token transfer
         • Cooldown: 4 hours post-battle`
        : `[LOCKED] BATTLE
         • Status: You MUST NOT Battle ${
           otherAgentInfo.agent.profile.xHandle
         } at this time
         • Reason: ${
           currentAgentActiveCooldowns.has("Battle")
             ? "Your battle cooldown active"
             : otherAgentInfo.agent.coolDown.some((cd) => cd.type === "Battle")
             ? "Target's battle cooldown active"
             : "Combat conditions not met"
         }`
    }

    ### OPTION 2: DIPLOMATIC RELATIONS
    ${
      !existingAlliance && !allianceCooldown
        ? `[AVAILABLE] FORM_ALLIANCE
         • ActionType: "FORM_ALLIANCE"
         • Target: @${otherAgentInfo.agent.profile.xHandle} [MID: ${otherAgentInfo.agent.profile.onchainId}]
         • Effect: Shared token power
         • Duration: 4 hour commitment`
        : `[LOCKED] FORM_ALLIANCE
         • Status: You MUST NOT Form Alliance with ${
           otherAgentInfo.agent.profile.xHandle
         } at this time
         • Reason: ${
           existingAlliance
             ? "Alliance already exists"
             : allianceCooldown
             ? "Alliance cooldown active"
             : "Diplomatic restrictions"
         }`
    }

    ${
      existingAlliance
        ? `[AVAILABLE] BREAK_ALLIANCE
         • ActionType: "BREAK_ALLIANCE"
         • Target: @${otherAgentInfo.agent.profile.xHandle} [MID: ${otherAgentInfo.agent.profile.onchainId}]
         • Warning: 4hr battle cooldown
         • Effect: Ends resource sharing`
        : `[LOCKED] BREAK_ALLIANCE
         • Status: You MUST NOT Break Alliance with ${otherAgentInfo.agent.profile.xHandle} at this time
         • Reason: No active alliance`
    }

    ### OPTION 3: SOCIAL ACTIONS
    ${
      !isIgnored && !isBeingIgnored && !ignoreCooldown
        ? `[AVAILABLE] IGNORE
         • ActionType: "IGNORE"
         • Target: @${otherAgentInfo.agent.profile.xHandle} [MID: ${otherAgentInfo.agent.profile.onchainId}]
         • Effect: 4hr interaction block
         • Note: Mutual restriction`
        : `[LOCKED] IGNORE
         • Status: You MUST NOT Ignore ${
           otherAgentInfo.agent.profile.xHandle
         } at this time
         • Reason: ${
           isIgnored
             ? "You are already ignoring target"
             : isBeingIgnored
             ? "You are being ignored by target"
             : ignoreCooldown
             ? "Your ignore cooldown is active"
             : "Social restrictions"
         }`
    }

    ### OPTION 4: TACTICAL RETREAT
    [ALWAYS AVAILABLE] MOVE
    • ActionType: "MOVE"
    • Effect: Relocate to adjacent tile
    • Terrain Modifiers:
      - Mountain: +2 turns
      - River: +1 turn

    ## CURRENT RELATIONSHIP STATUS
    • Alliance: ${existingAlliance ? "Active" : "None"}
    • Social: ${
      isIgnored
        ? "Ignoring"
        : isBeingIgnored
        ? "You are being ignored by target"
        : "No Restrictions"
    }
    • Combat: ${
      [
        ...otherAgentInfo.agent.battlesAsAttacker,
        ...otherAgentInfo.agent.battlesAsDefender,
      ].some(
        (b) =>
          b.attackerId === currentAgentRecord.id ||
          b.defenderId === currentAgentRecord.id
      )
        ? "Previous Combat"
        : "No History"
    }
`;
  })()}`
      : `
    # DISTANCE ALERT: TARGET OUT OF RANGE
    Target @${
      otherAgentInfo.agent.profile.xHandle
    } is ${distanceFromCurrentAgent.toFixed(1)} fields away.
    Direct interaction unavailable.
    
    ## AVAILABLE ACTIONS [SELECT ONE]
    
    ### OPTION 1: STRATEGIC MOVEMENT
    ${
      !currentAgentActiveCooldowns.has("Move")
        ? `[AVAILABLE] MOVE 
    • ActionType: "MOVE"
    • Purpose: Close distance or maintain position`
        : `[LOCKED] MOVE
    • Status: Movement currently unavailable
    • Reason: Movement cooldown active
    • Try Again: When cooldown expires`
    }
    `
  }
  
  About @${otherAgentInfo.agent.profile.xHandle}:
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
      }
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

    // Format agent's recent tweets
    const currentAgentRecentTweetHistoryString = currentAgentRecord.tweets
      .map((tweet) => {
        return `- ${tweet.content} (${tweet.interactions.length} interactions, type: ${tweet.type})`;
      })
      .join("\n");

    // Get  past battles context
    const currentAgentPastBattles = (() => {
      // Helper function to format battle details with rich context
      const formatBattleDetails = (
        battle: BattleWithRelations,
        role: string
      ) => {
        const isResolved = battle.status === "Resolved";
        const isWinner = battle.winnerId === currentAgentRecord.id;

        // Build comprehensive battle outcome with visual indicators
        const outcome = isResolved
          ? isWinner
            ? "🏆 VICTORIOUS - Emerged triumphant in combat"
            : "💀 DEFEATED - Fell in battle but lived to fight again"
          : "⚔️ ONGOING - Locked in fierce combat";

        // Detailed alliance dynamics
        const allianceContext = (() => {
          const ownAlliance =
            role === "Attacker" ? battle.attackerAllyId : battle.defenderAllyId;
          const enemyAlliance =
            role === "Attacker" ? battle.defenderAllyId : battle.attackerAllyId;

          return `
          Our Forces: ${
            ownAlliance
              ? `Fighting alongside @${
                  role === "Attacker"
                    ? battle.attackerAlly?.profile.xHandle
                    : battle.defenderAlly?.profile.xHandle
                }`
              : "Fighting independently"
          }
          Enemy Forces: ${
            enemyAlliance
              ? `Enemy supported by @${
                  role === "Attacker"
                    ? battle.defenderAlly?.profile.xHandle
                    : battle.attackerAlly?.profile.xHandle
                }`
              : "Enemy stood alone"
          }`;
        })();

        // Rich temporal context
        const battleTiming = isResolved
          ? `Battle concluded ${formatDate(
              battle.endTime!
            )} (Duration: ${Math.floor(
              (battle.endTime!.getTime() - battle.startTime.getTime()) /
                (1000 * 60)
            )}min)`
          : `Battle rages on since ${formatDate(battle.startTime)}`;

        // Stakes and strategic implications
        const battleContext = `
          Role: ${role}
          Opponent: @${
            role === "Attacker"
              ? battle.defender.profile.xHandle
              : battle.attacker.profile.xHandle
          }
          Tokens at Stake: ${battle.tokensStaked} $MEARTH
          `;

        return `
        ### BATTLE RECORD ###
        ${outcome}
        ${battleContext}
        ${allianceContext}
        ${battleTiming}
        `;
      };

      // Combine and sort battles chronologically
      const allBattles = [
        ...currentAgentRecord.battlesAsAttacker.map((b) => ({
          ...b,
          role: "Attacker",
        })),
        ...currentAgentRecord.battlesAsDefender.map((b) => ({
          ...b,
          role: "Defender",
        })),
      ].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      // Generate comprehensive battle history
      return allBattles.length > 0
        ? allBattles
            .map((battle) => formatBattleDetails(battle, battle.role))
            .join("\n\n")
        : "📜 No battles recorded - Yet to taste combat in Middle Earth";
    })();

    // Get comprehensive alliance context with metadata
    const currentAgentActiveAlliancesString =
      [
        ...currentAgentRecord.initiatedAlliances.map((alliance) => {
          const allyHandle = alliance.joiner.profile.xHandle;
          const allianceAge = Math.floor(
            (currentTime.getTime() - alliance.timestamp.getTime()) / (1000 * 60)
          ); // Minutes
          const combinedStrength = alliance.combinedTokens || 0;
          return `🤝 INITIATED ALLIANCE
           Partner: @${allyHandle}
           Status: ${alliance.status}
           Duration: ${allianceAge}min old
           Combined Strength: ${combinedStrength} tokens`;
        }),
        ...currentAgentRecord.joinedAlliances.map((alliance) => {
          const allyHandle = alliance.initiator.profile.xHandle;
          const allianceAge = Math.floor(
            (currentTime.getTime() - alliance.timestamp.getTime()) / (1000 * 60)
          ); // Minutes
          const combinedStrength = alliance.combinedTokens || 0;
          return `🤝 JOINED ALLIANCE
           Partner: @${allyHandle} 
           Status: ${alliance.status}
           Duration: ${allianceAge}min old
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
Dead Agents: ${deadAgentsContextString}

# AGENT STATUS
You are ${CURRENT_AGENT_IDENTITY.name} (@${
      CURRENT_AGENT_IDENTITY.handle
    }). An autonomous AI agent in Middle Earth. Middle Earth AI is a strategy game played by AI Agents on X(formerly Twitter).
Current Position: ${CURRENT_AGENT_STATE.position.current}
$MEARTH Balance: ${CURRENT_AGENT_STATE.tokens.balance} tokens
Health: ${currentAgentRecord.isAlive ? "Alive" : "Dead"}
In Alliance: ${isInAlliance ? "Yes" : "No"}

# SURROUNDING TERRAIN
${CURRENT_AGENT_STATE.position.surrounding}

# RECENT EVENTS
${recentEventsString}

# RECENT ACTIVITY 
Battles: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.battles}
Active Alliances: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.alliances}
Recent Tweets: ${CURRENT_AGENT_RECENT_ENGAGEMENTS.tweets}

# OTHER AGENTS IN MIDDLE EARTH
${otherAliveAgentsContextString.join("\n\n")}

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
As ${
      CURRENT_AGENT_IDENTITY.name
    }, generate ONE strategic action in this format. You must return only the JSON with nothing extra:

{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE",
  "targetId": number | null,  // Agent's MID for interactions
  "position": { "x": number, "y": number } | null,  // Required for MOVE (choose from #SURROUNDING TERRAIN)
  "tweet": string  // In-character announcement (use @handles for others, no self-mentions). try not to repeat the same tweet(see recent tweets for reference)
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
