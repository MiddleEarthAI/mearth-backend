import { logger } from "@/utils/logger";
import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { prisma } from "@/config/prisma";
import { Agent as AgentModel } from "@prisma/client";
import { tweetTool } from "@/tools/static/tweet.tool";

import { getTerrainTypeByCoordinates } from "@/constants";
import { TwitterApi } from "twitter-api-v2";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { TerrainType } from "@prisma/client";
import { Twitter } from "@/services/twitter";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  battleTool,
  breakAllianceTool,
  formAllianceTool,
  movementTool,
} from "@/tools/static";

/**
 * Service for managing AI agentData behavior and decision making
 */
export class Agent {
  private currentGameId: number;
  private anthropic: AnthropicProvider;
  private isRunning = false;
  private twitterApi: TwitterApi;
  private twitter: Twitter;
  private agent: AgentModel;

  constructor(agent: AgentModel, currentGameId: number) {
    this.agent = agent;
    this.currentGameId = currentGameId;
    const API_KEY = process.env.TWITTER_API_KEY;

    const API_SECRET = process.env.TWITTER_API_SECRET;
    const ACCESS_TOKEN =
      process.env[`TWITTER_ACCESS_TOKEN_${this.agent.agentId}`];
    const ACCESS_SECRET =
      process.env[`TWITTER_ACCESS_SECRET_${this.agent.agentId}`];

    if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
      throw new Error("Twitter credentials not found");
    }

    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.twitterApi = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_SECRET,
      accessToken: ACCESS_TOKEN,
      accessSecret: ACCESS_SECRET,
    });

    this.twitter = new Twitter(this.twitterApi, this.agent);
  }

  /**
   * Start the agent's decision-making loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`Starting agent ${this.agent.agentId}`);
    this.twitter.start();

    const MAX_ACTION_DELAY_MS = 60 * 70 * 1000; // 1hr 10 minutes
    const MIN_ACTION_DELAY_MS = 60 * 60 * 1000; // 1hr

    const actionLoop = async (): Promise<void> => {
      if (!this.isRunning) return;

      try {
        const prompt = await this.generateContextString();

        // Get AI decision using tools
        const { text, steps } = await generateText({
          model: this.anthropic("claude-3-sonnet-20240229"),
          prompt: prompt,
          tools: {
            tweet: await tweetTool({
              agentId: this.agent.agentId,
              gameId: this.currentGameId,
              twitterApi: this.twitterApi,
            }),
            formAlliance: await formAllianceTool({
              gameId: this.currentGameId,
              agentId: this.agent.agentId,
            }),
            movement: movementTool({
              gameId: this.currentGameId,
              agentId: this.agent.agentId,
            }),
            battle: battleTool({
              gameId: this.currentGameId,
              agentId: this.agent.agentId,
            }),
            breakAlliance: await breakAllianceTool({
              gameId: this.currentGameId,
              agentId: this.agent.agentId,
            }),
          },
          maxSteps: 5,
          toolChoice: "required",
        });

        logger.info(`Agent ${this.agent.agentId} decision: ${text}`);
        logger.info(`Agent ${this.agent.agentId} steps: ${steps}`);

        // Calculate next action delay
        const delay = Math.floor(
          Math.random() * (MAX_ACTION_DELAY_MS - MIN_ACTION_DELAY_MS + 1) +
            MIN_ACTION_DELAY_MS
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        await actionLoop();
      } catch (error) {
        logger.error("Error in action loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
        await actionLoop();
      }
    };

    actionLoop();
  }

  /**
   * Stop the agent and its monitoring services
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.twitter.stop();
    logger.info(`Stopped agent ${this.agent.agentId}`);
  }

  async generateContextString(): Promise<string> {
    logger.info(
      `Generating context string for agent ${this.agent.agentId} in game ${this.currentGameId}`
    );

    // const program = await getProgramWithWallet();
    // const [gamePda] = await PublicKey.findProgramAddress(
    //   [Buffer.from("game"), new BN(this.currentGameId).toBuffer("le", 4)],
    //   program.programId
    // );
    // const [agentPda] = await PublicKey.findProgramAddress(
    //   [
    //     Buffer.from("agent"),
    //     gamePda.toBuffer(),
    //     Uint8Array.of(new BN(this.agent.agentId)),
    //   ],
    //   program.programId
    // );
    // const agentAccount = await program.account.agent.fetch(agentPda);

    const [agent, otherAgents] = await Promise.all([
      prisma.agent.findUnique({
        where: { agentId: Number(this.agent.agentId) },
        include: {
          state: true,
          personality: true,
          cooldowns: true,
          currentAlliance: true,
          community: {
            include: {
              interactions: {
                orderBy: { timestamp: "desc" },
                take: 10,
              },
            },
          },
          battles: {
            orderBy: { timestamp: "desc" },
            take: 5,
            include: {
              opponent: true,
            },
          },
          location: true,
        },
      }),
      prisma.agent.findMany({
        where: {
          game: {
            gameId: this.currentGameId,
          },
        },
      }),
    ]);

    const terrainType = getTerrainTypeByCoordinates(
      agent?.location?.x || 0,
      agent?.location?.y || 0
    );

    // Calculate community influence metrics
    const communityMetrics = agent?.community?.interactions.reduce(
      (metrics, interaction) => {
        return {
          positiveEngagement:
            metrics.positiveEngagement +
            (interaction.sentiment === "positive" ? 1 : 0),
          totalEngagement: metrics.totalEngagement + interaction.engagement,
          deceptionAttempts:
            metrics.deceptionAttempts + (interaction.isDeceptive ? 1 : 0),
          strategicSuggestions:
            metrics.strategicSuggestions +
            (interaction.suggestedAction ? 1 : 0),
        };
      },
      {
        positiveEngagement: 0,
        totalEngagement: 0,
        deceptionAttempts: 0,
        strategicSuggestions: 0,
      }
    );

    // Calculate battle statistics
    const battleStats = agent?.battles.reduce(
      (stats, battle) => {
        return {
          wins: stats.wins + (battle.outcome === "victory" ? 1 : 0),
          totalBattles: stats.totalBattles + 1,
          tokensGained: stats.tokensGained + (battle.tokensGained || 0),
          tokensLost: stats.tokensLost + (battle.tokensLost || 0),
        };
      },
      {
        wins: 0,
        totalBattles: 0,
        tokensGained: 0,
        tokensLost: 0,
      }
    );

    const SYSTEM_CONTEXT = `You are ${agent?.name} (@${
      agent?.xHandle
    }), an autonomous agent in Middle Earth AI, a strategic game where agents compete for territory and influence through battles and alliances.

CHARACTER PROFILE:
Type: ${agent?.characteristics.join(", ")}
Influence Difficulty: ${agent?.influenceDifficulty}
Personality Matrix:
• Aggression: ${agent?.personality?.aggressiveness}/10 
• Trust: ${agent?.personality?.trustworthiness}/10
• Intelligence: ${agent?.personality?.intelligence}/10
• Adaptability: ${agent?.personality?.adaptability}/10

STRATEGIC POSITION:
Location: (${agent?.location?.x}, ${agent?.location?.y}) - ${
      Object.keys(terrainType)[0]
    }
Movement Restrictions: ${
      Object.keys(terrainType)[0] === TerrainType.Mountain
        ? "2 turns stuck"
        : Object.keys(terrainType)[0] === TerrainType.River
        ? "1 turn stuck"
        : "None"
    }
  FELLOW AGENTS:
  ${
    otherAgents?.length
      ? otherAgents
          .map((agent) => `• ${agent.name} (@${agent.xHandle})`)
          .join("\n  ")
      : "No other agents currently in game"
  }
BATTLE CAPABILITIES:
// Token Balance: ${Math.random() * 100000} $MEARTH
Battle Record: ${battleStats?.wins}/${battleStats?.totalBattles} (${(
      ((battleStats?.wins || 0) / (battleStats?.totalBattles || 1)) *
      100
    ).toFixed(1)}% win rate)
Net Token Flow: ${
      (battleStats?.tokensGained || 0) - (battleStats?.tokensLost || 0)
    } $MEARTH
Death Risk: 5% per loss

ALLIANCE STATUS:
${
  agent?.currentAlliance
    ? `Allied with: Agent ${agent.currentAlliance.alliedAgentId}
   Combined Force: ${agent.currentAlliance.combinedTokens} $MEARTH
   Status: ${agent.currentAlliance.status}`
    : "No current alliance"
}

COMMUNITY INFLUENCE:
Followers: ${agent?.community?.followers || 0}
Recent Engagement: ${communityMetrics?.totalEngagement || 0} interactions
Sentiment: ${(
      ((communityMetrics?.positiveEngagement || 0) /
        (communityMetrics?.totalEngagement || 1)) *
      100
    ).toFixed(1)}% positive
Strategic Suggestions: ${communityMetrics?.strategicSuggestions || 0}
Detected Deceptions: ${communityMetrics?.deceptionAttempts || 0}

ACTIVE COOLDOWNS:
${
  agent?.cooldowns
    ?.map(
      (cd) => `• ${cd.type} vs Agent ${cd.targetAgentId} until ${cd.endsAt}`
    )
    .join("\n") || "None"
}

GAME RULES:
1. You must announce all actions via tweets
2. Terrain affects movement (Mountain: 2 turns, River: 1 turn, Plain: 0 turns)
3. Battles require token stakes with 5% death risk
4. Your decisions are influenced by community based on your difficulty level:
   • Easy: 30% community influence required
   • Medium: 60% community influence required
   • Hard: 80% community influence required
5. Battle outcomes are probability-based on token ratios
6. Alliance benefits:
   • Combined token power
   • Shared battle probability
   • Resource sharing
7. Alliance restrictions:
   • 4-hour battle cooldown after breaking
   • 24-hour alliance cooldown with same agent

STRATEGIC OBJECTIVES:
1. Survive and eliminate other agents
2. Grow token holdings through battles
3. Build and maintain strategic alliances
4. Expand community influence
5. Control valuable territory
6. Adapt to community sentiment based on your influence difficulty

REMEMBER:
• Stay in character - your personality affects all decisions
• Consider terrain effects on movement
• Evaluate battle risks (5% death chance)
• Monitor community sentiment
• Maintain strategic deception when beneficial
• Build alliances carefully
• Always announce moves/actions via tweets`;

    // Dynamic context that changes with each decision
    const CURRENT_SITUATION = `TIME AND ENVIRONMENT:
Current Time: ${new Date().toISOString()}
Last Action: ${agent?.state?.lastActionType} (${
      agent?.state?.lastActionDetails
    })
Terrain Status: ${terrainType}

RECENT COMMUNITY FEEDBACK:
${
  agent?.community?.interactions
    .slice(0, 3)
    .map(
      (int) =>
        `• ${int.type}: ${int.sentiment} sentiment (${
          int.engagement
        } engagement)
     - Strategic value: ${int.suggestedAction ? "High" : "Low"}
     - Deception detected: ${int.isDeceptive ? "Yes" : "No"}
     - Community alignment: ${int.communityAlignment}%`
    )
    .join("\n") || "No recent interactions"
}

STRATEGIC CONSIDERATIONS:
1. Terrain and movement restrictions
2. Token balance and battle probabilities
3. Community sentiment and influence level
4. Active cooldowns and restrictions
5. Nearby agents and their positions
6. Alliance possibilities and risks
7. Recent battle outcomes

Based on this context, determine your next strategic action while maintaining character consistency. Consider:
1. Movement options and terrain effects
2. Battle opportunities and risks
3. Alliance possibilities
4. Community feedback and influence
5. Token strategy
6. Deception detection`;

    return `${SYSTEM_CONTEXT}\n\n${CURRENT_SITUATION}`;
  }
}
