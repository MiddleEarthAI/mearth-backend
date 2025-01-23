import { Scraper } from "agent-twitter-client";
import { logger } from "@/utils/logger";
import { ITwitter } from "@/types";

interface TwitterConfig {
  username: string;
  password: string;
  email: string;
}

export class Twitter implements ITwitter {
  private client: Scraper;
  private config: TwitterConfig;

  constructor(config: TwitterConfig) {
    this.config = config;
    const scraper = new Scraper();

    scraper.login(
      this.config.username,
      this.config.password,
      this.config.email
    );
    this.client = scraper;

    logger.info("Twitter service initialized");
  }

  /**
   * Post a tweet from an agent's account
   */
  async postTweet(content: string): Promise<void> {
    try {
      await this.client.sendTweet(content);
      logger.info(`Posted tweet: ${content}`);
    } catch (error) {
      logger.error(`Failed to post tweet:`, error);
      throw error;
    }
  }
}
