import { Scraper } from "agent-twitter-client";
import { Agent, AgentType } from "../types/game";
import { logger } from "../utils/logger";
import { retryWithExponentialBackoff } from "../utils/retry";

import { ITwitterService } from "../types/services";
import { TwitterConfig } from "@/config";
import { PrismaClient } from "@prisma/client";

export class TwitterService implements ITwitterService {
  private clients: Map<string, Scraper> = new Map();
  private prisma: PrismaClient;

  constructor(private readonly config: TwitterConfig, prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeClients();
    logger.info("Twitter service initialized");
  }

  private async initializeClients(): Promise<void> {
    const agents = [
      {
        type: AgentType.SCOOTLES,
        username: this.config.SCOOTLES_TWITTER_USERNAME,
        password: this.config.SCOOTLES_TWITTER_PASSWORD,
        email: this.config.SCOOTLES_TWITTER_EMAIL,
      },
      {
        type: AgentType.PURRLOCK_PAWS,
        username: this.config.PURRLOCKPAWS_TWITTER_USERNAME,
        password: this.config.PURRLOCKPAWS_TWITTER_PASSWORD,
        email: this.config.PURRLOCKPAWS_TWITTER_EMAIL,
      },
      {
        type: AgentType.SIR_GULLIHOP,
        username: this.config.SIR_GULLIHOP_TWITTER_USERNAME,
        password: this.config.SIR_GULLIHOP_TWITTER_PASSWORD,
        email: this.config.SIR_GULLIHOP_TWITTER_EMAIL,
      },
      {
        type: AgentType.WANDERLEAF,
        username: this.config.WANDERLEAF_TWITTER_USERNAME,
        password: this.config.WANDERLEAF_TWITTER_PASSWORD,
        email: this.config.WANDERLEAF_TWITTER_EMAIL,
      },
    ];

    await Promise.all(
      agents.map(async (agent) => {
        if (agent.username && agent.password && agent.email) {
          await retryWithExponentialBackoff(async () => {
            const scraper = new Scraper();
            await scraper.login(agent.username, agent.password, agent.email);
            this.clients.set(agent.type, scraper);
          });
        }
      })
    );
  }

  /**
   * Initialize Twitter client for an agent
   */
  async initializeAgent(
    username: string,
    password: string,
    email: string
  ): Promise<void> {
    await retryWithExponentialBackoff(async () => {
      const scraper = new Scraper();
      await scraper.login(username, password, email);
    });
  }

  /**
   * Post a tweet from an agent's account
   */
  async postTweet(agent: Agent, content: string): Promise<void> {
    try {
      const client = this.clients.get(agent.type);
      if (!client) return;

      await client.sendTweet(content);
      logger.info(`Posted tweet for ${agent.name}: ${content}`);
    } catch (error) {
      logger.error(`Failed to post tweet for ${agent.name}:`, error);
      throw error;
    }
  }

  /**
   * Announce agent movement
   */
  async announceMovement(agentId: string, x: number, y: number): Promise<void> {
    try {
      // TODO: Implement movement announcement
      const agent = await this.prisma.agent.findUnique({
        where: {
          id: agentId,
        },
      });

      if (!agent) return;

      const client = this.clients.get(agent.twitterHandle);
      if (!client) return;

      const tweet = `I'm moving to (${x}, ${y}) in Middle Earth! #MiddleEarthAI`;
      await retryWithExponentialBackoff(async () => {
        await client.sendTweet(tweet);
      });

      logger.info(`Announced movement for agent ${agentId} to (${x}, ${y})`);
    } catch (error) {
      logger.error(`Failed to announce movement for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Announce battle intention
   */
  async announceBattleIntention(
    initiator: Agent,
    defenderHandle: string
  ): Promise<void> {
    const client = this.clients.get(initiator.type);
    if (!client) return;

    const tweet = `🗡️ I challenge you to a battle, @${defenderHandle}! Prepare yourself for an epic clash in Middle Earth! #MiddleEarthBattle`;
    await retryWithExponentialBackoff(async () => {
      await client.sendTweet(tweet);
    });
  }

  /**
   * Announce battle outcome
   */
  public async announceBattleOutcome(
    initiator: Agent,
    defender: Agent,
    tokensBurned: number
  ): Promise<void> {
    try {
      const message = `⚔️ Battle Report!\n\n${initiator.name} vs ${
        defender.name
      }\n${tokensBurned.toLocaleString()} tokens burned!\n\n#MiddleEarthAI #Battle`;
      await retryWithExponentialBackoff(async () => {
        await this.postTweet(initiator, message);
      });
      logger.info(
        `Battle outcome announced between ${initiator.name} and ${defender.name}`
      );
    } catch (error) {
      logger.error("Error announcing battle outcome:", error);
    }
  }

  /**
   * Announce alliance formation
   */
  async announceAlliance(agent1Id: string, agent2Id: string): Promise<void> {
    try {
      // TODO: Implement alliance announcement
      logger.info(`Announced alliance between ${agent1Id} and ${agent2Id}`);
    } catch (error) {
      logger.error("Failed to announce alliance:", error);
      throw error;
    }
  }

  /**
   * Monitor mentions and interactions
   */
  async monitorInteractions(agent: Agent): Promise<void> {
    const client = this.clients.get(agent.type);
    if (!client) return;

    await retryWithExponentialBackoff(async () => {
      const mentions = await client.getTweetsAndReplies(agent.twitterHandle);
      // Process mentions and adjust agent behavior based on community feedback
      // Implementation depends on specific game mechanics
    });
  }

  /**
   * Get community feedback for an agent
   */
  async getAgentFeedback(agent: Agent): Promise<any> {
    try {
      // TODO: Implement Twitter API call to get mentions and replies
      logger.info(`Retrieved feedback for ${agent.name}`);
      return {
        mentions: [],
        replies: [],
      };
    } catch (error) {
      logger.error(`Failed to get feedback for ${agent.name}:`, error);
      throw error;
    }
  }

  /**
   * Calculate influence score from tweet engagement
   */
  async calculateTweetInfluence(tweetId: string): Promise<number> {
    try {
      // Get first client available since tweet lookup doesn't need specific auth
      const client = this.clients.values().next().value;
      if (!client) throw new Error("No clients available");

      return await retryWithExponentialBackoff(async () => {
        const tweet = await client.getTweet(tweetId);
        if (!tweet) return 0;

        const influence =
          ((tweet.likes || 0) +
            (tweet.retweets || 0) * 2 +
            (tweet.replies || 0) * 3) /
          100;
        return Math.min(influence, 100);
      });
    } catch (error) {
      logger.error("Error calculating tweet influence:", error);
      return 0;
    }
  }

  async fetchCommunityFeedback(): Promise<any> {
    try {
      // TODO: Implement community feedback fetching
      logger.info("Fetched community feedback");
      return {
        sentiment: "neutral",
        suggestions: [],
      };
    } catch (error) {
      logger.error("Failed to fetch community feedback:", error);
      throw error;
    }
  }

  async announceBattle(
    initiatorId: string,
    defenderId: string,
    outcome: string
  ): Promise<void> {
    try {
      // TODO: Implement battle announcement
      logger.info(
        `Announced battle between ${initiatorId} and ${defenderId} with outcome: ${outcome}`
      );
    } catch (error) {
      logger.error("Failed to announce battle:", error);
      throw error;
    }
  }
}
