import { expect } from "chai";
import { describe, it, before, after, beforeEach } from "mocha";
import TwitterManager from "@/agent/TwitterManager";

describe("TwitterManager", function () {
  let twitterManager: TwitterManager;

  // Increase timeout for real API calls
  this.timeout(30000);

  before("setup", async function () {
    twitterManager = new TwitterManager();
    console.log("📱 Twitter Manager Test Suite Initialized");
  });

  after("cleanup", async function () {
    await twitterManager.disconnect();
    console.log("🧹 Twitter Manager Test Suite Cleaned Up");
  });

  describe("Client Management", function () {
    it("should initialize with all required clients", function () {
      // @ts-ignore - Access private property for testing
      const clients = twitterManager._clients;
      expect(clients.has("1")).to.be.true;
      expect(clients.has("2")).to.be.true;
      expect(clients.has("3")).to.be.true;
      expect(clients.has("4")).to.be.true;
    });

    it("should successfully reconnect all clients", async function () {
      try {
        await twitterManager.reconnect();
        // @ts-ignore - Access private property for testing
        const clients = twitterManager._clients;
        expect(clients.size).to.equal(4);
        // @ts-ignore - Access private property for testing
        expect(twitterManager.client).to.not.be.undefined;
      } catch (error) {
        console.error("Reconnection test failed:", error);
        throw error;
      }
    });
  });

  describe("Tweet Interactions", function () {
    let testTweetId: string = "1891889506489598298";
    // const TEST_TWEET_CONTENT =
    //   "Test tweet from Mearth AI Agent Test Suite 🤖 " + Date.now();

    // beforeEach(async function () {
    //   // Post a test tweet to use for interaction tests
    //   const tweet = await twitterManager.postTweet("1", TEST_TWEET_CONTENT);
    //   testTweetId = tweet.data.id;
    //   // Wait a bit for Twitter to process the tweet
    //   await new Promise((resolve) => setTimeout(resolve, 5000));
    // });

    // it("should successfully post a tweet", async function () {
    //   const tweet = await twitterManager.postTweet(
    //     "1",
    //     "Hello from test suite! 🧪 " + Date.now()
    //   );
    //   expect(tweet).to.have.property("id");
    //   expect(tweet.data.text).to.include("Hello from test suite!");
    // });

    it("should fetch tweet interactions", async function () {
      const interactions = await twitterManager.fetchTweetInteractions(
        testTweetId
      );
      expect(interactions).to.be.an("array");
      // Even if empty, should return an array
      expect(Array.isArray(interactions)).to.be.true;

      // Validate interaction structure if any exist
      if (interactions.length > 0) {
        interactions.forEach((interaction) => {
          expect(interaction).to.have.property("type");
          expect(interaction).to.have.property("userId");
          expect(interaction).to.have.property("content");
          expect(interaction).to.have.property("timestamp");
        });
      }
    });

    it("should handle rate limiting gracefully", async function () {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array(5)
        .fill(null)
        .map(() => twitterManager.fetchTweetInteractions(testTweetId));

      const results = await Promise.all(promises);
      results.forEach((interactions) => {
        expect(interactions).to.be.an("array");
      });
    });
  });

  describe("User Information", function () {
    it("should fetch user information", async function () {
      // @ts-ignore - Access private method for testing
      const userInfo = await twitterManager.fetchUserInfo(
        // @ts-ignore - Access private property for testing
        twitterManager.client,
        "1234567890" // Replace with a known user ID
      );
      expect(userInfo).to.have.property("id");
      expect(userInfo).to.have.property("username");
      expect(userInfo).to.have.property("public_metrics");
    });
  });

  describe("Error Handling", function () {
    it("should handle invalid tweet IDs gracefully", async function () {
      try {
        await twitterManager.fetchTweetInteractions("invalid_id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it("should handle network errors during reconnection", async function () {
      // @ts-ignore - Access private property for testing
      twitterManager._clients.clear(); // Force a reconnection scenario
      await twitterManager.reconnect();
      // @ts-ignore - Access private property for testing
      expect(twitterManager._clients.size).to.equal(4);
    });
  });

  describe("Rate Limiting", function () {
    it("should respect rate limits", async function () {
      const startTime = Date.now();

      // Make multiple requests in quick succession
      for (let i = 0; i < 10; i++) {
        await twitterManager.postTweet(
          "1",
          `Rate limit test ${i} ${Date.now()}`
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take some time due to rate limiting
      expect(duration).to.be.above(5000);
    });

    it("should implement exponential backoff", async function () {
      // @ts-ignore - Access private method for testing
      const backoff1 = twitterManager.calculateBackoff();
      // @ts-ignore - Access private property for testing
      twitterManager.requestCount += 100;
      // @ts-ignore - Access private method for testing
      const backoff2 = twitterManager.calculateBackoff();

      expect(backoff2).to.be.above(backoff1);
    });
  });
});
