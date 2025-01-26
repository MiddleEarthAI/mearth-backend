import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { Scraper, type Tweet } from "agent-twitter-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { Twitter } from "../twitter";

// Mock external dependencies
vi.mock("agent-twitter-client", () => ({
	Scraper: vi.fn(() => ({
		login: vi.fn(),
		fetchSearchTweets: vi.fn(),
		getTweet: vi.fn(),
		sendTweet: vi.fn(),
	})),
	SearchMode: {
		Latest: "Latest",
	},
}));

vi.mock("@ai-sdk/anthropic", () => ({
	AnthropicProvider: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
	prisma: {
		twitterInteraction: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
		$transaction: vi.fn(async (callback) => {
			if (typeof callback === "function") {
				return callback(prisma);
			}
			return Promise.resolve();
		}),
	},
}));

vi.mock("../../utils/logger", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

describe("Twitter", () => {
	let twitter: Twitter;
	let mockScraper: Scraper;
	let mockAnthropicProvider: AnthropicProvider;

	const mockConfig = {
		username: "test_agent",
		password: "test_password",
		email: "test@example.com",
		agentId: "test-agent-id",
		targetUsers: ["target1", "target2"],
		pollInterval: 1,
		dryRun: true,
	};

	const mockTweet: Tweet = {
		id: "123456789",
		conversationId: "987654321",
		text: "Test tweet content",
		username: "test_user",
		userId: "test_user_id",
		replies: 5,
		likes: 10,
		retweets: 2,
		hashtags: [],
		mentions: [],
		photos: [],
		thread: [],
		urls: [],
		videos: [],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockScraper = new Scraper();
		mockAnthropicProvider = vi.fn() as unknown as AnthropicProvider;
		twitter = new Twitter(mockAnthropicProvider, mockConfig);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		it("should initialize with valid config", () => {
			expect(twitter).toBeInstanceOf(Twitter);
			expect(mockScraper.login).toHaveBeenCalledWith(
				mockConfig.username,
				mockConfig.password,
				mockConfig.email,
			);
		});

		it("should throw error with invalid config", () => {
			expect(() => new Twitter(mockAnthropicProvider, {} as any)).toThrow(
				"TwitterConfig: username, password, email, and agentId are required",
			);
		});

		it("should initialize last checked tweet from database", async () => {
			const mockLastInteraction = {
				tweetId: "987654321",
			};

			vi.mocked(prisma.twitterInteraction.findFirst).mockResolvedValueOnce(
				mockLastInteraction as any,
			);

			twitter = new Twitter(mockAnthropicProvider, mockConfig);
			await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for initialization

			expect(prisma.twitterInteraction.findFirst).toHaveBeenCalledWith({
				where: { agentId: mockConfig.agentId },
				orderBy: { tweetId: "desc" },
			});
		});
	});

	describe("tweet processing", () => {
		it("should process new tweets and store interactions", async () => {
			const mockTweets = {
				tweets: [mockTweet],
			};

			vi.mocked(mockScraper.fetchSearchTweets).mockResolvedValueOnce(
				mockTweets as any,
			);

			vi.mocked(mockScraper.getTweet).mockResolvedValueOnce(mockTweet as any);

			twitter = new Twitter(mockAnthropicProvider, mockConfig);
			await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for first poll

			expect(prisma.twitterInteraction.create).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("Processed and stored tweet"),
			);
		});

		it("should handle tweet processing errors gracefully", async () => {
			vi.mocked(mockScraper.fetchSearchTweets).mockRejectedValueOnce(
				new Error("API Error"),
			);

			twitter = new Twitter(mockAnthropicProvider, mockConfig);
			await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for first poll

			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Error handling Twitter interactions"),
				expect.any(Error),
			);
		});
	});

	describe("tweet posting", () => {
		it("should post tweet in non-dry-run mode", async () => {
			const twitterLive = new Twitter(mockAnthropicProvider, {
				...mockConfig,
				dryRun: false,
			});
			const content = "Test tweet";

			await twitterLive.postTweet(content);

			expect(mockScraper.sendTweet).toHaveBeenCalledWith(content);
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("Posted tweet"),
			);
		});

		it("should not post tweet in dry-run mode", async () => {
			const content = "Test tweet";
			await twitter.postTweet(content);

			expect(mockScraper.sendTweet).not.toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("[DRY RUN]"),
			);
		});

		it("should handle tweet posting errors", async () => {
			const twitterLive = new Twitter(mockAnthropicProvider, {
				...mockConfig,
				dryRun: false,
			});
			vi.mocked(mockScraper.sendTweet).mockRejectedValueOnce(
				new Error("API Error"),
			);

			await expect(twitterLive.postTweet("Test tweet")).rejects.toThrow();
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Failed to post tweet"),
				expect.any(Error),
			);
		});
	});

	describe("community feedback", () => {
		it("should get aggregated community feedback", async () => {
			const mockInteractions = [
				{
					feedback: {
						suggestedAction: "move",
						targetAgent: "agent1",
						coordinateX: 10,
						coordinateY: 20,
						confidence: 0.8,
						reasoning: "test reasoning",
					},
					influence: {
						authorFollowerCount: 100,
						impressions: 500,
						likes: 50,
						commentCount: 10,
					},
					sentiment: "positive",
				},
			];

			vi.mocked(prisma.twitterInteraction.findMany).mockResolvedValueOnce(
				mockInteractions as any,
			);

			const feedback = await twitter.getCommunityFeedback();

			expect(feedback).toHaveLength(1);
			expect(feedback[0].suggestedAction).toBe("move");
			expect(feedback[0].coordinates).toEqual({ x: 10, y: 20 });
			expect(feedback[0].influence.sentiment).toBe("positive");
		});

		it("should handle empty feedback gracefully", async () => {
			vi.mocked(prisma.twitterInteraction.findMany).mockResolvedValueOnce([]);

			const feedback = await twitter.getCommunityFeedback();

			expect(feedback).toHaveLength(0);
		});
	});

	describe("reply posting", () => {
		it("should post reply in non-dry-run mode", async () => {
			const twitterLive = new Twitter(mockAnthropicProvider, {
				...mockConfig,
				dryRun: false,
			});
			const content = "Test reply";
			const replyToTweetId = "123456789";

			vi.mocked(mockScraper.getTweet).mockResolvedValueOnce({
				...mockTweet,
				username: "original_author",
			} as any);

			await twitterLive.postReply(content, replyToTweetId);

			expect(mockScraper.sendTweet).toHaveBeenCalledWith(
				"@original_author Test reply",
			);
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("Posted reply"),
			);
		});

		it("should handle missing tweet to reply to", async () => {
			const twitterLive = new Twitter(mockAnthropicProvider, {
				...mockConfig,
				dryRun: false,
			});
			vi.mocked(mockScraper.getTweet).mockResolvedValueOnce(null);

			await expect(
				twitterLive.postReply("Test reply", "123456789"),
			).rejects.toThrow("Tweet 123456789 not found");
		});
	});
});
