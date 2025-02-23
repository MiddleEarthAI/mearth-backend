import { expect } from "chai";
import { DecisionEngine } from "@/agent/DecisionEngine";
import { PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import { ActionContext } from "@/types";
import { ActionSuggestion, TwitterInteraction } from "@/types/twitter";
import { getProgram } from "@/utils/program";
import { describe, it, before, after, beforeEach } from "mocha";
import EventEmitter from "events";
import { GameManager } from "@/agent/GameManager";

describe.only("DecisionEngine", function () {
  let decisionEngine: DecisionEngine;
  let prisma: PrismaClient;
  let program: MearthProgram;
  let eventEmitter: EventEmitter;
  let gameManager: GameManager;

  before("setup", async function () {
    prisma = new PrismaClient();
    program = await getProgram();
    eventEmitter = new EventEmitter();
    decisionEngine = new DecisionEngine(prisma, eventEmitter, program);
    gameManager = new GameManager(program, prisma);
  });

  after("teardown", async function () {
    await prisma.$disconnect();
  });

  describe("decideNextAction", function () {
    let actionContext: ActionContext;
    let mockInteractions: TwitterInteraction[];

    beforeEach(async function () {
      // Create a new game and get the first agent for testing
      const gameInfo = await gameManager.createNewGame();
      const agent = gameInfo.agents[0].agent;

      actionContext = {
        agentId: agent.id,
        gameId: agent.gameId,
        agentOnchainId: agent.onchainId,
        gameOnchainId: gameInfo.dbGame.onchainId,
      };

      // Mock Twitter interactions
      mockInteractions = [
        {
          type: "mention",
          userId: "user1_id",
          username: "user1",
          tweetId: "tweet1",
          content: "Let's form an alliance!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 1000,
            followingCount: 500,
            tweetCount: 1000,
            likeCount: 500,
            listedCount: 100,
            verified: true,
            accountAge: 31536000, // 1 year in seconds
            reputationScore: 0.8,
          },
        },
        {
          type: "reply",
          userId: "user2_id",
          username: "user2",
          tweetId: "tweet2",
          content: "Attack the enemy!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 500,
            followingCount: 500,
            tweetCount: 500,
            likeCount: 200,
            listedCount: 50,
            verified: false,
            accountAge: 15768000, // 6 months in seconds
            reputationScore: 0.6,
          },
        },
      ];
    });

    it("should process interactions and emit a new action", function (done) {
      // Listen for newAction event
      eventEmitter.once("newAction", (data) => {
        try {
          expect(data).to.have.property("actionContext");
          expect(data).to.have.property("action");
          expect(data.actionContext).to.deep.equal(actionContext);
          expect(data.action).to.have.property("type");
          expect(data.action).to.have.property("tweet");
          done();
        } catch (error) {
          done(error);
        }
      });

      // Trigger decision making
      decisionEngine.decideNextAction(actionContext, mockInteractions);
    });

    it("should handle empty interactions array", async function () {
      const result = await decisionEngine.decideNextAction(actionContext, []);
      expect(result).to.be.undefined;
    });

    it("should handle invalid agent ID", async function () {
      const invalidContext = {
        ...actionContext,
        agentId: "invalid_id",
      };
      const result = await decisionEngine.decideNextAction(
        invalidContext,
        mockInteractions
      );
      expect(result).to.be.undefined;
    });
  });

  describe("calculateReputationScore", function () {
    it("should calculate reputation score correctly for verified user", function () {
      const interaction: TwitterInteraction = {
        type: "mention",
        userId: "verified_user_id",
        username: "verified_user",
        tweetId: "tweet1",
        content: "Test content",
        timestamp: new Date(),
        userMetrics: {
          followerCount: 10000,
          followingCount: 1000,
          tweetCount: 5000,
          likeCount: 1000,
          listedCount: 200,
          verified: true,
          accountAge: 31536000, // 1 year in seconds
          reputationScore: 0.9,
        },
      };

      // @ts-ignore - Access private method for testing
      const score = decisionEngine.calculateReputationScore(interaction);
      expect(score).to.be.a("number");
      expect(score).to.be.within(0, 1);
      expect(score).to.be.greaterThan(0.5); // Verified user should have higher score
    });

    it("should calculate reputation score correctly for unverified user", function () {
      const interaction: TwitterInteraction = {
        type: "reply",
        userId: "unverified_user_id",
        username: "unverified_user",
        tweetId: "tweet2",
        content: "Test content",
        timestamp: new Date(),
        userMetrics: {
          followerCount: 100,
          followingCount: 200,
          tweetCount: 50,
          likeCount: 10,
          listedCount: 5,
          verified: false,
          accountAge: 2592000, // 1 month in seconds
          reputationScore: 0.3,
        },
      };

      // @ts-ignore - Access private method for testing
      const score = decisionEngine.calculateReputationScore(interaction);
      expect(score).to.be.a("number");
      expect(score).to.be.within(0, 1);
      expect(score).to.be.lessThan(0.5); // Unverified user with low metrics should have lower score
    });

    it("should handle edge cases in reputation calculation", function () {
      const interaction: TwitterInteraction = {
        type: "quote",
        userId: "edge_case_id",
        username: "edge_case",
        tweetId: "tweet3",
        content: "Test content",
        timestamp: new Date(),
        userMetrics: {
          followerCount: 0,
          followingCount: 0,
          tweetCount: 0,
          likeCount: 0,
          listedCount: 0,
          verified: false,
          accountAge: 0,
          reputationScore: 0,
        },
      };

      // @ts-ignore - Access private method for testing
      const score = decisionEngine.calculateReputationScore(interaction);
      expect(score).to.be.a("number");
      expect(score).to.be.within(0, 1);
      expect(score).to.equal(0); // Edge case should return minimum score
    });
  });

  describe("buildPrompt", function () {
    let actionContext: ActionContext;

    beforeEach(async function () {
      const gameInfo = await gameManager.createNewGame();
      const agent = gameInfo.agents[0].agent;

      actionContext = {
        agentId: agent.id,
        gameId: agent.gameId,
        agentOnchainId: agent.onchainId,
        gameOnchainId: gameInfo.dbGame.onchainId,
      };
    });

    it("should build a valid prompt with community suggestion", async function () {
      const communitySuggestion: ActionSuggestion = {
        type: "MOVE",
        target: "target_user",
        position: { x: 1, y: 1 },
        content: "Move to safer ground",
      };

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.buildPrompt(
        actionContext,
        communitySuggestion
      );
      expect(result).to.have.property("prompt");
      expect(result).to.have.property("actionContext");
      expect(result.prompt).to.be.a("string");
      expect(result.prompt).to.include("COMMUNITY SUGGESTION");
      expect(result.prompt).to.include("Move to safer ground");
    });

    it("should build a valid prompt without community suggestion", async function () {
      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.buildPrompt(actionContext, null);
      expect(result).to.have.property("prompt");
      expect(result).to.have.property("actionContext");
      expect(result.prompt).to.be.a("string");
      expect(result.prompt).to.include("No community suggestions");
    });

    it("should handle invalid agent ID in prompt building", async function () {
      const invalidContext = {
        ...actionContext,
        agentId: "invalid_id",
      };

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.buildPrompt(invalidContext, null);
      expect(result.prompt).to.equal("");
    });
  });

  describe("parseActionJson", function () {
    it("should parse valid JSON response", function () {
      const validJson = `{
        "type": "MOVE",
        "targetId": null,
        "position": {"x": 1, "y": 1},
        "tweet": "Moving to a new position"
      }`;

      // @ts-ignore - Access private method for testing
      const result = decisionEngine.parseActionJson(validJson);
      expect(result).to.deep.equal({
        type: "MOVE",
        targetId: null,
        position: { x: 1, y: 1 },
        tweet: "Moving to a new position",
      });
    });

    it("should handle invalid JSON response", function () {
      const invalidJson = "invalid json";

      // @ts-ignore - Access private method for testing
      const result = decisionEngine.parseActionJson(invalidJson);
      expect(result).to.be.null;
    });

    it("should handle JSON with preamble", function () {
      const jsonWithPreamble = `Here is the action:
      {
        "type": "BATTLE",
        "targetId": 123,
        "position": null,
        "tweet": "Initiating battle!"
      }`;

      // @ts-ignore - Access private method for testing
      const result = decisionEngine.parseActionJson(jsonWithPreamble);
      expect(result).to.deep.equal({
        type: "BATTLE",
        targetId: 123,
        position: null,
        tweet: "Initiating battle!",
      });
    });
  });

  describe.only("processInteractions", function () {
    let actionContext: ActionContext;

    beforeEach("processInteractions setup", async function () {
      const gameInfo = await gameManager.createNewGame();
      const agent = gameInfo.agents[0].agent;

      actionContext = {
        agentId: agent.id,
        gameId: agent.gameId,
        agentOnchainId: agent.onchainId,
        gameOnchainId: gameInfo.dbGame.onchainId,
      };
    });

    it.only("should process valid interactions and return action suggestion", async function () {
      const interactions: TwitterInteraction[] = [
        {
          type: "mention",
          userId: "user1",
          username: "highQualityUser",
          tweetId: "tweet1",
          content: "Move to (3,4) to avoid the battle!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 10000,
            followingCount: 1000,
            tweetCount: 5000,
            likeCount: 2000,
            listedCount: 200,
            verified: true,
            accountAge: 31536000, // 1 year
            reputationScore: 0.9,
          },
        },
        {
          type: "mention",
          userId: "user2",
          username: "lowQualityUser",
          tweetId: "tweet2",
          content: "Spam message",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 10,
            followingCount: 1000,
            tweetCount: 50,
            likeCount: 5,
            listedCount: 0,
            verified: false,
            accountAge: 86400, // 1 day
            reputationScore: 0.1,
          },
        },
      ];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(interactions);

      expect(result).to.not.be.null;
      expect(result).to.have.property("type");
      expect([
        "MOVE",
        "BATTLE",
        "FORM_ALLIANCE",
        "BREAK_ALLIANCE",
        "IGNORE",
      ]).to.include(result?.type);
      if (result?.type === "MOVE") {
        expect(result).to.have.property("position");
        expect(result.position).to.have.property("x");
        expect(result.position).to.have.property("y");
      }
      expect(result).to.have.property("content");
    });

    it("should return null for empty interactions array", async function () {
      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions([]);
      expect(result).to.be.null;
    });

    it("should filter out low reputation interactions", async function () {
      const interactions: TwitterInteraction[] = [
        {
          type: "mention",
          userId: "user2",
          username: "lowQualityUser",
          tweetId: "tweet2",
          content: "Spam message",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 10,
            followingCount: 1000,
            tweetCount: 50,
            likeCount: 5,
            listedCount: 0,
            verified: false,
            accountAge: 86400, // 1 day
            reputationScore: 0.1,
          },
        },
      ];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(interactions);
      expect(result).to.be.null;
    });

    it("should handle multiple valid interactions and prioritize by reputation", async function () {
      const interactions: TwitterInteraction[] = [
        {
          type: "mention",
          userId: "user3",
          username: "topInfluencer",
          tweetId: "tweet3",
          content: "Form alliance with @agent2!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 50000,
            followingCount: 1000,
            tweetCount: 10000,
            likeCount: 5000,
            listedCount: 500,
            verified: true,
            accountAge: 63072000, // 2 years
            reputationScore: 0.95,
          },
        },
        {
          type: "reply",
          userId: "user4",
          username: "regularUser",
          tweetId: "tweet4",
          content: "Move to (2,3)!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 1000,
            followingCount: 500,
            tweetCount: 2000,
            likeCount: 300,
            listedCount: 50,
            verified: false,
            accountAge: 15768000, // 6 months
            reputationScore: 0.6,
          },
        },
      ];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(interactions);
      expect(result).to.not.be.null;
      expect(result?.content).to.include("alliance"); // Should prioritize higher reputation suggestion
    });

    it("should handle malformed interaction data gracefully", async function () {
      const malformedInteractions = [
        {
          type: "mention",
          userId: "user5",
          username: "malformedUser",
          tweetId: "tweet5",
          content: "Valid content",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 1000,
            followingCount: 1000,
            tweetCount: 1000,
            likeCount: 1000,
            listedCount: 1000,
            verified: true,
            accountAge: 31536000, // 1 year
            reputationScore: 0.9,
          },
        },
      ] as TwitterInteraction[];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(
        malformedInteractions
      );
      expect(result).to.be.null;
    });

    it("should process interactions with specific action keywords", async function () {
      const interactions: TwitterInteraction[] = [
        {
          type: "mention",
          userId: "user6",
          username: "strategist",
          tweetId: "tweet6",
          content: "BATTLE against the enemy at coordinates (5,5)!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 5000,
            followingCount: 1000,
            tweetCount: 3000,
            likeCount: 1500,
            listedCount: 100,
            verified: true,
            accountAge: 31536000,
            reputationScore: 0.85,
          },
        },
      ];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(interactions);
      expect(result).to.not.be.null;
      expect(result?.type).to.equal("BATTLE");
      expect(result?.content).to.include("BATTLE");
    });

    it("should handle interactions with conflicting suggestions", async function () {
      const interactions: TwitterInteraction[] = [
        {
          type: "mention",
          userId: "user7",
          username: "advisor1",
          tweetId: "tweet7",
          content: "Form alliance!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 8000,
            followingCount: 2000,
            tweetCount: 4000,
            likeCount: 2000,
            listedCount: 150,
            verified: true,
            accountAge: 31536000,
            reputationScore: 0.8,
          },
        },
        {
          type: "reply",
          userId: "user8",
          username: "advisor2",
          tweetId: "tweet8",
          content: "Attack now!",
          timestamp: new Date(),
          userMetrics: {
            followerCount: 7000,
            followingCount: 1800,
            tweetCount: 3800,
            likeCount: 1800,
            listedCount: 140,
            verified: true,
            accountAge: 31536000,
            reputationScore: 0.78,
          },
        },
      ];

      // @ts-ignore - Access private method for testing
      const result = await decisionEngine.processInteractions(interactions);
      expect(result).to.not.be.null;
      // Should choose the suggestion from the higher reputation user
      expect(result?.content).to.include("alliance");
    });
  });
});
