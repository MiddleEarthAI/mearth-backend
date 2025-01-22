import { Scraper } from "agent-twitter-client";
import { Agent } from "../types/game";
import { AgentTwitterClient } from "agent-twitter-client";

export class TwitterService {
  private scraper: Scraper;
  private clients: Map<string, AgentTwitterClient> = new Map();

  constructor() {
    this.scraper = new Scraper();
    // Initialize Twitter clients for each agent
    this.initializeClients();
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

    for (const agent of agents) {
      if (agent.username && agent.password && agent.email) {
        this.clients.set(
          agent.type,
          new AgentTwitterClient({
            username: agent.username,
            password: agent.password,
            email: agent.email,
            proxyUrl: process.env.PROXY_URL,
          })
        );
      }
    }
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
   * Post a tweet from an agent's account
   */
  async postTweet(agent: Agent, content: string): Promise<void> {
    const client = this.clients.get(agent.type);
    if (!client) {
      throw new Error(`No Twitter client found for agent type: ${agent.type}`);
    }

    await client.tweet(content);
  }

  /**
   * Announce agent movement
   */
  async announceMovement(agent: Agent, reason: string): Promise<void> {
    const client = this.clients.get(agent.type);
    if (!client) return;

    const tweet = `🚶 Moving ${reason}... What adventures await? #MiddleEarthJourney`;
    await client.tweet(tweet);
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
    await client.tweet(tweet);
  }

  /**
   * Announce battle outcome
   */
  async announceBattleOutcome(
    winner: Agent,
    loser: Agent,
    tokensBurned: number
  ): Promise<void> {
    const client = this.clients.get(winner.type);
    if (!client) return;

    const tweet = `⚔️ Victory! I have defeated @${loser.twitterHandle} in battle, burning ${tokensBurned} tokens in the process! #MiddleEarthBattle`;
    await client.tweet(tweet);
  }

  /**
   * Announce alliance formation
   */
  async announceAlliance(agent: Agent, allyHandle: string): Promise<void> {
    const client = this.clients.get(agent.type);
    if (!client) return;

    const tweet = `🤝 A new alliance has been formed! @${allyHandle} and I shall work together to protect our interests in Middle Earth! #MiddleEarthAlliance`;
    await client.tweet(tweet);
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
   * Get community feedback for an agent
   */
  async getAgentFeedback(agent: Agent): Promise<{
    sentiment: number;
    suggestions: string[];
    engagement: number;
  }> {
    const client = this.clients.get(agent.type);
    if (!client) {
      return {
        sentiment: 0,
        suggestions: [],
        engagement: 0,
      };
    }

    // Get recent mentions and analyze them
    const mentions = await client.getRecentMentions();
    const sentiment = await this.analyzeSentiment(mentions);
    const suggestions = await this.extractSuggestions(mentions);
    const engagement = await this.calculateEngagement(mentions);

    return {
      sentiment,
      suggestions,
      engagement,
    };
  }

  /**
   * Analyze sentiment from mentions
   */
  private async analyzeSentiment(mentions: any[]): Promise<number> {
    // Simple sentiment analysis (0-100)
    // In a real implementation, this would use NLP
    return (
      mentions.reduce((sum, mention) => {
        // Basic sentiment analysis based on keywords
        const text = mention.text.toLowerCase();
        let score = 50; // Neutral base score

        // Positive keywords
        if (text.includes("great") || text.includes("good")) score += 10;
        if (text.includes("love") || text.includes("awesome")) score += 15;
        if (text.includes("support") || text.includes("ally")) score += 5;

        // Negative keywords
        if (text.includes("bad") || text.includes("weak")) score -= 10;
        if (text.includes("hate") || text.includes("terrible")) score -= 15;
        if (text.includes("enemy") || text.includes("attack")) score -= 5;

        return sum + score;
      }, 0) / (mentions.length || 1)
    );
  }

  /**
   * Extract action suggestions from mentions
   */
  private async extractSuggestions(mentions: any[]): Promise<string[]> {
    // Extract suggestions using keywords
    // In a real implementation, this would use NLP
    return mentions
      .map((mention) => {
        const text = mention.text.toLowerCase();
        if (text.includes("should")) {
          const suggestion = text.split("should")[1].trim();
          return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
        }
        return null;
      })
      .filter(Boolean) as string[];
  }

  /**
   * Calculate engagement level from mentions
   */
  private async calculateEngagement(mentions: any[]): Promise<number> {
    // Calculate engagement score (0-100)
    return Math.min(
      100,
      mentions.reduce((score, mention) => {
        return score + mention.likes * 2 + mention.retweets * 3;
      }, 0)
    );
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
