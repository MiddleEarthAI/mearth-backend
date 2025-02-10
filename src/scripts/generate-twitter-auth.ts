import { TwitterAuthHelper } from "../utils/twitter-auth";

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const AGENTS = [
  { name: "Scootles", username: "ScootlesAI" },
  { name: "Purrlock Paws", username: "PurrlockPawsAI" },
  { name: "Sir Gullihop", username: "SirGullihopAI" },
  { name: "Wanderleaf", username: "WanderleafAI" },
];

async function generateAuthUrls() {
  try {
    const authHelper = new TwitterAuthHelper();

    // Generate auth URLs for each agent
    for (const agent of AGENTS) {
      const { url, oauth_token, oauth_secret } =
        await authHelper.generateAuthUrl(agent.name);

      console.log(`\n=== Auth URL for ${agent.name} (${agent.username}) ===`);
      console.log(`URL: ${url}`);
      console.log(`OAuth Token: ${oauth_token}`);
      console.log(`OAuth Secret: ${oauth_secret}`);
      console.log(
        "\nStore these values safely - you'll need them to generate access tokens!"
      );
    }
  } catch (error) {
    console.error("Failed to generate auth URLs:", error);
  }
}

// Example of how to get access tokens once you have the verifier
async function getAccessTokens(
  agentName: string,
  oauthToken: string,
  oauthSecret: string,
  oauthVerifier: string
) {
  try {
    const authHelper = new TwitterAuthHelper();
    const { accessToken, accessSecret } = await authHelper.getAccessToken(
      oauthToken,
      oauthSecret,
      oauthVerifier
    );

    console.log(`\n=== Access Tokens for ${agentName} ===`);
    console.log(`Access Token: ${accessToken}`);
    console.log(`Access Secret: ${accessSecret}`);
    console.log("\nAdd these to your .env file for the agent!");
  } catch (error) {
    console.error("Failed to get access tokens:", error);
  }
}
//
// npx ts-node src/scripts/generate-twitter-auth.ts

// Comment out the URL generation since we already have the verifier
// generateAuthUrls();

// // Get access tokens for Scootles
// getAccessTokens(
//   "Scootles",
//   "cwLGEwAAAAABvcbjAAABlOrvZ0M", // oauth_token from the URL
//   "DLPXTJc4xDz3e5PIhzHfxCPQMN3PF0U9", // oauth_secret from earlier
//   "l3SHkwvetu2G3b9TzPLmyvU1ffc66CQ5" // oauth_verifier from the URL
// );
