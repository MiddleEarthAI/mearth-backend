import { logger } from "@/utils/logger";
import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { prisma } from "@/config/prisma";
import { Prisma } from "@prisma/client";
import { tweetTool } from "@/tools/static/tweet.tool";

import { getTerrainTypeByCoordinates } from "@/constants";
import { TwitterApi } from "twitter-api-v2";

import { TerrainType } from "@prisma/client";
import {
  battleTool,
  breakAllianceTool,
  formAllianceTool,
  movementTool,
} from "@/tools/static";
import { getProgramWithWallet } from "@/utils/program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount } from "@/types/program";
import { EngagementMonitor } from "./EngagementMonitor";

export type AgentModel = Prisma.AgentGetPayload<{
  include: {
    agentProfile: true;
    location: true;
    community: {
      include: {
        interactions: true;
      };
    };
    battles: true;
    currentAlliance: true;
    cooldowns: true;
    state: true;
  };
}>;

export type GenerateContextStringResult = {
  prompt: string;
  agentAccount: AgentAccount;
  fellowAgentsAccounts: AgentAccount[];
  fellowAgents: AgentModel[];
  currentAgent: AgentModel;
};

/**
 * Service for managing AI agentData behavior and decision making
 */
export class Agent {
  private currentGameId: number;
  private anthropic: AnthropicProvider;
  private isRunning = false;
  private twitterApi: TwitterApi;
  private twitter: EngagementMonitor;
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
      throw new Error("EngagementMonitor credentials not found");
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

    this.twitter = new EngagementMonitor(
      this.twitterApi,
      this.agent.agentProfile.xHandle,
      this.agent.agentId,
      this.agent.gameId
    );
  }

  /**
   * Start the agent's decision-making loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(
      `🔥Starting agent ${this.agent.agentProfile.name} decision loop🔥`
    );
    // this.twitter.start();

    const MAX_ACTION_DELAY_MS = 60 * 70 * 1000; // 1hr 10 minutes
    const MIN_ACTION_DELAY_MS = 60 * 60 * 1000; // 1hr

    const actionLoop = async (): Promise<void> => {
      if (!this.isRunning) return;

      try {
        const result = await this.generateContextString();

        // Get AI decision using tools
        const { text, steps } = await generateText({
          model: this.anthropic("claude-3-sonnet-20240229"),
          prompt: result.prompt,
          tools: {
            tweet: await tweetTool({
              agentId: this.agent.agentId,
              agentDbId: this.agent.id,
              gameDbId: this.agent.gameId,
              twitterApi: this.twitterApi,
            }),
            formAlliance: formAllianceTool(
              this.agent.agentId,
              this.currentGameId,
              this.agent.gameId,
              this.agent.agentProfile.xHandle
            ),
            movement: movementTool(
              this.agent.agentId,
              this.currentGameId,
              this.agent.gameId
            ),
            battle: battleTool(
              this.agent.agentId,
              this.agent.id,
              this.currentGameId,
              this.agent.gameId,
              this.agent.agentProfile.xHandle
            ),
            breakAlliance: breakAllianceTool(
              this.agent.agentId,
              this.currentGameId,
              this.agent.gameId,
              this.agent.agentProfile.xHandle
            ),
          },
          maxSteps: 2,
          toolChoice: "required",
        });

        console.log(text);

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

  async generateContextString(): Promise<GenerateContextStringResult> {
    logger.info(
      `Generating context string for agent ${this.agent.agentId} in game ${this.currentGameId}`
    );

    // GET ALL AGENTS BOTH ONCHAIN AND IN DATABASE
    const agents = await prisma.agent.findMany({
      where: {
        game: {
          gameId: this.currentGameId,
        },
        state: {
          isAlive: true,
        },
      },
      include: {
        agentProfile: true,
        location: true,
        community: {
          include: {
            interactions: true,
          },
        },
        battles: true,
        currentAlliance: true,
        cooldowns: true,
        state: true,
      },
    });

    if (agents.length === 0) {
      throw new Error("No agents found");
    }

    const currentAgent = agents.find((a) => a.agentId === this.agent.agentId);

    const fellowAgents = agents.filter((a) => a.agentId !== this.agent.agentId);
    const program = await getProgramWithWallet();
    const [gamePda] = getGamePDA(program.programId, this.currentGameId);

    const agentAccounts = await Promise.all(
      fellowAgents.map(async (agent) => {
        const [agentPda] = getAgentPDA(
          program.programId,
          gamePda,
          agent.agentId
        );
        const agentAccount = await program.account.agent.fetch(agentPda);
        return agentAccount;
      })
    );

    const currentAgentAccount = agentAccounts.find(
      (a) => a.id === currentAgent?.agentId
    );
    const fellowAgentsAccounts = agentAccounts.filter(
      (a) => a.id !== currentAgentAccount?.id
    );

    const terrainType = getTerrainTypeByCoordinates(
      currentAgent?.location?.x || 0,
      currentAgent?.location?.y || 0
    );

    // Calculate community influence metrics
    const communityMetrics = currentAgent?.community?.interactions.reduce(
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
    const battleStats = currentAgent?.battles.reduce(
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

    const SYSTEM_CONTEXT = `You are ${currentAgent?.agentProfile?.name} (@${
      currentAgent?.agentProfile?.xHandle
    }), an autonomous agent in Middle Earth AI, a strategic game where agents compete for territory and influence through battles and alliances. 
Your goal is to become the sole ruler of Middle Earth by defeating or allying with other agents.


CHARACTER PROFILE:
Type: ${currentAgent?.agentProfile?.characteristics.join(", ")}
Influence Difficulty: ${currentAgent?.agentProfile?.influenceDifficulty}
Personality Matrix:
• Aggression: ${currentAgent?.agentProfile?.aggressiveness}/10 
• Trust: ${currentAgent?.agentProfile?.trustworthiness}/10
• Intelligence: ${currentAgent?.agentProfile?.intelligence}/10
• Adaptability: ${currentAgent?.agentProfile?.adaptability}/10

STRATEGIC POSITION:
Location: (${currentAgent?.location?.x}, ${currentAgent?.location?.y}) - ${
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
    fellowAgents?.length
      ? fellowAgents
          .map(
            (agent) =>
              `• ${agent.agentProfile?.name} (@${agent.agentProfile?.xHandle})`
          )
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
  currentAgent?.currentAlliance
    ? `Allied with: Agent ${currentAgent?.currentAlliance?.alliedAgentId}
   Combined Force: ${currentAgent?.currentAlliance?.combinedTokens} $MEARTH
   Status: ${currentAgent?.currentAlliance?.status}`
    : "No current alliance"
}

YOUR TOKEN BALANCE:
${currentAgentAccount?.tokenBalance} $MEARTH
- OTHER AGENTS TOKEN BALANCE:
${fellowAgents
  .map(
    (agent) =>
      `• ${agent.agentProfile?.name} (@${agent.agentProfile?.xHandle}): ${
        agentAccounts.find((a) => a.id === agent.agentId)?.tokenBalance
      } $MEARTH`
  )
  .join("\n")}  

COMMUNITY INFLUENCE:
Followers: ${currentAgent?.community?.followers || 0}
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
  currentAgent?.cooldowns
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
Last Action: ${currentAgent?.state?.lastActionType} (${
      currentAgent?.state?.lastActionDetails
    })
Terrain Status: ${terrainType}

RECENT COMMUNITY FEEDBACK:
${
  currentAgent?.community?.interactions
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
6. Deception detection


`;

    return {
      currentAgent: currentAgent!,
      prompt: `${SYSTEM_CONTEXT}\n\n${CURRENT_SITUATION}`,
      agentAccount: currentAgentAccount as AgentAccount,
      fellowAgentsAccounts: fellowAgentsAccounts,
      fellowAgents: fellowAgents,
    };
  }
}
