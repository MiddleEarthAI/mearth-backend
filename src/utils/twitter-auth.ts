import { TwitterApi } from "twitter-api-v2";

/**
 * Utility to generate Twitter OAuth URLs and handle token generation
 */
export class TwitterAuthHelper {
  private client: TwitterApi;

  constructor() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("Twitter API credentials not configured");
    }

    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
    });
  }

  /**
   * Generate authorization URL for an agent
   */
  async generateAuthUrl(
    agentName: string
  ): Promise<{ url: string; oauth_token: string; oauth_secret: string }> {
    try {
      const authLink = await this.client.generateAuthLink(
        "https://middleEarth.world",
        {
          linkMode: "authorize",
        }
      );

      console.info(`Generated auth URL for ${agentName}`, {
        oauth_token: authLink.oauth_token,
        url: authLink.url,
      });

      return {
        url: authLink.url,
        oauth_token: authLink.oauth_token,
        oauth_secret: authLink.oauth_token_secret,
      };
    } catch (error) {
      console.error(`Failed to generate auth URL for ${agentName}:`, error);
      throw error;
    }
  }

  /**
   * Get access tokens using OAuth verifier
   */
  async getAccessToken(
    oauthToken: string,
    oauthSecret: string,
    oauthVerifier: string
  ): Promise<{ accessToken: string; accessSecret: string }> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: oauthToken,
        accessSecret: oauthSecret,
      });

      const { accessToken, accessSecret } = await client.login(oauthVerifier);

      console.info("Successfully generated access tokens", {
        accessToken: `${accessToken.substring(0, 10)}...`,
      });

      return { accessToken, accessSecret };
    } catch (error) {
      console.error("Failed to get access token:", error);
      throw error;
    }
  }
}
