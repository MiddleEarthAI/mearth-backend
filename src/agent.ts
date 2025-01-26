import { v4 as uuidv4 } from "uuid";

import { IAgent } from "./types";
import { Solana } from "./deps/solana";

import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Message } from "ai";
import { logger } from "./utils/logger";
import { Twitter } from "./deps/twitter";
import { Telegram } from "./deps/telegram";
import { moveTool } from "./actions/movement";
import { tweetTool } from "./actions/tweet";

export interface AgentConfig {
  username: string;
  password: string;
  email: string;
  twitter2faSecret: string;
}

export class Agent implements IAgent {
  private anthropic: AnthropicProvider;
  private solana: Solana;
  private messages: Message[]; // store conversation history in memory
  private twitter: Twitter | null = null;
  private telegram: Telegram | null = null;
  private isRunning: boolean = false;

  constructor(agentConfig: AgentConfig, readonly agentId: string) {
    logger.info("initializing agent...");
    this.isRunning = false;
    // Initialize Anthropic anthropic - expects ANTHROPIC_API_KEY in environment
    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    // this.twitter = new Twitter(this.anthropic, {
    //   agentId,
    //   username: agentConfig.username,
    //   password: agentConfig.password,
    //   email: agentConfig.email,
    //   twitter2faSecret: agentConfig.twitter2faSecret,
    // });

    this.telegram = new Telegram(this.anthropic, {
      agentId,
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      targetGroups: ["@middleearthai"],
      pollInterval: 120,
      dryRun: true,
    });

    this.messages = [];
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

    const actionLoop = async () => {
      let count = 0;
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
        ? parseInt(process.env.MIN_ACTION_DELAY_MS)
        : 2 * 60 * 1000; // default to 2 minutes
      const MAX_DELAY = process.env.MAX_ACTION_DELAY_MS
        ? parseInt(process.env.MAX_ACTION_DELAY_MS)
        : 10 * 60 * 1000; // default to 10 minutes

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

      #Action Instructions
      As ${currentAgent.name}, consider your options:

      1. MOVE (Tactical Positioning):
         - Analyze terrain risks vs rewards
         - Consider distance to allies/enemies
         - Account for token-based battle odds
         - Plan escape routes if needed
         - Factor in terrain movement penalties

      2. TWEET (Strategic Communication):
         - Form/maintain alliances
         - Intimidate or deceive enemies
         - Share or request information
         - Signal intentions or bluff
         - React to recent events

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
    // Add user input to conversation history
    this.messages.push({
      role: "user",
      content: query,
      id: uuidv4(),
      createdAt: new Date(),
    });

    try {
      await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt: query,
        tools: {
          move: await moveTool(this.agentId, this.solana),
          tweet: await tweetTool(this.agentId, this.twitter),
        },
        maxSteps: 5,
        toolChoice: "required",
        // messages: this.messages,
      });
    } catch (error) {
      const errorMessage = `Error processing query: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.messages.push({
        role: "assistant",
        content: errorMessage,
        id: uuidv4(),
        createdAt: new Date(),
      });
      return errorMessage;
    }
  }

  getConversationHistory(): Message[] {
    return this.messages;
  }

  stop() {
    this.isRunning = false;
  }
}
