import { prisma } from "@/config/prisma";
import { Solana } from "./deps/solana";
import type { IAgent } from "./types";

import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { type Message, generateText } from "ai";
import { getAgentTools } from "./actions";
import { Twitter } from "./deps/twitter";
import { logger } from "./utils/logger";

export interface AgentConfig {
  username: string;
  password: string;
  email: string;
  twitter2faSecret: string;
}

export class Agent implements IAgent {
  public anthropic: AnthropicProvider;
  public solana: Solana;
  public twitter: Twitter | null = null;
  private isRunning = false;

  constructor(agentConfig: AgentConfig, readonly agentId: string) {
    logger.info("initializing agent...");
    this.isRunning = false;
    // Initialize Anthropic anthropic - expects ANTHROPIC_API_KEY in environment
    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.twitter = new Twitter(this.anthropic, {
      agentId,
      username: agentConfig.username,
      password: agentConfig.password,
      email: agentConfig.email,
      twitter2faSecret: agentConfig.twitter2faSecret,
    });

    this.agentId = agentId;
    this.solana = new Solana();
  }

  async start() {
    this.isRunning = true;

    if (this.twitter) {
      await this.twitter.init();
    }
    logger.warn("Twitter not initialized - continuing regardless");

    // Get all agents with full relationships
    const agents = await prisma?.agent.findMany({
      include: {
        wallet: true,
        currentLocation: true,
        alliances: {
          where: { status: "ACTIVE" },
          include: {
            agents: {
              include: {
                wallet: true,
              },
            },
          },
        },
        traits: true,
        tweets: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { engagement: true },
        },
        AttackerBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
          include: { defender: true },
        },
        DefenderBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
          include: { attacker: true },
        },
      },
    });

    if (!agents) {
      throw new Error("No agents found in database");
    }

    const currentAgent = agents?.find((agent) => agent.id === this.agentId);
    if (!currentAgent) {
      throw new Error("Current agent not found");
    }
    let count = 0;

    const actionLoop = async () => {
      logger.info(`action loop ran ${++count} times ✅`);

      const currentTime = new Date();
      const gameTime = {
        hour: currentTime.getUTCHours(),
        day: currentTime.getUTCDate(),
        month: currentTime.getUTCMonth() + 1,
        year: currentTime.getUTCFullYear(),
        timestamp: currentTime.toISOString(),
      };
      const MIN_DELAY = process.env.MIN_ACTION_DELAY_MS
        ? Number.parseInt(process.env.MIN_ACTION_DELAY_MS)
        : 30 * 60 * 1000; // default to 30 minutes
      const MAX_DELAY = process.env.MAX_ACTION_DELAY_MS
        ? Number.parseInt(process.env.MAX_ACTION_DELAY_MS)
        : 70 * 60 * 1000; // default to 70 minutes

      const LOOP_DELAY =
        Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;

      const cotext = `
      #Current Game Time
      UTC: ${gameTime.timestamp}
      Game Day: Day ${Math.floor(
        (currentTime.getTime() - new Date("2025-01-25").getTime()) /
          (1000 * 60 * 60 * 24)
      )} of Middle Earth
      
      #Game Context - Middle Earth AI
      You are an AI Agent in Middle Earth, a strategic game where 4 unique characters compete for dominance.
      The ultimate goal is survival - defeat others while avoiding permanent death.
      
      #Your Character Profile
      - Identity: ${currentAgent.name} (@${currentAgent.twitterHandle})
      - Character Type: ${currentAgent.characterType}
      - Current Position: (${currentAgent.currentLocation.x}, ${
        currentAgent.currentLocation.y
      })
      - Terrain: ${currentAgent.currentLocation.terrain}
      - Power Level: ${currentAgent.wallet.governanceTokens} MEARTH tokens
      - Status: ${currentAgent.status}
      - Time Since Last Action: ${Math.floor(
        (currentTime.getTime() -
          new Date(currentAgent.lastActionTime || currentTime).getTime()) /
          (1000 * 60)
      )} minutes
      
      #Your Character Traits & Personality
      ${currentAgent.traits
        .map((t) => `- ${t.traitName}: ${t.traitValue}`)
        .join("\n")}
      
      #Recent Social Activity (Last 5 Tweets)
      ${currentAgent.tweets
        .map(
          (tweet) => `
      - Tweet [${new Date(tweet.createdAt).toISOString()}]: "${tweet.content}"
      - Impact: ${
        tweet.engagement
          ? `${tweet.engagement.likes} likes, ${tweet.engagement.retweets} RTs, ${tweet.engagement.comments} comments`
          : "No engagement yet"
      }
      - Time Ago: ${Math.floor(
        (currentTime.getTime() - new Date(tweet.createdAt).getTime()) /
          (1000 * 60)
      )} minutes ago
      `
        )
        .join("\n")}

      #Battle History (Last 5 Battles)
      Recent Battles Initiated:
      ${currentAgent.AttackerBattles.map(
        (battle) => `
      - Attacked: @${battle.defender.twitterHandle}
      - Result: ${battle.attackerWon ? "Victory" : "Defeat"}
      - Tokens Burned: ${battle.tokensBurned} MEARTH
      - Death Occurred: ${battle.deathOccurred ? "Yes" : "No"}
      - Attacker Tokens Before: ${battle.attackerTokensBefore} MEARTH
      - Defender Tokens Before: ${battle.defenderTokensBefore} MEARTH
      - Time Ago: ${Math.floor(
        (currentTime.getTime() - new Date(battle.timestamp).getTime()) /
          (1000 * 60)
      )} minutes ago
      `
      ).join("\n")}

      Recent Defenses:
      ${currentAgent.DefenderBattles.map(
        (battle) => `
      - Defended against: @${battle.attacker.twitterHandle}
      - Result: ${!battle.attackerWon ? "Victory" : "Defeat"}
      - Tokens Burned: ${battle.tokensBurned} MEARTH
      - Death Occurred: ${battle.deathOccurred ? "Yes" : "No"}
      - Attacker Tokens Before: ${battle.attackerTokensBefore} MEARTH
      - Defender Tokens Before: ${battle.defenderTokensBefore} MEARTH
      - Time Ago: ${Math.floor(
        (currentTime.getTime() - new Date(battle.timestamp).getTime()) /
          (1000 * 60)
      )} minutes ago
      `
      ).join("\n")}

      #Active Alliances
      ${
        currentAgent.alliances.length > 0
          ? currentAgent.alliances
              .map(
                (alliance) => `
      - Allied with: ${alliance.agents
        .filter((agent) => agent.id !== currentAgent.id)
        .map((agent) => `@${agent.twitterHandle}`)
        .join(", ")}
      - Status: ${alliance.status}
      - Formed: ${Math.floor(
        (currentTime.getTime() - new Date(alliance.formedAt).getTime()) /
          (1000 * 60 * 60)
      )} hours ago
      - Expires: ${
        alliance.dissolutionTime
          ? `in ${Math.floor(
              (new Date(alliance.dissolutionTime).getTime() -
                currentTime.getTime()) /
                (1000 * 60 * 60)
            )} hours`
          : "Active"
      }
      - Strategic Value: ${
        alliance.agents.reduce(
          (sum, agent) => sum + (agent.wallet?.governanceTokens || 0),
          0
        ) / alliance.agents.length
      } avg. MEARTH per ally
      `
              )
              .join("\n")
          : "No active alliances - Consider forming strategic partnerships"
      }

      #Character Background & Motivation
      ${currentAgent.bio.map((line) => `- ${line}`).join("\n")}

      #Personal Lore & History
      ${currentAgent.lore.map((line) => `- ${line}`).join("\n")}

      #Strategic Knowledge
      ${currentAgent.knowledge.map((line) => `- ${line}`).join("\n")}

      #Personality Traits & Decision Making
      ${currentAgent.traits
        .map(
          (t) =>
            `- ${t.traitName}: ${t.traitValue} (Updated ${Math.floor(
              (currentTime.getTime() - new Date(t.lastUpdated).getTime()) /
                (1000 * 60 * 60 * 24)
            )} days ago)`
        )
        .join("\n")}

      #World State Analysis
      Terrain Risk Assessment:
      - Current Position (${currentAgent.currentLocation.x}, ${
        currentAgent.currentLocation.y
      }) [${currentAgent.currentLocation.terrain}]
      - Movement Implications:
        * Plains: Normal movement (1 unit/hour)
        * Mountains: 50% slower (0.5 units/hour) + 5% death risk
        * Rivers: 70% slower (0.3 units/hour) + 5% death risk

      Power Distribution:
      - Your Power: ${currentAgent.wallet.governanceTokens} MEARTH
      - Relative Strength: ${
        (currentAgent.wallet.governanceTokens /
          agents.reduce(
            (sum, agent) => sum + agent.wallet.governanceTokens,
            0
          )) *
        100
      }% of total tokens
      - Token Burn Risk: 31-50% on battle loss

      Strategic Considerations:
      1. Battle Mechanics:
         - Win probability based on token ratio
         - Death risk: 5% for battle losers
         - Token burn: 31-50% of loser's tokens
         - Battle range: 2 units

      2. Alliance Dynamics:
         - Formation requires mutual consent
         - Strategic value in combined token strength
         - Protection against common threats
         - Information sharing benefits

      3. Movement Strategy:
         - Terrain affects speed and risk
         - Position impacts battle opportunities
         - Strategic retreats vs aggressive positioning
         - Territory control considerations

      
      Your decision should reflect:
      - Character personality (traits and history)
      - Current strategic position
      - Risk vs reward analysis
      - Long-term survival strategy
      - Recent battle outcomes
      - Alliance opportunities
      - Community feedback

      Remember:
      - Stay true to your character's personality
      - Consider all strategic implications
      - Factor in terrain effects
      - Maintain consistent behavior
      - Think several moves ahead
      - Balance aggression and caution

      Choose ONE action that best serves your survival and strategic goals.
      `;

      await this.processQuery(cotext);
      logger.info(`Next action in ${LOOP_DELAY / 60000} minutes \n\n`);
      await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY));
      await actionLoop();
    };

    actionLoop();
  }

  async processQuery(query: string) {
    // Get enriched agent data with full context
    const currentAgent = await prisma.agent.findUnique({
      where: { id: this.agentId },
      include: {
        wallet: {
          include: {
            stakingRewards: {
              take: 5,
              orderBy: { timestamp: "desc" },
            },
            transactionHistory: {
              take: 10,
              orderBy: { timestamp: "desc" },
            },
          },
        },
        currentLocation: true,
        movementHistory: {
          take: 5,
          orderBy: { timestamp: "desc" },
          include: {
            fromLocation: true,
            toLocation: true,
          },
        },
        alliances: {
          where: { status: "ACTIVE" },
          include: {
            agents: {
              include: {
                wallet: true,
                currentLocation: true,
                traits: true,
              },
            },
          },
        },
        traits: {
          orderBy: { lastUpdated: "desc" },
        },
        tweets: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            engagement: true,
            feedback: true,
          },
        },
        AttackerBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
          include: {
            defender: {
              include: {
                wallet: true,
                currentLocation: true,
              },
            },
          },
        },
        DefenderBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
          include: {
            attacker: {
              include: {
                wallet: true,
                currentLocation: true,
              },
            },
          },
        },
      },
    });

    if (!currentAgent) {
      throw new Error("Agent not found");
    }

    const currentTime = new Date();

    // Build enhanced context with all available information
    const enhancedContext = `
    #Current Game Time & State
    UTC: ${currentTime.toISOString()}
    Game Day: Day ${Math.floor(
      (currentTime.getTime() - new Date("2025-01-25").getTime()) /
        (1000 * 60 * 60 * 24)
    )} of Middle Earth
    
    #Character Profile & Economic Status
    - Identity: ${currentAgent.name} (@${currentAgent.twitterHandle})
    - Character Type: ${currentAgent.characterType}
    - Status: ${currentAgent.status}
    - Power Level: ${currentAgent.wallet.governanceTokens} MEARTH tokens
    - Recent Staking Rewards: ${currentAgent.wallet.stakingRewards
      .map(
        (reward) =>
          `\n      * ${reward.rewardAmount} MEARTH (${Math.floor(
            (currentTime.getTime() - new Date(reward.timestamp).getTime()) /
              (1000 * 60)
          )} mins ago)`
      )
      .join("")}
    - Recent Transactions: ${currentAgent.wallet.transactionHistory
      .map(
        (tx) =>
          `\n      * ${tx.type}: ${tx.amount} MEARTH (${Math.floor(
            (currentTime.getTime() - new Date(tx.timestamp).getTime()) /
              (1000 * 60)
          )} mins ago)`
      )
      .join("")}
    
    #Location & Movement
    - Current Position: (${currentAgent.currentLocation.x}, ${
      currentAgent.currentLocation.y
    })
    - Current Terrain: ${currentAgent.currentLocation.terrain}
    - Recent Movements: ${currentAgent.movementHistory
      .map(
        (move) =>
          `\n      * From (${move.fromLocation.x}, ${move.fromLocation.y}) [${
            move.fromLocation.terrain
          }] -> To (${move.toLocation.x}, ${move.toLocation.y}) [${
            move.toLocation.terrain
          }]
       * Speed: ${move.speed} units/hour
       * Time: ${Math.floor(
         (currentTime.getTime() - new Date(move.timestamp).getTime()) /
           (1000 * 60)
       )} mins ago`
      )
      .join("")}
    
    #Alliance Network Analysis
    ${
      currentAgent.alliances.length > 0
        ? currentAgent.alliances
            .map(
              (alliance) => `
    Alliance Group Analysis:
    - Members: ${alliance.agents
      .filter((a) => a.id !== currentAgent.id)
      .map((ally) => `@${ally.twitterHandle}`)
      .join(", ")}
    - Combined Strength: ${alliance.agents.reduce(
      (sum, ally) => sum + ally.wallet.governanceTokens,
      0
    )} MEARTH
    - Average Power: ${(
      alliance.agents.reduce(
        (sum, ally) => sum + ally.wallet.governanceTokens,
        0
      ) / alliance.agents.length
    ).toFixed(2)} MEARTH
    - Geographical Distribution: ${alliance.agents
      .map(
        (ally) =>
          `\n      * @${ally.twitterHandle}: (${ally.currentLocation.x}, ${ally.currentLocation.y}) [${ally.currentLocation.terrain}]`
      )
      .join("")}
    - Member Traits: ${alliance.agents
      .filter((a) => a.id !== currentAgent.id)
      .map(
        (ally) =>
          `\n      * @${ally.twitterHandle}: ${ally.traits
            .map((t) => `${t.traitName}: ${t.traitValue}`)
            .join(", ")}`
      )
      .join("")}
    `
            )
            .join("\n")
        : "No active alliances - Consider strategic partnerships"
    }
    
    #Combat Analytics
    Recent Offensive Operations:
    ${currentAgent.AttackerBattles.map(
      (battle) => `
    - Target: @${battle.defender.twitterHandle}
    - Outcome: ${battle.attackerWon ? "Victory" : "Defeat"}
    - Token Analysis:
      * Pre-battle Power Ratio: ${(
        battle.attackerTokensBefore / battle.defenderTokensBefore
      ).toFixed(2)}
      * Tokens Burned: ${battle.tokensBurned} MEARTH
      * Death Event: ${battle.deathOccurred ? "Yes" : "No"}
    - Target's Current Status:
      * Location: (${battle.defender.currentLocation.x}, ${
        battle.defender.currentLocation.y
      })
      * Current Power: ${battle.defender.wallet.governanceTokens} MEARTH
    - Time: ${Math.floor(
      (currentTime.getTime() - new Date(battle.timestamp).getTime()) /
        (1000 * 60)
    )} mins ago
    `
    ).join("\n")}

    Recent Defensive Operations:
    ${currentAgent.DefenderBattles.map(
      (battle) => `
    - Attacker: @${battle.attacker.twitterHandle}
    - Outcome: ${!battle.attackerWon ? "Victory" : "Defeat"}
    - Token Analysis:
      * Pre-battle Power Ratio: ${(
        battle.defenderTokensBefore / battle.attackerTokensBefore
      ).toFixed(2)}
      * Tokens Burned: ${battle.tokensBurned} MEARTH
      * Death Event: ${battle.deathOccurred ? "Yes" : "No"}
    - Attacker's Current Status:
      * Location: (${battle.attacker.currentLocation.x}, ${
        battle.attacker.currentLocation.y
      })
      * Current Power: ${battle.attacker.wallet.governanceTokens} MEARTH
    - Time: ${Math.floor(
      (currentTime.getTime() - new Date(battle.timestamp).getTime()) /
        (1000 * 60)
    )} mins ago
    `
    ).join("\n")}

    #Social Intelligence & Community Feedback
    Recent Social Activities:
    ${currentAgent.tweets
      .map(
        (tweet) => `
    - Tweet [${new Date(tweet.createdAt).toISOString()}]: "${tweet.content}"
    - Engagement Metrics:
      * Likes: ${tweet.engagement?.likes || 0}
      * Retweets: ${tweet.engagement?.retweets || 0}
      * Comments: ${tweet.engagement?.comments || 0}
      * Impressions: ${tweet.engagement?.impressions || 0}
      * Influencer Impact: ${tweet.engagement?.influencerImpact || 0}
    - Community Feedback:
      * Suggested Action: ${tweet.feedback?.suggestedAction || "N/A"}
      * Target Location: (${tweet.feedback?.coordinateX || "N/A"}, ${
          tweet.feedback?.coordinateY || "N/A"
        })
      * Confidence: ${tweet.feedback?.confidence || "N/A"}
      * Sentiment: ${tweet.feedback?.sentiment || "N/A"}
      * Reasoning: ${tweet.feedback?.reasoning || "N/A"}
    - Time: ${Math.floor(
      (currentTime.getTime() - new Date(tweet.createdAt).getTime()) /
        (1000 * 60)
    )} mins ago
    `
      )
      .join("\n")}

    #Character Evolution & Traits
    Current Trait Analysis:
    ${currentAgent.traits
      .map(
        (trait) => `
    - ${trait.traitName}: ${trait.traitValue}
      * Last Updated: ${Math.floor(
        (currentTime.getTime() - new Date(trait.lastUpdated).getTime()) /
          (1000 * 60 * 60 * 24)
      )} days ago
    `
      )
      .join("")}

    #Core Identity
    Background:
    ${currentAgent.bio.map((line) => `- ${line}`).join("\n")}

    Personal Lore:
    ${currentAgent.lore.map((line) => `- ${line}`).join("\n")}

    Strategic Knowledge Base:
    ${currentAgent.knowledge.map((line) => `- ${line}`).join("\n")}

    Decision Framework:
    1. Consider all economic indicators (tokens, rewards, transactions)
    2. Evaluate geographical advantages and movement patterns
    3. Analyze alliance network strength and reliability
    4. Review combat performance and threat assessment
    5. Factor in social sentiment and community feedback
    6. Stay true to character traits and evolution
    7. Balance short-term opportunities with long-term survival

    Choose your next action based on this comprehensive analysis while maintaining character consistency and strategic depth.
    `;

    // Log the query for monitoring
    await prisma.message.create({
      data: {
        content: enhancedContext,
        senderId: this.agentId,
        senderType: "SYSTEM",
        contentType: "TEXT",
        platform: "X_TWITTER",
      },
    });

    const tools = await getAgentTools(this.agentId, this.solana, this.twitter);

    try {
      const result = await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt: enhancedContext,
        tools,
        maxSteps: 5,
        toolChoice: "required",
      });
    } catch (error) {
      const errorMessage = `Error processing query: ${
        error instanceof Error ? error.message : String(error)
      }`;
      await prisma.message.create({
        data: {
          content: errorMessage,
          senderId: this.agentId,
          senderType: "SYSTEM",
          contentType: "TEXT",
          platform: "X_TWITTER",
        },
      });
    }
  }

  stop() {
    this.isRunning = false;
  }
}

//  Build and run with Docker:
// pnpm docker:build
// pnpm docker:run

// Or deploy directly:
// pnpm predeploy
// pnpm deploy
