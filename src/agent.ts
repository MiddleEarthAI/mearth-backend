import { moveTool, tweetTool } from "./actions/";
import { v4 as uuidv4 } from "uuid";

import { IAgent } from "./types";
import { Solana } from "./deps/solana";

import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Message } from "ai";
import { logger } from "./utils/logger";
import { Twitter } from "./deps/twitter";

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
          include: { agents: true },
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
      - Outcome: ${battle.outcome}
      - Tokens Burned: ${battle.tokensBurned} MEARTH
      - Win Probability: ${battle.winningProbability}%
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
      - Outcome: ${battle.outcome}
      - Tokens Burned: ${battle.tokensBurned} MEARTH
      - Win Probability: ${battle.winningProbability}%
      - Time Ago: ${Math.floor(
        (currentTime.getTime() - new Date(battle.timestamp).getTime()) /
          (1000 * 60)
      )} minutes ago
      `
      ).join("\n")}

      #Active Alliances
      ${
        currentAgent.alliances
          .map(
            (alliance) => `
      - Allied with: @${
        alliance.agents.find((agent) => agent.id !== currentAgent.id)
          ?.twitterHandle
      }
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
      `
          )
          .join("\n") || "No active alliances"
      }

      #World State & Environment
      Map Boundaries:
      - Rivers: Slow movement (70% slower), coordinates include key points like (27,7), (27,8), (10,4), etc.
      - Mountains: Difficult terrain (50% slower), coordinates include peaks at (6,12), (13,15), (22,8), etc.
      - Plains: Normal movement speed, safe terrain at coordinates like (1,1), (1,2), (2,1), (2,2)

      Current Terrain Analysis:
      - Your position (${currentAgent.currentLocation.x}, ${
        currentAgent.currentLocation.y
      }) is on ${currentAgent.currentLocation.terrain}
      - Nearby terrain features affect movement speed and risk
      - Consider terrain advantages for strategic positioning

      Immediate Threats (Within 2 units - Battle Range):
      ${
        agents
          ?.filter(
            (agent) =>
              agent.id !== currentAgent.id &&
              agent.status === "ACTIVE" &&
              Math.sqrt(
                Math.pow(
                  agent.currentLocation.x - currentAgent.currentLocation.x,
                  2
                ) +
                  Math.pow(
                    agent.currentLocation.y - currentAgent.currentLocation.y,
                    2
                  )
              ) <= 2
          )
          .map(
            (agent) => `
      ⚠️ @${agent.twitterHandle}:
      - Type: ${agent.characterType}
      - Position: (${agent.currentLocation.x}, ${agent.currentLocation.y}) [${
              agent.currentLocation.terrain
            }]
      - Power: ${agent.wallet.governanceTokens} MEARTH
      - Distance: ${Math.sqrt(
        Math.pow(agent.currentLocation.x - currentAgent.currentLocation.x, 2) +
          Math.pow(agent.currentLocation.y - currentAgent.currentLocation.y, 2)
      ).toFixed(2)} units
      - Recent Tweet: "${agent.tweets[0]?.content || "No recent tweets"}"
      `
          )
          .join("\n") || "No immediate threats"
      }

      Nearby Agents (2-10 units):
      ${
        agents
          ?.filter((agent) => {
            const distance = Math.sqrt(
              Math.pow(
                agent.currentLocation.x - currentAgent.currentLocation.x,
                2
              ) +
                Math.pow(
                  agent.currentLocation.y - currentAgent.currentLocation.y,
                  2
                )
            );
            return (
              agent.id !== currentAgent.id &&
              agent.status === "ACTIVE" &&
              distance > 2 &&
              distance <= 10
            );
          })
          .map(
            (agent) => `
      @${agent.twitterHandle}:
      - Type: ${agent.characterType}
      - Position: (${agent.currentLocation.x}, ${agent.currentLocation.y}) [${
              agent.currentLocation.terrain
            }]
      - Power: ${agent.wallet.governanceTokens} MEARTH
      - Distance: ${Math.sqrt(
        Math.pow(agent.currentLocation.x - currentAgent.currentLocation.x, 2) +
          Math.pow(agent.currentLocation.y - currentAgent.currentLocation.y, 2)
      ).toFixed(2)} units
      - Recent Tweet: "${agent.tweets[0]?.content || "No recent tweets"}"
      `
          )
          .join("\n") || "No agents nearby"
      }

      Notable Distant Agents:
      ${
        agents
          ?.filter(
            (agent) =>
              agent.id !== currentAgent.id &&
              agent.status === "ACTIVE" &&
              agent.wallet.governanceTokens > 1000
          )
          .slice(0, 3)
          .map(
            (agent) => `
      @${agent.twitterHandle}:
      - Type: ${agent.characterType}
      - Position: (${agent.currentLocation.x}, ${agent.currentLocation.y})
      - Power: ${agent.wallet.governanceTokens} MEARTH
      - Recent Tweet: "${agent.tweets[0]?.content || "No recent tweets"}"
      `
          )
          .join("\n") || "No notable distant agents"
      }

      #Game Rules Reminder
      - Movement: 1 unit/hour (Mountains: 50% slower, Rivers: 70% slower)
      - Battle Range: Within 2 units
      - Battle Outcome: Based on MEARTH token ratio
      - Death Risk: 5% on battle loss, 1% when crossing difficult terrain
      - Token Burn: 31-50% on battle loss
      
      #Task Instructions
      As ${currentAgent.name} (@${currentAgent.twitterHandle}), a ${
        currentAgent.characterType
      }, choose ONE action:

      1. MOVE:
         - Analyze terrain before movement (rivers slow by 70%, mountains by 50%)
         - Check coordinates against known terrain features
         - Avoid dangerous terrain unless necessary
         - Consider terrain advantages for battles
         - Plan routes that optimize for terrain safety
         - Strategic positioning relative to other agents
         - Account for time of day and agent patterns

      2. TWEET:
         - Engage with other agents based on their recent actions
         - Form/maintain alliances considering time restrictions
         - Intimidate opponents when advantageous
         - Rally community support for your strategy
         - React to recent game events
         
      Your decision should reflect:
      - Your character traits and personality
      - Current power level (MEARTH tokens)
      - Time-based strategy (day/night patterns)
      - Nearby threats and opportunities
      - Recent battle history
      - Active alliances and their timing
      - Current terrain and movement implications
      - Environmental awareness of rivers, mountains, and plains
      
      Remember: Every action affects your survival chances. Choose wisely and stay true to your character.
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
