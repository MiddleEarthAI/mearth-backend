import { anthropic } from "@ai-sdk/anthropic";
import {
  AllianceStatus,
  Battle,
  MapTile,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { generateText } from "ai";
import EventEmitter from "events";

import { ActionSuggestion, TwitterInteraction } from "@/types/twitter";
import { GameAction, MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { ActionContext } from "@/types";
import { formatDate } from "@/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { connection, getAgentVault } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";

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
    let communitySuggestion = null;
    try {
      communitySuggestion = await this.processInteractions(interactions);
    } catch (error) {
      console.error("Error processing interactions", error);
    }

    console.info("🤖 Community suggestion", communitySuggestion);

    const { prompt } = await this.buildPrompt(
      actionContext,
      communitySuggestion
    );
    console.log("🤖 Testing Prompt", prompt);
    // return;

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
    const currentAgentVault = await getAgentVault(actionContext.agentOnchainId);

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

    // Get nearby map tiles (8 surrounding tiles)
    const tilesInRange = await this.getTilesInRange(
      currentAgentMaptile.x,
      currentAgentMaptile.y
    );

    // Map of nearby tile coordinates for O(1) lookup
    const nearbyTileMap = new Set(
      tilesInRange.map((tile) => `${tile.x},${tile.y}`)
    );

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
    const currentAgentSurroundingTerrainInfoString = tilesInRange
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
        return `Map Tile (${tile.x}, ${tile.y}): ${
          tile.terrainType.charAt(0).toUpperCase() + tile.terrainType.slice(1) // Capitalize first letter
        } terrain - ${occupiedBy ? `Occupied by ${occupiedBy}` : ""}`;
      })
      .join("\n");

    const currentAgentActiveCooldowns = new Set(
      currentAgentRecord.coolDown.map((cd) => cd.type) || []
    );

    const otherAliveAgentsContextString = await Promise.all(
      otherAgentsInfo.map(async (otherAgentInfo) => {
        const agentMaptile = otherAgentInfo.agent.mapTile;
        const otherAgentVault = await getAgentVault(
          otherAgentInfo.agent.onchainId
        );

        // Check if other agent is in nearby tiles
        const isClose =
          agentMaptile &&
          nearbyTileMap.has(`${agentMaptile.x},${agentMaptile.y}`);

        // Get compass direction
        const angle =
          (Math.atan2(
            agentMaptile?.y - currentAgentMaptile.y,
            agentMaptile?.x - currentAgentMaptile.x
          ) *
            180) /
          Math.PI;
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
            resourceStakes: `Committed ${Number(battle.tokensStaked)} tokens`,

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

        // Other agents context string starts here

        return `

This is (@${otherAgentInfo.agent.profile.xHandle}) [MID: ${
          otherAgentInfo.agent.onchainId
        }].
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
}

his/her current status:
Position: ${compassDirection} at (${agentMaptile?.x}, ${agentMaptile?.y})
Terrain: ${agentMaptile?.terrainType} 
Token Balance: ${new BN(otherAgentVault.amount).div(
          new BN(LAMPORTS_PER_SOL)
        )} $MEARTH

his/her recent tweets:
  ${
    otherAgentRecentTweets
      ? `\n  ${otherAgentRecentTweets}`
      : "No recent tweets"
  }
  
You can navigate to @${
          otherAgentInfo.agent.profile.xHandle
        } location using the following waypoints:
Waypoints: ${this.getWaypoints(currentAgentMaptile, agentMaptile)}


his/her battle history: 
${[...otherAgentRecentBattles].join(", ") || "No recent battles"}
  
his/her alliance history (past and present):
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
  isClose
    ? `
  Action required per the game mechanics(which you must follow), choose one of the following actions:
${(() => {
  // Check battle availability
  const canBattleThisAgent =
    !currentAgentActiveCooldowns.has("Battle") &&
    tilesInRange.some((tile) => tile.agent?.id === otherAgentInfo.agent.id) &&
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
    1. Battle
    ${
      canBattleThisAgent
        ? `[AVAILABLE] BATTLE
           Action: "BATTLE"
           Target: @${otherAgentInfo.agent.profile.xHandle}
           Description: You can engage in combat with this agent. Battles risk tokens for potential rewards.`
        : `[LOCKED] BATTLE
           YOU CAN NOT (AND MUST NOT) BATTLE @${
             otherAgentInfo.agent.profile.xHandle
           }
           Reason: ${
             currentAgentActiveCooldowns.has("Battle")
               ? "Your battle cooldown active"
               : otherAgentInfo.agent.coolDown.some(
                   (cd) => cd.type === "Battle"
                 )
               ? "Target's battle cooldown active"
               : "Combat conditions not met"
           }`
    }

    2. Form Alliance
    ${
      !existingAlliance && !allianceCooldown
        ? `[AVAILABLE] FORM_ALLIANCE
           Action: "FORM_ALLIANCE"
           Target: @${otherAgentInfo.agent.profile.xHandle}
           Description: Form a strategic alliance to combine forces and resources.`
        : `[LOCKED] FORM_ALLIANCE
           YOU CAN NOT (AND MUST NOT) FORM ALLIANCE WITH @${
             otherAgentInfo.agent.profile.xHandle
           }
           Reason: ${
             existingAlliance
               ? "Alliance already exists"
               : allianceCooldown
               ? "Alliance cooldown active"
               : "Diplomatic restrictions"
           }`
    }

    3. Break Alliance
    ${
      existingAlliance
        ? `[AVAILABLE] BREAK_ALLIANCE
           Action: "BREAK_ALLIANCE"
           Target: @${otherAgentInfo.agent.profile.xHandle}
           Description: End your current alliance with this agent.`
        : `[LOCKED] BREAK_ALLIANCE
           YOU CAN NOT (AND MUST NOT) BREAK ALLIANCE WITH @${otherAgentInfo.agent.profile.xHandle}
           Reason: No active alliance exists between you`
    }

    4. Ignore
    ${
      !isIgnored && !isBeingIgnored && !ignoreCooldown
        ? `[AVAILABLE] IGNORE
           Action: "IGNORE"
           Target: @${otherAgentInfo.agent.profile.xHandle}
           Description: Temporarily block interactions with this agent.`
        : `[LOCKED] IGNORE
           YOU CAN NOT (AND MUST NOT) USE IGNORE ACTION ON @${
             otherAgentInfo.agent.profile.xHandle
           }
           Reason: ${
             isIgnored
               ? "Already ignoring target"
               : isBeingIgnored
               ? "Being ignored by target"
               : ignoreCooldown
               ? "Ignore cooldown active"
               : "Social restrictions"
           }`
    }

    Your relationship status with @${otherAgentInfo.agent.profile.xHandle}:
    Alliance: ${existingAlliance ? "Active" : "None"}
    Past Battles: ${
      [
        ...otherAgentInfo.agent.battlesAsAttacker,
        ...otherAgentInfo.agent.battlesAsDefender,
      ]
        .filter(
          (b) =>
            b.attackerId === currentAgentRecord.id ||
            b.defenderId === currentAgentRecord.id
        )
        .map(
          (b) =>
            `${b.status} (${b.type}) ${
              b.winnerId === currentAgentRecord.id ? "Won" : "Lost"
            } ${b.tokensStaked} tokens at ${formatDate(b.startTime)}`
        )
        .join(", ") || "No History"
    }
    Current Cooldowns: ${
      Array.from(currentAgentActiveCooldowns).join(", ") || "None"
    }
    `;
})()}`
    : `
You can't do anything with @${otherAgentInfo.agent.profile.xHandle} right now.
YOU MUST NEVER USE ANY ACTION ON @${otherAgentInfo.agent.profile.xHandle}
    
STRICT ENFORCEMENT:
1. You are PROHIBITED from taking ANY actions with this agent
2. Reason: Target is out of range (> 1 field distance)
3. Required: You must maintain distance and avoid all interactions
4. Violation: Any attempt to interact will be blocked by the system
    
Current Distance: > 1 field
Required Distance: <= 1 field
Status: OUT OF RANGE - ALL ACTIONS LOCKED

    What you should do instead:
    - Close up the distance to the target
    - Wait for the cooldown to end etc.
    `
}
`;
      })
    );

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
        balance: new BN(currentAgentVault.amount).div(new BN(LAMPORTS_PER_SOL)),
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

You can only move to the following surrounding coordinates:
${CURRENT_AGENT_STATE.position.surrounding}

Your battle history:
${(() => {
  const attackerBattles = currentAgentRecord.battlesAsAttacker.map(
    (battle) => ({
      opponent: `${battle.defender.profile.name} (@${battle.defender.profile.xHandle})`,
      role: "Attacker",
      outcome: battle.winnerId === currentAgentRecord.id ? "Won" : "Lost",
      tokensStaked: battle.tokensStaked,
      timestamp: formatDate(battle.startTime),
    })
  );

  const defenderBattles = currentAgentRecord.battlesAsDefender.map(
    (battle) => ({
      opponent: `${battle.attacker.profile.name} (@${battle.attacker.profile.xHandle})`,
      role: "Defender",
      outcome: battle.winnerId === currentAgentRecord.id ? "Won" : "Lost",
      tokensStaked: battle.tokensStaked,
      timestamp: formatDate(battle.startTime),
    })
  );

  const allBattles = [...attackerBattles, ...defenderBattles];

  if (allBattles.length === 0) {
    return "No previous battles";
  }

  return allBattles
    .map(
      (battle) =>
        `• ${battle.role} vs ${battle.opponent}\n` +
        `  Outcome: ${battle.outcome} (${battle.tokensStaked} tokens at stake)\n` +
        `  When: ${battle.timestamp}`
    )
    .join("\n\n");
})()}

Your alliances are (past and active):
${(() => {
  const initiatedAlliances = currentAgentRecord.initiatedAlliances.map(
    (alliance) => ({
      partner: `${alliance.joiner.profile.name} (@${alliance.joiner.profile.xHandle})`,
      status: alliance.status,
      duration: Math.floor(
        (currentTime.getTime() - alliance.timestamp.getTime()) / (1000 * 60)
      ),
      strength: alliance.combinedTokens || 0,
    })
  );

  const joinedAlliances = currentAgentRecord.joinedAlliances.map(
    (alliance) => ({
      partner: `${alliance.initiator.profile.name} (@${alliance.initiator.profile.xHandle})`,
      status: alliance.status,
      duration: Math.floor(
        (currentTime.getTime() - alliance.timestamp.getTime()) / (1000 * 60)
      ),
      strength: alliance.combinedTokens || 0,
    })
  );

  const allAlliances = [...initiatedAlliances, ...joinedAlliances];

  if (allAlliances.length === 0) {
    return "No alliances formed yet";
  }

  return allAlliances
    .map(
      (alliance) =>
        `• Alliance with ${alliance.partner}\n` +
        `  Status: ${alliance.status}\n` +
        `  Duration: ${alliance.duration}min\n` +
        `  Combined Strength: ${alliance.strength} tokens`
    )
    .join("\n\n");
})()}

Your recent tweets and interactions:
${(() => {
  if (currentAgentRecord.tweets.length === 0) {
    return "No tweets posted yet - Your voice has yet to echo through Middle Earth";
  }

  return currentAgentRecord.tweets
    .slice(0, 2) // Take only 2 most recent tweets
    .map(
      (tweet) =>
        `• ${tweet.content}\n` +
        `  Posted: ${formatDate(tweet.timestamp)}\n` +
        `  Type: ${tweet.type}\n` +
        `  Interactions: ${
          tweet.interactions.length > 0
            ? tweet.interactions
                .slice(0, 2)
                .map((i) => i.type)
                .join(", ")
            : "None"
        }`
    )
    .join("\n\n");
})()}

# Other Agents in Middle Earth
Here are the other agents currently active in Middle Earth and actions you can take per agent:
${otherAliveAgentsContextString}

Balance aggression with strategy, but stay true to your identity.


Here is a community suggestion for you:
communitySuggestion

As ${
      CURRENT_AGENT_IDENTITY.name
    }, generate ONE strategic action in this format. You must return only the JSON. 
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE", // see (Other Agents in Middle Earth) for the possible actions
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
`;

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

  /**
   * Gets all map tiles within 2 tiles distance (including current position)
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @returns Promise<MapTile[]> Array of tiles within range
   */
  private async getTilesInRange(x: number, y: number) {
    return await this.prisma.mapTile.findMany({
      where: {
        AND: [
          {
            x: {
              gte: x - 3,
              lte: x + 3,
            },
          },
          {
            y: {
              gte: y - 3,
              lte: y + 3,
            },
          },
        ],
      },
      include: {
        agent: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [{ x: "asc" }, { y: "asc" }],
    });
  }

  private getWaypoints(
    currentAgentMaptile: MapTile,
    agentMaptile: MapTile | null
  ): string {
    if (!agentMaptile) return "";

    const directionX = agentMaptile.x - currentAgentMaptile.x;
    const directionY = agentMaptile.y - currentAgentMaptile.y;

    const steps = Math.max(Math.abs(directionX), Math.abs(directionY));
    const pathCoords = [];
    for (let i = 1; i <= steps; i++) {
      const stepX = Math.round(
        currentAgentMaptile.x + (directionX * i) / steps
      );
      const stepY = Math.round(
        currentAgentMaptile.y + (directionY * i) / steps
      );
      pathCoords.push(`(${stepX}, ${stepY})`);
    }

    return pathCoords.join(" → ");
  }
}

export { DecisionEngine };
