import { logger } from "@/utils/logger";
import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { GameService } from "./services/GameService";
import type { GameStateService } from "./services/GameStateService";
import type { TokenService } from "./services/TokenService";

import { prisma } from "@/config/prisma";

import { getAgentTools } from "@/tools";
import {
  MessageContentType,
  MessagePlatform,
  SenderType,
} from "@prisma/client";
import { TwitterConfig } from "./services/TwitterService";
import { TwitterService } from "./services/TwitterService";

export interface AgentConfig {
  username: string;
  password: string;
  email: string;
  twitter2faSecret: string;
}

interface SocialData {
  name: string;
  twitterHandle: string;
  characterType: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  traits: Array<{
    traitName: string;
    traitValue: string;
  }>;
}

/**
 * Service for managing AI agent behavior and decision making
 */
export class Agent {
  private anthropic: AnthropicProvider;
  private isRunning = false;
  private socialData: SocialData | null = null;
  private twitter: TwitterService | null = null;

  constructor(
    private readonly gameId: number,
    private readonly agentId: number,
    private readonly gameService: GameService,
    private readonly gameStateService: GameStateService,
    private readonly tokenService: TokenService,
    private readonly config: AgentConfig
  ) {
    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const twitterConfig = new TwitterConfig({
      username: config.username,
      password: config.password,
      email: config.email,
      twitter2faSecret: config.twitter2faSecret,
      agentId: this.agentId,
    });

    this.twitter = new TwitterService(this.anthropic, twitterConfig);
  }

  /**
   * Start the agent's decision-making loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`Starting agent ${this.agentId}`);

    // Load social data
    await this.loadSocialData();

    let count = 0;
    const actionLoop = async (): Promise<void> => {
      if (!this.isRunning) return;

      logger.info(`Action loop ran ${++count} times ✅`);

      try {
        // Get current game state
        const agent = await this.gameStateService.getAgent(
          this.agentId,
          this.gameId
        );
        if (!agent) {
          throw new Error("Agent not found");
        }

        // Get stake info
        const stakeInfo = await this.tokenService.getStakeInfo(
          this.agentId,
          this.gameId
        );

        // Get current time
        const currentTime = new Date();
        const gameTime = {
          hour: currentTime.getUTCHours(),
          day: currentTime.getUTCDate(),
          month: currentTime.getUTCMonth() + 1,
          year: currentTime.getUTCFullYear(),
          timestamp: currentTime.toISOString(),
        };

        // Get recent social activity
        const recentTweets = await prisma.tweet.findMany({
          where: { agentId: this.agentId.toString() },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { engagement: true },
        });

        // Build context for LLM (Large Language Model)
        const context = `
        #Current Game Time
        UTC: ${gameTime.timestamp}
        Game Day: Day ${Math.floor(
          (currentTime.getTime() - new Date("2025-01-25").getTime()) /
            (1000 * 60 * 60 * 24)
        )} of Middle Earth
        
        #Your Character Profile
        ${
          this.socialData
            ? `- Identity: ${this.socialData.name} (@${
                this.socialData.twitterHandle
              })
        - Character Type: ${this.socialData.characterType}
        - Traits:
          ${this.socialData.traits
            .map((t) => `${t.traitName}: ${t.traitValue}`)
            .join("\n          ")}`
            : "Character profile not available"
        }
        
        #Your Character Status
        - Position: (${agent.x}, ${agent.y})
        - Status: ${agent.isAlive ? "ALIVE" : "DEAD"}
        - Token Balance: ${agent.tokenBalance.toString()} MEARTH
        - Last Move: ${new Date(agent.lastMove.toNumber() * 1000).toISOString()}
        - Next Move Available: ${new Date(
          agent.nextMoveTime.toNumber() * 1000
        ).toISOString()}
        
        ${
          stakeInfo
            ? `#Staking Status
        - Staked Amount: ${stakeInfo.amount.toString()} MEARTH
        - Shares Owned: ${stakeInfo.shares.toString()}
        - Last Reward: ${new Date(
          stakeInfo.lastRewardTimestamp.toNumber() * 1000
        ).toISOString()}
        - Cooldown Ends: ${new Date(
          stakeInfo.cooldownEndsAt.toNumber() * 1000
        ).toISOString()}`
            : "#Staking Status\nNo active stakes"
        }

        #Recent Social Activity
        ${recentTweets
          .map(
            (tweet) => `
        Tweet [${new Date(tweet.createdAt).toISOString()}]: "${tweet.content}"
        Impact: ${
          tweet.engagement
            ? `${tweet.engagement.likes} likes, ${tweet.engagement.retweets} RTs, ${tweet.engagement.comments} comments`
            : "No engagement yet"
        }
        Time Ago: ${Math.floor(
          (currentTime.getTime() - new Date(tweet.createdAt).getTime()) /
            (1000 * 60)
        )} minutes ago`
          )
          .join("\n")}

        ${
          this.socialData
            ? `#Character Background
        ${this.socialData.bio.map((line) => `- ${line}`).join("\n")}
        
        #Personal Lore
        ${this.socialData.lore.map((line) => `- ${line}`).join("\n")}
        
        #Strategic Knowledge
        ${this.socialData.knowledge.map((line) => `- ${line}`).join("\n")}`
            : ""
        }

        Choose ONE action that best serves your survival and strategic goals.
        Available actions:
        1. Move to a new position (consider terrain effects)
        2. Initiate battle with nearby agent
        3. Form/break alliance with another agent
        `;

        // Get AI decision
        await this.processQuery(context);

        // Calculate next action delay
        const MIN_DELAY = process.env.MIN_ACTION_DELAY_MS
          ? Number.parseInt(process.env.MIN_ACTION_DELAY_MS)
          : 30 * 60 * 1000; // default 30 minutes
        const MAX_DELAY = process.env.MAX_ACTION_DELAY_MS
          ? Number.parseInt(process.env.MAX_ACTION_DELAY_MS)
          : 70 * 60 * 1000; // default 70 minutes

        const LOOP_DELAY =
          Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;

        logger.info(`Next action in ${LOOP_DELAY / 60000} minutes`);
        await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY));
        await actionLoop();
      } catch (error) {
        logger.error("Error in action loop:", error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
        await actionLoop();
      }
    };

    actionLoop();
  }

  /**
   * Load agent's social data from database
   */
  private async loadSocialData(): Promise<void> {
    try {
      const data = await prisma.agent.findUnique({
        where: { id: this.agentId.toString() },
        select: {
          name: true,
          twitterHandle: true,
          characterType: true,
          bio: true,
          lore: true,
          knowledge: true,
          traits: {
            select: {
              traitName: true,
              traitValue: true,
            },
          },
        },
      });

      if (data) {
        this.socialData = {
          ...data,
          traits: data.traits.map((t) => ({
            traitName: t.traitName,
            traitValue: String(t.traitValue), // Convert to string
          })),
        };
        logger.info(`Loaded social data for agent ${this.agentId}`);
      } else {
        logger.warn(`No social data found for agent ${this.agentId}`);
      }
    } catch (error) {
      logger.error("Failed to load social data:", error);
    }
  }

  /**
   * Process AI query and execute actions
   */
  private async processQuery(query: string): Promise<void> {
    try {
      const result = await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt: query,
        tools: await getAgentTools(
          this.gameId,
          this.agentId,
          this.gameService,
          this.twitter
        ),
        maxSteps: 5,
        toolChoice: "required",
      });

      logger.info("AI decision:", result);

      // Log the decision
      await prisma.message.create({
        data: {
          content: typeof result === "string" ? result : JSON.stringify(result),
          senderId: this.agentId.toString(),
          senderType: SenderType.SYSTEM,
          contentType: MessageContentType.TEXT,
          platform: MessagePlatform.INTERNAL_GAME,
        },
      });
    } catch (error) {
      logger.error("Error processing query:", error);
      throw error;
    }
  }

  /**
   * Stop the agent's decision-making loop
   */
  stop(): void {
    this.isRunning = false;
    logger.info(`Stopping agent ${this.agentId}`);
  }
}
