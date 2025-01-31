import { logger } from "@/utils/logger";
import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { GameStateService } from "../services/GameStateService";

import { TwitterClient } from "@/agent/TwitterClient";
import { prisma } from "@/config/prisma";
import { getAgentTools } from "@/tools";
import type { Prisma } from "@prisma/client";

type AgentData = Prisma.AgentGetPayload<{
  include: {
    tokenomics: true;
    personality: true;
    strategy: true;
    location: true;
    state: true;
    community: {
      include: {
        interactions: true;
      };
    };
    currentAlliance: true;
    cooldowns: true;
    battles: true;
    alliedBy: true;
    battlesAsOpponent: true;
  };
}>;

/**
 * Service for managing AI agentData behavior and decision making
 */
export class Agent {
  private gameId: number;
  private agentId: number;
  private anthropic: AnthropicProvider;
  private isRunning = false;
  private agentData: AgentData | null = null;
  private twitterClient: TwitterClient | null = null;

  constructor(
    agentId: number,
    gameId: number,
    private readonly gameStateService: GameStateService
  ) {
    this.agentId = agentId;
    this.gameId = gameId;
    const ACCESS_TOKEN = process.env[`TWITTER_ACCESS_TOKEN_${this.agentId}`];
    const ACCESS_SECRET = process.env[`TWITTER_ACCESS_SECRET_${this.agentId}`];
    if (!ACCESS_TOKEN || !ACCESS_SECRET) {
      throw new Error("Twitter credentials not found");
    }

    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.twitterClient = new TwitterClient({
      agentId: this.agentId,
      accessToken: ACCESS_TOKEN,
      accessSecret: ACCESS_SECRET,
    });

    this.init();
  }

  /**
   * Initialize agentData state and knowledge
   */
  private async init(): Promise<void> {
    try {
      logger.info("🔥🔥🔥🔥🔥🔥 agent Id about to be found", this.agentId);

      // Load agentData data from database
      const agentData = await prisma.agent.findUnique({
        where: { agentId: this.agentId },
        include: {
          battles: true,
          alliedBy: true,
          community: {
            include: {
              interactions: true,
              _count: true,
            },
          },
          personality: true,
          currentAlliance: true,

          battlesAsOpponent: true,
          location: true,
          state: true,
          strategy: true,
          tokenomics: true,
          cooldowns: true,
        },
      });

      if (!agentData) {
        throw new Error(
          `Agent with agentId ${this.agentId} not found in database`
        );
      }

      this.agentData = agentData;

      logger.info(
        `Agent ${this.agentId} with gameId ${this.gameId} with id 
        ${this.agentData?.id} with twitter handle ${this.agentData?.xHandle} with name ${this.agentData?.name} initialized successfully`
      );
    } catch (error) {
      logger.error("Failed to initialize agentData:", error);
      throw error;
    }
  }

  /**
   * Start the agentData's decision-making loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`Starting agentData ${this.agentId}`);
    const MAX_ACTION_DELAY_MS = process.env.MAX_ACTION_DELAY_MS
      ? Number(process.env.MAX_ACTION_DELAY_MS)
      : 60 * 70 * 1000; // 1hr 10 minutes
    const MIN_ACTION_DELAY_MS = process.env.MIN_ACTION_DELAY_MS
      ? Number(process.env.MIN_ACTION_DELAY_MS)
      : 60 * 60 * 1000; // 1hr

    const actionLoop = async (): Promise<void> => {
      if (!this.isRunning) return;

      try {
        const context = await this.generateContext();

        // Get AI decision using tools
        await generateText({
          model: this.anthropic("claude-3-sonnet-20240229"),
          prompt: context,
          tools: await getAgentTools(
            Number(this.gameId),
            Number(this.agentId),
            this.twitterClient
          ),
          maxSteps: 5,
          toolChoice: "required",
        });

        // Calculate next action delay
        const delay = Math.floor(
          Math.random() * (MAX_ACTION_DELAY_MS - MIN_ACTION_DELAY_MS + 1) +
            MIN_ACTION_DELAY_MS
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        await actionLoop();
      } catch (error) {
        logger.error("Error in action loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await actionLoop();
      }
    };

    actionLoop();
  }

  async generateContext(): Promise<string> {
    // Get current game state
    const agentAccount = await this.gameStateService.getAgent(
      Number(this.gameId),
      Number(this.agentId)
    );

    if (!agentAccount) {
      throw new Error("Agent not found");
    }

    // Core system prompt that defines the agent's role and capabilities
    const SYSTEM_CONTEXT = `You are an autonomous agent in Middle Earth AI, a strategic game where agents compete for territory and influence. You must stay in character and make decisions based on your personality traits and current situation.

Role: ${this.agentData?.name} (@${this.agentData?.xHandle})
Character Type: ${this.agentData?.characteristics.join(", ")}

Background:
• Bio: ${
      this.agentData?.bio
        ? this.agentData.bio
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)
            .join(", ")
        : ""
    }
• Lore: ${
      this.agentData?.lore
        ? this.agentData.lore
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)
            .join(", ")
        : ""
    }
• Influence Level: ${this.agentData?.influenceDifficulty || "Standard"}

Core Attributes:
• Health: ${this.agentData?.state?.health}/100
• Status: ${this.agentData?.state?.isAlive ? "ACTIVE" : "DEFEATED"}
• Position: (${this.agentData?.location?.x}, ${
      this.agentData?.location?.y
    }) on ${this.agentData?.location?.terrainType}
${
  this.agentData?.location?.stuckTurnsRemaining
    ? `• Movement Restricted: ${this.agentData?.location?.stuckTurnsRemaining} turns`
    : ""
}

Personality Matrix:
${
  this.agentData?.personality
    ? `
• Aggression: ${this.agentData.personality.aggressiveness}/10
• Trust: ${this.agentData.personality.trustworthiness}/10
• Intelligence: ${this.agentData.personality.intelligence}/10
• Adaptability: ${this.agentData.personality.adaptability}/10`
    : ""
}

Resources:
${
  this.agentData?.tokenomics
    ? `• Staked: ${this.agentData.tokenomics.stakedTokens} MEARTH
• Win Rate: ${this.agentData.tokenomics.winRate}%
• Record: ${this.agentData.tokenomics.totalWon}W-${this.agentData.tokenomics.totalLost}L`
    : ""
}

Social Influence:
${
  this.agentData?.community
    ? `• Followers: ${this.agentData.community.followers}
• Engagement: ${this.agentData.community.averageEngagement}
• Supporters: ${this.agentData.community.supporterCount}`
    : ""
}

${
  this.agentData?.currentAlliance
    ? `Current Alliance:
• Allied with: Agent ${this.agentData.currentAlliance.alliedAgentId}
• Combined Force: ${this.agentData.currentAlliance.combinedTokens} MEARTH
• Breakable: ${this.agentData.currentAlliance.canBreakAlliance ? "Yes" : "No"}`
    : ""
}`;

    // Dynamic context that changes with each decision
    const CURRENT_SITUATION = `
Current State:
• Last Action: ${this.agentData?.state?.lastActionType} (${
      this.agentData?.state?.lastActionDetails
    })
• Active Cooldowns: ${
      this.agentData?.cooldowns
        ?.map(
          (cd) => `${cd.type} vs Agent ${cd.targetAgentId} until ${cd.endsAt}`
        )
        .join(", ") || "None"
    }

Recent Community Interactions:
${
  this.agentData?.community?.interactions
    ?.slice(0, 3) // Only show 3 most recent interactions
    .map(
      (int) =>
        `• ${int.type}: ${int.sentiment} sentiment, ${int.engagement} engagement`
    )
    .join("\n") || "No recent interactions"
}

Game Rules:
1. All actions must be announced via tweets
2. Terrain affects movement (Mountain: 2 turns, River: 1 turn, Plain: 0 turns)
3. Battles require token stakes with 5% death risk
4. Community engagement affects your influence

Based on this context, determine your next strategic action while maintaining character consistency. Consider:
1. Terrain and movement restrictions
2. Available resources and risks
3. Community sentiment
4. Strategic opportunities
5. Active cooldowns`;

    return `${SYSTEM_CONTEXT}\n\n${CURRENT_SITUATION}`;
  }

  async getEngagements() {
    if (!this.twitterClient) {
      throw new Error("Twitter client not initialized");
    }
    const tweets = await this.twitterClient.getOwnTweets();
    const engagementAnalysis = await Promise.all(
      tweets.data.map((tweet) =>
        this.twitterClient?.analyzeEngagement(tweet.id)
      )
    );
    console.log(engagementAnalysis);
    return engagementAnalysis;
  }

  /**
   * Stop the agentData
   */
  stop(): void {
    this.isRunning = false;
    logger.info(`Stopping agentData ${this.agentId}`);
  }
}
