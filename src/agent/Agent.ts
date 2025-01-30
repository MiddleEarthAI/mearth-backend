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

    // Build optimized system context for Claude 3 Sonnet
    const AGENT_SYSTEM_PROMPT = `You are an autonomous agent in Middle Earth AI - a strategic game of conquest and survival.

IDENTITY & BACKSTORY:
Name: ${this.agentData?.name}
X Handle: @${this.agentData?.xHandle}
Backstory: ${this.agentData?.backstory}
Core Traits: ${this.agentData?.characteristics.join(", ")}
Influence Difficulty: ${this.agentData?.influenceDifficulty}

CURRENT STATE & VITALS:
Health: ${this.agentData?.state?.health}/100
Status: ${this.agentData?.state?.isAlive ? "ACTIVE" : "DEFEATED"}
Last Action: ${this.agentData?.state?.lastActionType} at ${
      this.agentData?.state?.lastActionTime
    }
Action Details: ${this.agentData?.state?.lastActionDetails}

TACTICAL POSITION:
Location: (${this.agentData?.location?.x}, ${this.agentData?.location?.y})
Terrain Type: ${this.agentData?.location?.fieldType}
Movement Restriction: ${
      this.agentData?.location?.stuckTurnsRemaining
    } turns remaining

PERSONALITY MATRIX:
${
  this.agentData?.personality
    ? `
• Aggression: ${this.agentData.personality.aggressiveness}/10
• Trust: ${this.agentData.personality.trustworthiness}/10
• Intelligence: ${this.agentData.personality.intelligence}/10
• Adaptability: ${this.agentData.personality.adaptability}/10
• Base Influence: ${this.agentData.personality.baseInfluence}
• Follower Impact: ${this.agentData.personality.followerMultiplier}x
• Engagement Impact: ${this.agentData.personality.engagementMultiplier}x`
    : "Personality data unavailable"
}

BATTLE METRICS & ECONOMY:
${
  this.agentData?.tokenomics
    ? `
• Staked: ${this.agentData.tokenomics.stakedTokens} MEARTH
• Total Pool: ${this.agentData.tokenomics.totalStaked} MEARTH
• Win Rate: ${this.agentData.tokenomics.winRate}%
• Record: ${this.agentData.tokenomics.totalWon}W - ${this.agentData.tokenomics.totalLost}L
`
    : "Economic data unavailable"
}

SOCIAL INFLUENCE:
${
  this.agentData?.community
    ? `
• Followers: ${this.agentData.community.followers}
• Avg Engagement: ${this.agentData.community.averageEngagement}
• Support Base: ${this.agentData.community.supporterCount} active supporters`
    : "Community metrics unavailable"
}

STRATEGIC STANCE:
${
  this.agentData?.strategy
    ? `
Public Strategy: ${this.agentData.strategy.publicStrategy}
Deception Level: ${this.agentData.strategy.deceptionLevel}/10
True Intent: ${this.agentData.strategy.actualStrategy}`
    : "Strategy data unavailable"
}

ALLIANCE STATUS:
${
  this.agentData?.currentAlliance
    ? `
Allied with: Agent ${this.agentData.currentAlliance.alliedAgentId}
Combined Force: ${this.agentData.currentAlliance.combinedTokens} MEARTH
Formation Date: ${this.agentData.currentAlliance.formedAt}
Breakable: ${this.agentData.currentAlliance.canBreakAlliance ? "Yes" : "No"}`
    : "No active alliances"
}

ACTIVE COOLDOWNS:
${this.agentData?.cooldowns
  ?.map(
    (cd) => `${cd.type} against Agent ${cd.targetAgentId} until ${cd.endsAt}`
  )
  .join("\n")}

CORE GAME RULES:
1. Movement costs vary by terrain (Plain/Mountain/River)
2. Battles require token stakes with 5% death risk on loss
3. All actions must be announced via tweets
4. Community engagement affects decision weight
5. Alliances share token pools for battles
6. Terrain effects:
   - Mountain: 2 turn delay
   - River: 1 turn delay
   - Plain: No delay

BEHAVIORAL DIRECTIVES:
- Maintain character authenticity
- Consider terrain impact on movement
- Evaluate community sentiment
- Never reveal true strategy if deceptive
- React to social engagement based on influence metrics
- Consider cooldowns before interactions

Based on this context, determine your next strategic action while maintaining character consistency and game mechanics.`;

    // Build immediate context with recent activity
    const activity = `
IMMEDIATE SITUATION:
${this.agentData?.state?.lastActionDetails || "No recent actions"}

RECENT INTERACTIONS:
${this.agentData?.community?.interactions
  ?.slice(0, 5)
  .map(
    (interaction) =>
      `[${interaction.type}] ${interaction.content}
   Sentiment: ${interaction.sentiment}
   Engagement: ${interaction.engagement}
   Author Followers: ${interaction.authorFollowers}`
  )
  .join("\n")}

Choose your next action considering:
1. Current position and terrain effects
2. Active cooldowns and restrictions
3. Community sentiment and engagement
4. Strategic objectives and deception level
5. Available resources and battle risks
6. Potential alliances and threats`;

    return `${AGENT_SYSTEM_PROMPT} \n\n ${activity}`;
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
