import { TwitterApi } from "twitter-api-v2";

// Twitter API manager
class TwitterManager {
  private client: TwitterApi;
  private readonly RATE_LIMIT_WINDOW = 900000; // 15 minutes
  private requestCount: number = 0;

  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });
  }

  async getTweetInteractions(tweetId: string): Promise<any[]> {
    if (this.shouldThrottle()) {
      await this.wait(this.calculateBackoff());
    }

    try {
      const [replies, quotes, likes] = await Promise.all([
        this.client.v2.search(`in_reply_to_tweet_id:${tweetId}`),
        this.client.v2.quotes(tweetId),
        this.client.v2.tweetLikedBy(tweetId),
      ]);

      this.requestCount += 3;

      return this.formatInteractions(replies, quotes, likes);
    } catch (error) {
      console.error("Failed to fetch tweet interactions", { tweetId, error });
      throw error;
    }
  }

  private formatInteractions(replies: any, quotes: any, likes: any): any[] {
    return [...replies, ...quotes, ...likes];
  }

  private shouldThrottle(): boolean {
    return this.requestCount >= 450; // Twitter's rate limit
  }

  private calculateBackoff(): number {
    return Math.min(
      Math.pow(2, this.requestCount - 450) * 1000,
      this.RATE_LIMIT_WINDOW
    );
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default TwitterManager;
