import { TwitterApi } from "twitter-api-v2";

export type AgentId = "1" | "2" | "3" | "4";

/**
 * Twitter API Manager class that handles API interactions with rate limiting
 * Manages multiple Twitter API clients and provides methods for tweet interactions
 */
class TwitterManager {
  private readonly _clients: Map<AgentId, TwitterApi>;
  private readonly RATE_LIMIT_WINDOW = 900000; // 15 minutes
  private requestCount: number = 0;
  private client: TwitterApi;

  constructor(_clients: Map<AgentId, TwitterApi>) {
    console.log("🚀 Initializing Twitter Manager...");
    this._clients = _clients;
    if (
      !_clients.has("1") ||
      !_clients.has("2") ||
      !_clients.has("3") ||
      !_clients.has("4")
    ) {
      console.error("❌ Error: Missing required client");
      throw new Error("Client for agent Id not found");
    }
    this.client = this._clients.get("1")!;
    console.log("✅ Twitter Manager initialized successfully");
  }

  async getTweetInteractions(tweetId: AgentId): Promise<any[]> {
    console.log(`🔍 Fetching interactions for tweet ${tweetId}...`);

    if (this.shouldThrottle()) {
      const backoffTime = this.calculateBackoff();
      console.log(`⏳ Rate limit reached. Waiting for ${backoffTime}ms...`);
      await this.wait(backoffTime);
    }

    const client = this._clients.get("1");

    if (!client) {
      console.error("❌ Error: Client not found");
      throw new Error(`Client for agent Id ${1} not found`);
    }

    try {
      console.log("📊 Fetching replies, quotes, and likes...");
      const [replies, quotes, likes] = await Promise.all([
        client.v2.search(`in_reply_to_tweet_id:${tweetId}`),
        client.v2.quotes(tweetId),
        client.v2.tweetLikedBy(tweetId),
      ]);

      this.requestCount += 3;
      console.log("✅ Successfully fetched all interactions");

      return this.formatInteractions(replies, quotes, likes);
    } catch (error) {
      console.error("❌ Failed to fetch tweet interactions", {
        tweetId,
        error,
      });
      throw error;
    }
  }

  private formatInteractions(replies: any, quotes: any, likes: any): any[] {
    console.log("🔄 Formatting interactions data...");
    return [...replies, ...quotes, ...likes];
  }

  postTweet(content: string) {
    console.log("📝 Posting new tweet...");
    return this.client.v2
      .tweet(content, {})
      .then(() => {
        console.log("✅ Tweet posted successfully");
      })
      .catch((error) => {
        console.error("❌ Failed to post tweet", error);
        throw error;
      });
  }

  private shouldThrottle(): boolean {
    const shouldThrottle = this.requestCount >= 450;
    if (shouldThrottle) {
      console.log("⚠️ Rate limit threshold reached");
    }
    return shouldThrottle;
  }

  private calculateBackoff(): number {
    const backoff = Math.min(
      Math.pow(2, this.requestCount - 450) * 1000,
      this.RATE_LIMIT_WINDOW
    );
    console.log(`⏱️ Calculated backoff time: ${backoff}ms`);
    return backoff;
  }

  private async wait(ms: number): Promise<void> {
    console.log(`⏳ Waiting for ${ms}ms...`);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default TwitterManager;
