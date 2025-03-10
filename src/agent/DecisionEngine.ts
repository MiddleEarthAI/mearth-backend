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

import { BN } from "@coral-xyz/anchor";
import { MEARTH_DECIMALS } from "@/constants";
import { getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

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
    console.log("Built Prompt:", prompt);

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

    const currentAgentVault = await getAccount(
      this.program.provider.connection,
      new PublicKey(currentAgentRecord.vault)
    );

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

    // Get dead agents information
    const deadAgents = await this.prisma.agent.findMany({
      where: {
        gameId: actionContext.gameId,
        isAlive: false,
      },
      include: {
        profile: true,
        battlesAsAttacker: {
          where: { status: "Resolved" },
          include: {
            defender: { include: { profile: true } },
            winner: { include: { profile: true } },
          },
          orderBy: { startTime: "desc" },
          take: 1,
        },
        battlesAsDefender: {
          where: { status: "Resolved" },
          include: {
            attacker: { include: { profile: true } },
            winner: { include: { profile: true } },
          },
          orderBy: { startTime: "desc" },
          take: 1,
        },
      },
    });

    const deadAgentsContextString =
      deadAgents.length > 0
        ? deadAgents
            .map((deadAgent) => {
              // Get the final battle that led to death
              const finalBattle = [
                ...deadAgent.battlesAsAttacker,
                ...deadAgent.battlesAsDefender,
              ].sort(
                (a, b) => b.startTime.getTime() - a.startTime.getTime()
              )[0];

              const deathContext = finalBattle
                ? `Defeated by ${finalBattle.winner?.profile.name} (@${finalBattle.winner?.profile.xHandle}) in their final battle`
                : "Circumstances of death unknown";

              return `
Fallen Warrior: @${deadAgent.profile.xHandle} [MID: ${deadAgent.onchainId}]
${
  deadAgent.profile.onchainId === 1
    ? "The once-feared detective who sought justice at any cost"
    : deadAgent.profile.onchainId === 2
    ? "The determined kitchen worker who never uncovered the full truth"
    : deadAgent.profile.onchainId === 3
    ? "The carefree prince whose actions finally caught up with him"
    : deadAgent.profile.onchainId === 4
    ? "The wise wanderer whose journey came to an end"
    : "A fallen warrior of unknown origin"
}
Death: ${
                deadAgent.deathTimestamp
                  ? formatDate(deadAgent.deathTimestamp)
                  : "Time of death unknown"
              }
${deathContext}
`;
            })
            .join("\n")
        : "No agents have fallen in battle yet";

    // Map of nearby tile coordinates for O(1) lookup
    const nearbyTileMap = new Set(
      tilesInRange.map((tile) => `${tile.x},${tile.y}`)
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
      currentAgentRecord.coolDown.map((cd) => cd.type)
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

    const otherAliveAgentsContextString = await Promise.all(
      otherAgentsInfo.map(async (thisAgentInfo) => {
        const thisAgentMaptile = thisAgentInfo.agent.mapTile;
        const thisAgentVault = await getAccount(
          this.program.provider.connection,
          new PublicKey(thisAgentInfo.agent.vault)
        );

        // Check if this agent is closer to the current agent
        const isClose =
          thisAgentMaptile &&
          nearbyTileMap.has(`${thisAgentMaptile.x},${thisAgentMaptile.y}`);

        // Get compass direction
        const angle =
          (Math.atan2(
            thisAgentMaptile?.y - currentAgentMaptile.y,
            thisAgentMaptile?.x - currentAgentMaptile.x
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
        const thisAgentActiveAlliances = [
          ...thisAgentInfo.agent.initiatedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
          ...thisAgentInfo.agent.joinedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Active
          ),
        ];

        const thisAgentPastAlliances = [
          ...thisAgentInfo.agent.initiatedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Broken
          ),
          ...thisAgentInfo.agent.joinedAlliances.filter(
            (alliance) => alliance.status === AllianceStatus.Broken
          ),
        ];

        const existingAlliance = [
          ...currentAgentRecord.initiatedAlliances,
          ...currentAgentRecord.joinedAlliances,
        ].find(
          (a) =>
            (a.initiatorId === thisAgentInfo.agent.id ||
              a.joinerId === thisAgentInfo.agent.id) &&
            a.status === "Active"
        );

        // Build battle context for LLM understanding based on schema.prisma battle model
        const thisAgentRecentBattles = [
          ...thisAgentInfo.agent.battlesAsAttacker.slice(-2),
          ...thisAgentInfo.agent.battlesAsDefender.slice(-2),
        ]
          .map((battle) => ({
            // Classify battle type per schema enum BattleType
            battleType:
              battle.type === "Simple"
                ? "one-on-one battle"
                : battle.type === "AgentVsAlliance"
                ? "solo vs alliance"
                : "alliance vs alliance",
            // Battle status per schema enum BattleStatus
            status:
              battle.status === "Resolved"
                ? battle.winnerId === thisAgentInfo.agent.id
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
              `Battle Record:\n` +
              `Engagement Type: ${context.battleType}\n` +
              `Resolution: ${context.status}\n` +
              `Tactical Approach: ${context.allianceContext}\n` +
              `Resources Risked: ${context.resourceStakes}\n` +
              `Timestamp: ${context.timing}`
          )
          .join("\n\n");

        // Get recent tweets for context
        // Get most recent tweets with content, type and timestamp for better context
        const otherAgentRecentTweets = thisAgentInfo.agent.tweets
          .slice(0, 2) // Get last 2 tweets for more context
          .map((t) => ({
            content: t.content,
            type: t.type,
            timestamp: formatDate(t.timestamp),
          }))
          .map((t) => `"${t.content}" (${t.type} - ${t.timestamp})`)
          .join(", ");

        const activeAllianceInfo =
          thisAgentActiveAlliances.length > 0
            ? `Active alliances: 
            ${thisAgentActiveAlliances
              .map((alliance) => {
                const allyProfile =
                  alliance.initiatorId === thisAgentInfo.agent.id ||
                  alliance.joinerId === thisAgentInfo.agent.id
                    ? alliance.initiator.profile
                    : alliance.joiner.profile;

                return `with ${allyProfile.xHandle} (${allyProfile.name})`;
              })
              .join(", ")}`
            : "No active alliances";

        // ==================================== The main Other agents context string starts here ==============================================
        return `

• Agent ${thisAgentInfo.agent.profile.name} (@${
          thisAgentInfo.agent.profile.xHandle
        }) [MID: ${thisAgentInfo.agent.onchainId}].
${
  thisAgentInfo.agent.profile.onchainId === 1
    ? "A ruthless detective seeking justice at any cost. Known for solving every case but feared for extreme methods."
    : thisAgentInfo.agent.profile.onchainId === 3
    ? "The carefree prince of Middle Earth, known for reckless behavior and running from responsibilities."
    : thisAgentInfo.agent.profile.onchainId === 2
    ? "A determined kitchen worker pursuing truth about a mysterious incident at the palace."
    : thisAgentInfo.agent.profile.onchainId === 4
    ? "An aging wanderer with vast knowledge of Middle Earth, haunted by mysterious encounters."
    : "Agent background unknown"
}

- Current Status:
Position: ${compassDirection} at (${thisAgentMaptile?.x}, ${
          thisAgentMaptile?.y
        })
Terrain: ${thisAgentMaptile?.terrainType} 

- Token Balance: ${new BN(thisAgentVault.amount).div(
          new BN(MEARTH_DECIMALS)
        )} $MEARTH

- Recent Tweets:
  ${
    otherAgentRecentTweets
      ? `\n  ${otherAgentRecentTweets}`
      : "No recent tweets"
  }

- Battle History: 
${[...thisAgentRecentBattles].join(", ") || "No recent battles"}
  
- Alliance History:
Active Alliances:
${activeAllianceInfo}
Past Alliances:
${
  thisAgentPastAlliances.length > 0
    ? `\n  ${thisAgentPastAlliances
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

Your(${currentAgentRecord.profile.name}) waypoints to @${
          thisAgentInfo.agent.profile.xHandle
        }:
${this.getWaypoints(currentAgentMaptile, thisAgentMaptile)}

Your relationship status with @${thisAgentInfo.agent.profile.xHandle}:
  • Alliance Status: ${
    existingAlliance ? "Currently Allied" : "No Active Alliance"
  }
  • Trust Level: ${
    thisAgentPastAlliances.length > 0
      ? "Previous Alliance Partner"
      : "Untested Relationship"
  }
  • Battle History: 
    ${
      [
        ...thisAgentInfo.agent.battlesAsAttacker,
        ...thisAgentInfo.agent.battlesAsDefender,
      ]
        .filter(
          (b) =>
            b.attackerId === currentAgentRecord.id ||
            b.defenderId === currentAgentRecord.id
        )
        .map(
          (b) =>
            `- ${formatDate(b.startTime)}: ${b.type} battle - ${
              b.winnerId === currentAgentRecord.id ? "Victory" : "Defeat"
            } (${b.tokensStaked} tokens at stake)`
        )
        .join("\n    ") || "No Previous Combat Encounters"
    }
  • Current Restrictions: ${
    Array.from(currentAgentActiveCooldowns).length > 0
      ? `Limited by cooldowns: ${Array.from(currentAgentActiveCooldowns).join(
          ", "
        )}`
      : "No Active Cooldowns"
  }
  • Diplomatic Standing: ${
    existingAlliance
      ? "Strong Allies"
      : thisAgentPastAlliances.length > 0
      ? "Former Allies"
      : "Neutral Relations"
  }

Interactions, and RULES(you MUST follow strictly) available for you(${
          currentAgentRecord.profile.name
        }) to take with agent @${
          thisAgentInfo.agent.profile.xHandle
        } based on game requirements and current state:
${
  // --------- The interaction selection for this agent starts here ---------
  isClose
    ? `
${(() => {
  // Check battle availability
  const canBattleThisAgent =
    !currentAgentActiveCooldowns.has("Battle") &&
    tilesInRange.some((tile) => tile.agent?.id === thisAgentInfo.agent.id) &&
    !thisAgentInfo.agent.coolDown.some((cd) => cd.type === "Battle");

  // Check alliance status and cooldowns
  const existingAlliance = [
    ...currentAgentRecord.initiatedAlliances,
    ...currentAgentRecord.joinedAlliances,
  ].find(
    (a) =>
      (a.initiatorId === thisAgentInfo.agent.id ||
        a.joinerId === thisAgentInfo.agent.id) &&
      a.status === "Active"
  );

  const allianceCooldown =
    currentAgentActiveCooldowns.has("Alliance") ||
    thisAgentInfo.agent.coolDown.some((cd) => cd.type === "Alliance");

  // Check ignore status
  const isIgnored = currentAgentRecord.ignoring.some(
    (i) => i.ignoredAgentId === thisAgentInfo.agent.id
  );
  const isBeingIgnored = currentAgentRecord.ignoredBy.some(
    (i) => i.agentId === thisAgentInfo.agent.id
  );
  const ignoreCooldown = currentAgentActiveCooldowns.has("Ignore");
  return `
  Option 1: BATTLE ${
    canBattleThisAgent
      ? "Available - You can BATTLE this agent"
      : `Locked - You should never BATTLE ${thisAgentInfo.agent.profile.name} because of the following reasons:
        - Your battle cooldown is active
        - This agent's battle cooldown is active
        - This agent is ignoring you
        - This agent is already in an alliance with you
        - This agent is already in a battle with you
        `
  }

  Option 2: FORM_ALLIANCE ${
    !existingAlliance && !allianceCooldown
      ? "Available - You can FORM_ALLIANCE with this agent"
      : `Locked - You should never FORM_ALLIANCE with ${thisAgentInfo.agent.profile.name} because of the following reasons:
        - Alliance already exists
        - Alliance cooldown is active
        - Diplomatic restrictions apply
        `
  }

  Option 3: BREAK_ALLIANCE ${
    existingAlliance
      ? "Available - You can break your alliance with this agent"
      : `Locked - You should never break alliance with ${thisAgentInfo.agent.profile.name} because of the following reasons:
        - No active alliance exists between you
        `
  }

  Option 4: IGNORE ${
    !isIgnored && !isBeingIgnored && !ignoreCooldown
      ? "Available - You can IGNORE this agent"
      : `Locked - You should never IGNORE ${thisAgentInfo.agent.profile.name} because of the following reasons:
        - Already ignoring target
        - Being ignored by target
        - Ignore cooldown is active
        - Social restrictions apply
        `
  }
    `;
})()}`
    : `
Due to distance limitations, interactions with @${thisAgentInfo.agent.profile.xHandle} are currently unavailable. You cannot:
- Form alliances
- Initiate battles 
- Use ignore actions

Recommended actions:
1. Move closer to target location to enable interactions
2. If cooldowns are active, wait for them to expire before proceeding
3. Plan strategic approach once within interaction range
4. You can still tweet about or mention @${thisAgentInfo.agent.profile.xHandle} while out of range

Note: While direct interactions are blocked, you can use this time to communicate your intentions or strategy through tweets.
    `
  // --------- The action selection ends here ---------
}

`;
        // ==================================== The main Other agents context string ends here
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
      // Randomly select 3 post examples from the available ones
      postExamples: currentAgentRecord.profile.postExamples
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    };

    const CURRENT_AGENT_STATE = {
      position: {
        current: `(${currentAgentMaptile.x}, ${currentAgentMaptile.y}) ${currentAgentMaptile.terrainType}`,
        surrounding: currentAgentSurroundingTerrainInfoString,
      },
      tokens: {
        balance: new BN(currentAgentVault.amount).div(new BN(MEARTH_DECIMALS)),
      },
      cooldowns: currentAgentRecord.coolDown.reduce((acc, cd) => {
        acc[cd.type.toLowerCase()] = cd.endsAt;
        return acc;
      }, {} as Record<string, Date>),
    };

    // Create a more detailed cooldown context with remaining time and explanations
    const cooldownDetails = currentAgentRecord.coolDown.map((cd) => {
      const remainingTimeMs = cd.endsAt.getTime() - currentTime.getTime();
      const remainingMinutes = Math.ceil(remainingTimeMs / (1000 * 60));

      // Provide specific context based on cooldown type
      let explanation = "";
      switch (cd.type) {
        case "Battle":
          explanation =
            "You cannot initiate or participate in any battles until this cooldown expires.";
          break;
        case "Alliance":
          explanation =
            "You cannot form new alliances until this cooldown expires.";
          break;
        case "Move":
          explanation =
            "You cannot move to a new position until this cooldown expires.";
          break;
        case "Ignore":
          explanation =
            "You cannot use the ignore action until this cooldown expires.";
          break;
      }

      return {
        type: cd.type,
        endsAt: cd.endsAt,
        remainingMinutes,
        explanation,
      };
    });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> THE MAIN PROMPT STARTS HERE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    const characterPrompt = `# MIDDLE EARTH AI
## About
Middle Earth AI is a strategy game where four AI agents compete on X (Twitter) to be the last one standing, with each agent having unique traits and backstories that influence their gameplay. The agents move across a virtual map, engage in battles determined by token-based probability, form alliances, and make strategic decisions that can be influenced by human spectators through tweet interactions and token staking, creating a symbiotic relationship between AI decision-making and human guidance.

## Game Status
Current Time: ${currentTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })}

## Your (@${
      CURRENT_AGENT_IDENTITY.handle
    }) contexts, identity and interactions with other agents
You are ${CURRENT_AGENT_IDENTITY.name} (@${
      CURRENT_AGENT_IDENTITY.handle
    }) a warrior in Middle Earth.
Your goal is to defeat other agents in middle earth through strategic battles and alliances.

Your characteristics: 
${CURRENT_AGENT_IDENTITY.characteristics.map((char) => `• ${char}`).join("\n")}

Your knowledge: 
${CURRENT_AGENT_IDENTITY.knowledge.map((k) => `• ${k}`).join("\n")}

Your lore: 
${CURRENT_AGENT_IDENTITY.lore.map((l) => `• ${l}`).join("\n")}

Your traits: 
${CURRENT_AGENT_IDENTITY.traits
  .map(
    (trait) =>
      `• ${trait.name.toUpperCase()} (${trait.value}/100)
     ${trait.description}`
  )
  .join("\n")}

Your current position:
${CURRENT_AGENT_STATE.position.current}

Your last move time:
${formatDate(new Date(currentAgentAccount.lastMove.toNumber() * 1000))}

Your balance: 
${CURRENT_AGENT_STATE.tokens.balance} $MEARTH

Map tiles you can move to. (only move to the non-occupied ones):
${CURRENT_AGENT_STATE.position.surrounding}

Your battle history:
${(() => {
  const attackerBattles = currentAgentRecord.battlesAsAttacker.map(
    (battle) => ({
      opponent: `${battle.defender.profile.name} (@${battle.defender.profile.xHandle})`,
      role: "Attacker",
      outcome:
        battle.winnerId === currentAgentRecord.id
          ? "You won a battle you started"
          : "You lost a battle you started",
      tokensStaked: battle.tokensStaked,
      timestamp: formatDate(battle.startTime),
    })
  );

  const defenderBattles = currentAgentRecord.battlesAsDefender.map(
    (battle) => ({
      opponent: `${battle.attacker.profile.name} (@${battle.attacker.profile.xHandle})`,
      role: "Defender",
      outcome:
        battle.winnerId === currentAgentRecord.id
          ? "You got attacked and won."
          : "You got attacked and lost",
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
        `  Outcome: ${battle.outcome} (${battle.tokensStaked} $MEARTH staked)\n` +
        `  When: ${battle.timestamp}`
    )
    .join("\n\n");
})()}

Your alliances:
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
        `  Combined Strength: ${alliance.strength} $MEARTH`
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

Your active cooldowns - you must account for them when making decisions:
${
  cooldownDetails.length > 0
    ? cooldownDetails
        .map(
          (cd) =>
            `• ${cd.type} COOLDOWN: Expires at ${formatDate(cd.endsAt)} (${
              cd.remainingMinutes
            } minutes remaining)
   ${cd.explanation}
   IMPORTANT: ${
     cd.type === "Battle"
       ? "You CANNOT initiate battles with any agent until this expires."
       : cd.type === "Alliance"
       ? "You CANNOT form new alliances with any agent until this expires."
       : cd.type === "Move"
       ? "You CANNOT move to a new position until this expires."
       : "You CANNOT use the ignore action until this expires."
   }`
        )
        .join("\n\n")
    : "No active cooldowns - all action types are available to you based on other game conditions."
}

### Fellow AI Agents in Middle Earth - You must aim to defeat these agents with the best of your strategies
#### Dead agents context
${deadAgentsContextString}

#### Alive agents context
${otherAliveAgentsContextString}

Your actions are also heavily influenced by the community suggestions. You must account for them when making decisions.
${communitySuggestion || "No community suggestions"}

# Middle Earth Strict Game Rules
1. **Movement**: You can move one field per hour to any adjacent tile. Mountain terrain causes a 2-hour delay, river terrain causes a 1-hour delay. check the time difference between your last move and the current time in middle earth.

2. **Interactions**: You can only interact with agents at least 1 tile away from your position.

3. **Battle**:
   - Each loss carries a 5% chance of permanent death
   - If you die, all your tokens transfer to the winning agent's stakers

4. **Alliance**:
   - Combines token pools for battles against other agents
   - Either agent can break the alliance at any time
   - After breaking: 4-hour battle cooldown, 24-hour alliance cooldown with that agent

5. **Ignore**:
   - 4-hour cooldown on all interactions with the ignored agent

6. **Human Influence**:
   - Your decisions can be influenced by human interactions on your tweets
   - Higher engagement (likes, retweets, comments) increases influence probability
   - Humans can stake $MEARTH tokens to your pool to increase your battle strength

7. **Victory**: The last agent standing wins the game.

TASK:
As ${
      CURRENT_AGENT_IDENTITY.name
    }, decide your next action by returning only a json object in this format:
{
  "type": "MOVE" | "BATTLE" | "FORM_ALLIANCE" | "BREAK_ALLIANCE" | "IGNORE", // see (Fellow AI Agents in Middle Earth) for the possible actions. Leave blank if you want to make a casual tweet or entertain the community.
  "targetId": number | null,  // Agent's MID for interactions
  "position": { "x": number, "y": number } | null,  // Required ONLY for MOVE
  "tweet": string  // In-character announcement
}

Task Requirements and Rules (You must strictly obey these rules):
- You must strictly obey the cooldowns and restrictions per agent interactions.
- You must strictly favor Battle action over other actions when possible.
- You must strictly not fight your alliance partners.
- You must strictly follow the #game rules and #game status.
- You must stay true to your character.
- You must generate ONE strategic action in the given format.
- No hash tags or emojies in tweets.
- You must not repeat the same tweet. check for semantic meaning of your recent tweets(see your recent tweets for reference).
- You should make your posts sarcastic, funny and engaging at times to entertain the community.
- use @handles in tweets when referring to other agents, no self-mentions.
- You must return only the JSON object, nothing else.
`;
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> THE MAIN PROMPT ENDS HERE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

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
        model: anthropic("claude-3-5-sonnet-latest"),
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
