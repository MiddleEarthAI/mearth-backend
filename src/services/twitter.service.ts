import { Scraper } from "agent-twitter-client";
import { Agent, CommunityFeedback } from "../types/game";
import { logger } from "../utils/logger";
import { retryWithExponentialBackoff } from "../utils/retry";
import { TwitterConfig } from "../config";
import { ITwitterService } from "../types/services";

export class TwitterService implements ITwitterService {
  private clients: Map<string, Scraper> = new Map();

  constructor(private readonly config: TwitterConfig) {
    this.initializeClients();
    logger.info("Twitter service initialized");
  }

  private async initializeClients(): Promise<void> {
    const agents = [
      {
        type: "SCOOTLES",
        username: process.env.SCOOTLES_TWITTER_USERNAME,
        password: process.env.SCOOTLES_TWITTER_PASSWORD,
        email: process.env.SCOOTLES_TWITTER_EMAIL,
      },
      {
        type: "PURRLOCK_PAWS",
        username: process.env.PURRLOCK_TWITTER_USERNAME,
        password: process.env.PURRLOCK_TWITTER_PASSWORD,
        email: process.env.PURRLOCK_TWITTER_EMAIL,
      },
      {
        type: "SIR_GULLIHOP",
        username: process.env.GULLIHOP_TWITTER_USERNAME,
        password: process.env.GULLIHOP_TWITTER_PASSWORD,
        email: process.env.GULLIHOP_TWITTER_EMAIL,
      },
      {
        type: "WANDERLEAF",
        username: process.env.WANDERLEAF_TWITTER_USERNAME,
        password: process.env.WANDERLEAF_TWITTER_PASSWORD,
        email: process.env.WANDERLEAF_TWITTER_EMAIL,
      },
    ];

    await Promise.all(
      agents.map(async (agent) => {
        if (agent.username && agent.password && agent.email) {
          await retryWithExponentialBackoff(async () => {
            const scraper = new Scraper();
            await scraper.login(agent.username!, agent.password!, agent.email!);
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
    const client = this.clients.get(agent.type);
    if (!client) {
      throw new Error(`No Twitter client found for agent type: ${agent.type}`);
    }

    await retryWithExponentialBackoff(async () => {
      await client.sendTweet(content);
    });
  }

  /**
   * Announce agent movement
   */
  public async announceMovement(
    agent: Agent,
    x: number,
    y: number
  ): Promise<void> {
    try {
      const tweet = `🚶 ${agent.name} is moving to position (${x}, ${y})`;
      logger.info(`Announcing movement for ${agent.name}:`, tweet);
    } catch (error) {
      logger.error(`Failed to announce movement for ${agent.name}:`, error);
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
      const message = `⚔️ Battle Report!\n\n${initiator.name} vs ${defender.name}\n${tokensBurned.toLocaleString()} tokens burned!\n\n#MiddleEarthAI #Battle`;
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
  public async announceAlliance(agent1: Agent, agent2: Agent): Promise<void> {
    try {
      const tweet = `🤝 ${agent1.name} and ${agent2.name} have formed an alliance!`;
      logger.info(
        `Announcing alliance between ${agent1.name} and ${agent2.name}:`,
        tweet
      );
    } catch (error) {
      logger.error(
        `Failed to announce alliance between ${agent1.name} and ${agent2.name}:`,
        error
      );
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
  public async getAgentFeedback(agent: Agent): Promise<CommunityFeedback> {
    try {
      const client = this.clients.get(agent.type);
      if (!client) throw new Error("No client found");

      return await retryWithExponentialBackoff(async () => {
        // Get latest tweets
        const tweets = await client.getTweets(agent.twitterHandle, 10);

        // Convert AsyncGenerator to array and calculate engagement metrics
        const tweetsArray = [];
        for await (const tweet of tweets) {
          tweetsArray.push(tweet);
        }

        const engagement = tweetsArray.reduce((acc: number, tweet: any) => {
          return (
            acc +
            (tweet.likes || 0) +
            (tweet.retweets || 0) * 2 +
            (tweet.replies || 0) * 3
          );
        }, 0);

        return {
          sentiment: Math.min(engagement / 100, 100), // Scale engagement to 0-100
          interactions: engagement,
          lastUpdated: new Date(),
        };
      });
    } catch (error) {
      logger.error(`Error getting feedback for ${agent.name}:`, error);
      return {
        sentiment: 50,
        interactions: 0,
        lastUpdated: new Date(),
      };
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

  public async fetchCommunityFeedback(): Promise<any> {
    try {
      // Placeholder for fetching community feedback
      logger.info("Fetching community feedback");
      return {};
    } catch (error) {
      logger.error("Failed to fetch community feedback:", error);
      throw error;
    }
  }
}
