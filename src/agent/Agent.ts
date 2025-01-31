import { logger } from "@/utils/logger";
import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { TwitterClient } from "@/agent/TwitterClient";
import { prisma } from "@/config/prisma";
import { tweetTool } from "@/tools/static/tweet.tool";

/**
 * Service for managing AI agentData behavior and decision making
 */
export class Agent {
  private currentGameId: number;
  private agentId: number;
  private anthropic: AnthropicProvider;
  private isRunning = false;

  private twitterClient: TwitterClient | null = null;

  constructor(agentId: number, currentGameId: number) {
    this.agentId = agentId;
    this.currentGameId = currentGameId;
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
  }

  /**
   * Start the agentData's decision-making loop
   */

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`Starting agentData ${this.agentId}`);
    const MAX_ACTION_DELAY_MS = 60 * 70 * 1000; // 1hr 10 minutes
    const MIN_ACTION_DELAY_MS = 60 * 60 * 1000; // 1hr

    const actionLoop = async (): Promise<void> => {
      if (!this.isRunning) return;

      try {
        const context = await this.generateContextString();

        // Get AI decision using tools
        const { text, steps } = await generateText({
          model: this.anthropic("claude-3-sonnet-20240229"),
          prompt: context,
          tools: {
            tweet: tweetTool(this.twitterClient),
          },
          maxSteps: 1,
          toolChoice: "required",
        });
        logger.info(`Agent ${this.agentId} decision: ${text}`);
        logger.info(`Agent ${this.agentId} steps: ${steps}`);
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

  async generateContextString(): Promise<string> {
    const dbAgent = await prisma.agent.findUnique({
      where: { agentId: Number(this.agentId) },
      include: {
        state: true,
        location: true,
        personality: true,
        tokenomics: true,
        currentAlliance: true,
        cooldowns: true,
        community: {
          include: {
            interactions: true,
          },
        },
      },
    });

    // Core system prompt that defines the agent's role and capabilities
    const SYSTEM_CONTEXT = `You are an autonomous agent in Middle Earth AI, a strategic game where agents compete for territory and influence. You must stay in character and make decisions based on your personality traits and current situation.

Role: ${dbAgent?.name} (@${dbAgent?.xHandle})
Character Type: ${dbAgent?.characteristics.join(", ")}

Background:
• Bio: ${
      dbAgent?.bio
        ? dbAgent.bio
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)
            .join(", ")
        : ""
    }
• Lore: ${
      dbAgent?.lore
        ? dbAgent.lore
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)
            .join(", ")
        : ""
    }
• Influence Level: ${dbAgent?.influenceDifficulty || "Standard"}

Core Attributes:
• Health: ${dbAgent?.state?.health}/100
• Status: ${dbAgent?.state?.isAlive ? "ACTIVE" : "DEFEATED"}
• Position: (${dbAgent?.location?.x}, ${dbAgent?.location?.y}) on ${
      dbAgent?.location?.terrainType
    }
${
  dbAgent?.location?.stuckTurnsRemaining
    ? `• Movement Restricted: ${dbAgent?.location?.stuckTurnsRemaining} turns`
    : ""
}

Personality Matrix:
${
  dbAgent?.personality
    ? `
• Aggression: ${dbAgent?.personality.aggressiveness}/10
• Trust: ${dbAgent?.personality.trustworthiness}/10
• Intelligence: ${dbAgent?.personality.intelligence}/10
• Adaptability: ${dbAgent?.personality.adaptability}/10`
    : ""
}

Resources:
${
  dbAgent?.tokenomics
    ? `• Staked: ${dbAgent?.tokenomics.stakedTokens} MEARTH
• Win Rate: ${dbAgent?.tokenomics?.winRate}%
• Record: ${dbAgent?.tokenomics?.totalWon}W-${dbAgent?.tokenomics?.totalLost}L`
    : ""
}

Social Influence:
${
  dbAgent?.community
    ? `• Followers: ${dbAgent?.community.followers}
• Engagement: ${dbAgent?.community?.averageEngagement}
• Supporters: ${dbAgent?.community?.supporterCount}`
    : ""
}

${
  dbAgent?.currentAlliance
    ? `Current Alliance:
• Allied with: Agent ${dbAgent?.currentAlliance?.alliedAgentId}
• Combined Force: ${dbAgent?.currentAlliance?.combinedTokens} MEARTH
• Breakable: ${dbAgent?.currentAlliance?.canBreakAlliance ? "Yes" : "No"}`
    : ""
}`;

    // Dynamic context that changes with each decision
    const CURRENT_SITUATION = `
Current State:
• Last Action: ${dbAgent?.state?.lastActionType} (${
      dbAgent?.state?.lastActionDetails
    })
• Active Cooldowns: ${
      dbAgent?.cooldowns
        ?.map(
          (cd) => `${cd.type} vs Agent ${cd.targetAgentId} until ${cd.endsAt}`
        )
        .join(", ") || "None"
    }

Recent Community Interactions:
${
  dbAgent?.community?.interactions
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
      tweets.data.data.map((tweet) =>
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
