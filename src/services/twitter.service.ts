import { Scraper } from "agent-twitter-client";
import { Agent } from "../types/game";

export class TwitterService {
  private scraper: Scraper;

  constructor() {
    this.scraper = new Scraper();
  }

  /**
   * Initialize Twitter client for an agent
   */
  async initializeAgent(
    username: string,
    password: string,
    email: string
  ): Promise<void> {
    await this.scraper.login(username, password, email);
  }

  /**
   * Announce agent movement
   */
  async announceMovement(agent: Agent, reason: string): Promise<void> {
    const tweet = `I'm heading ${this.getDirection(agent.position)} ${reason}`;
    await this.scraper.sendTweet(tweet);
  }

  /**
   * Announce battle intention
   */
  async announceBattleIntention(
    agent: Agent,
    targetHandle: string
  ): Promise<void> {
    const tweet = `Preparing to battle @${targetHandle}! Send me troops if you want to be a winner. 🗡️`;
    await this.scraper.sendTweet(tweet);
  }

  /**
   * Announce battle outcome
   */
  async announceBattleOutcome(
    winner: Agent,
    loser: Agent,
    tokensBurned: number
  ): Promise<void> {
    const tweet = `Victory against @${loser.twitterHandle}! ${tokensBurned} tokens burned. 🔥`;
    await this.scraper.sendTweet(tweet);
  }

  /**
   * Announce alliance formation
   */
  async announceAlliance(agent: Agent, allyHandle: string): Promise<void> {
    const tweet = `Forming an alliance with @${allyHandle}. Together we are stronger! 🤝`;
    await this.scraper.sendTweet(tweet);
  }

  /**
   * Monitor mentions and interactions
   */
  async monitorInteractions(agent: Agent): Promise<void> {
    const mentions = await this.scraper.getTweetsAndReplies(
      agent.twitterHandle
    );
    // Process mentions and adjust agent behavior based on community feedback
    // Implementation depends on specific game mechanics
  }

  /**
   * Get cardinal direction based on position change
   */
  private getDirection(position: { x: number; y: number }): string {
    // Simplified direction calculation
    if (Math.abs(position.x) > Math.abs(position.y)) {
      return position.x > 0 ? "East" : "West";
    }
    return position.y > 0 ? "North" : "South";
  }

  /**
   * Calculate influence score from tweet engagement
   */
  async calculateTweetInfluence(tweetId: string): Promise<number> {
    const tweet = await this.scraper.getTweet(tweetId);
    if (!tweet) return 0;

    // Simple influence calculation based on engagement
    const influence =
      ((tweet.likes || 0) * 1 +
        (tweet.retweets || 0) * 2 +
        (tweet.replies || 0) * 3) /
      100;

    return Math.min(influence, 100);
  }
}
