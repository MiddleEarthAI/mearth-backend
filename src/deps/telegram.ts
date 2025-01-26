import { logger } from "@/utils/logger";
import { EventEmitter } from "events";
import { AnthropicProvider } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { prisma } from "@/config/prisma";
import NodeCache from "node-cache";
import { ITelegram } from "@/types";

class TelegramConfig {
  public botToken: string;
  public agentId: string;
  public pollInterval?: number; // in seconds
  public dryRun?: boolean;
  public targetGroups?: string[];

  constructor(config?: TelegramConfig) {
    if (!config?.botToken || !config?.agentId) {
      throw new Error("TelegramConfig: botToken and agentId are required");
    }
    this.agentId = config.agentId;
    this.botToken = config.botToken;
    this.targetGroups = config?.targetGroups ?? [];
    this.pollInterval = config?.pollInterval ?? 120;
    this.dryRun = config?.dryRun ?? true;
  }
}

interface TelegramMessage {
  messageId: string;
  chatId: string;
  text: string;
  fromUser: {
    id: string;
    username?: string;
    firstName?: string;
  };
  replyToMessage?: {
    messageId: string;
    text: string;
  };
  timestamp: Date;
}

interface MessageAnalysis {
  suggestedAction: "move" | "battle" | "alliance" | "ignore";
  targetAgent: string | null;
  coordinates: { x: number; y: number } | null;
  confidence: number;
  reasoning: string;
}

interface CommunityFeedback {
  suggestedAction: "move" | "battle" | "alliance" | "ignore";
  targetAgent?: string;
  coordinates?: { x: number; y: number };
  confidence: number;
  influence: {
    memberCount: number;
    messageViews: number;
    reactions: number;
    replies: number;
    influencerImpact: number;
    sentiment: "positive" | "negative" | "neutral";
  };
  reasoning?: string;
}

export class Telegram extends EventEmitter implements ITelegram {
  private config: TelegramConfig;
  private cache: NodeCache;
  private lastCheckedMessageId: string = "0";
  private anthropic: AnthropicProvider;
  private agentId: string;

  constructor(anthropic: AnthropicProvider, config: TelegramConfig) {
    super();
    this.config = config;
    this.anthropic = anthropic;
    this.agentId = config.agentId;
    this.cache = new NodeCache();
  }

  async init() {
    try {
      // Initialize bot and verify token
      const me = await this.getMe();
      logger.info(`Telegram bot initialized: ${me.username}`);

      await this.initializeLastCheckedMessage();
      await this.startMonitoring();
    } catch (error) {
      logger.error("Failed to initialize Telegram bot:", error);
      throw error;
    }
  }

  private async getMe() {
    // Implement bot info retrieval
    return { username: "MiddleEarthBot" }; // Placeholder
  }

  private async initializeLastCheckedMessage() {
    // Initialize from database
    const lastMessage = await prisma.tweet.findFirst({
      where: { agentId: this.agentId },
      orderBy: { createdAt: "desc" },
    });

    if (lastMessage?.id) {
      this.lastCheckedMessageId = lastMessage.id;
    }
  }

  private async startMonitoring() {
    const handleMessagesLoop = async () => {
      await this.handleTelegramMessages();
      setTimeout(handleMessagesLoop, this.config.pollInterval! * 1000);
    };
    handleMessagesLoop();
  }

  private async handleTelegramMessages() {
    try {
      // Get new messages from configured groups
      for (const groupId of this.config.targetGroups || []) {
        const messages = await this.getNewMessages(groupId);

        for (const message of messages) {
          if (message.messageId > this.lastCheckedMessageId) {
            await this.processMessage(message);
            this.lastCheckedMessageId = message.messageId;
          }
        }
      }
    } catch (error) {
      logger.error("Error handling Telegram messages:", error);
    }
  }

  private async getNewMessages(groupId: string): Promise<TelegramMessage[]> {
    // Implement message fetching logic
    return []; // Placeholder
  }

  private async processMessage(message: TelegramMessage) {
    try {
      // Build message thread for context
      const thread = await this.buildMessageThread(message);

      // Analyze message content
      const analysis = await this.analyzeMessageContent(message, thread);

      // Record feedback in database
      await this.recordMessageFeedback(message, analysis);

      logger.info(`Processed Telegram message ${message.messageId}`);
    } catch (error) {
      logger.error(`Error processing message ${message.messageId}:`, error);
    }
  }

  private async buildMessageThread(
    message: TelegramMessage,
    maxDepth: number = 5
  ): Promise<TelegramMessage[]> {
    const thread: TelegramMessage[] = [message];
    let currentMessage = message;
    let depth = 0;

    while (currentMessage.replyToMessage && depth < maxDepth) {
      try {
        const parentMessage = await this.getMessage(
          currentMessage.replyToMessage.messageId,
          currentMessage.chatId
        );
        if (parentMessage) {
          thread.unshift(parentMessage);
          currentMessage = parentMessage;
        }
        depth++;
      } catch (error) {
        logger.error("Error fetching parent message:", error);
        break;
      }
    }

    return thread;
  }

  private async getMessage(
    messageId: string,
    chatId: string
  ): Promise<TelegramMessage | null> {
    // Implement message fetching
    return null; // Placeholder
  }

  private async analyzeMessageContent(
    message: TelegramMessage,
    thread: TelegramMessage[]
  ): Promise<MessageAnalysis> {
    const prompt = `
    As an AI agent in a strategy game, analyze this Telegram message and its context to determine the suggested action.
    The possible actions are: move, battle, alliance, or ignore.

    Message from ${message.fromUser.username || "User"}: "${message.text}"

    Thread context:
    ${thread
      .map((m) => `${m.fromUser.username || "User"}: ${m.text}`)
      .join("\n")}

    Consider:
    1. Is there a suggested action? (move/battle/alliance/ignore)
    2. Is there a target agent? (mentioned with @)
    3. Are there coordinates mentioned? (x,y format)
    4. How confident should we be about this interpretation? (0.0-1.0)
    5. What's the reasoning behind this suggestion?

    Return the analysis in this JSON format:
    {
      "suggestedAction": "move|battle|alliance|ignore",
      "targetAgent": "@username or null",
      "coordinates": {"x": number, "y": number} or null,
      "confidence": number,
      "reasoning": "brief explanation"
    }
    `;

    try {
      const result = await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt,
      });

      const analysis = JSON.parse(result.toString());
      return {
        suggestedAction: analysis.suggestedAction || "move",
        targetAgent: analysis.targetAgent?.replace("@", "") || null,
        coordinates: analysis.coordinates || null,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || "",
      };
    } catch (error) {
      logger.error("Error analyzing message content:", error);
      return {
        suggestedAction: "move",
        targetAgent: null,
        coordinates: null,
        confidence: 0.5,
        reasoning: "Failed to analyze message content",
      };
    }
  }

  private async recordMessageFeedback(
    message: TelegramMessage,
    analysis: MessageAnalysis
  ) {
    // Store message and feedback in database using existing schema
    await prisma.tweet.create({
      data: {
        agentId: this.agentId,
        content: message.text,
        tweetId: BigInt(message.messageId),
        authorFollowerCount: 0, // Could be group member count
        feedback: {
          create: {
            suggestedAction: analysis.suggestedAction,
            targetAgent: analysis.targetAgent || "",
            coordinateX: analysis.coordinates?.x || 0,
            coordinateY: analysis.coordinates?.y || 0,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            sentiment: "neutral", // Could be analyzed separately
          },
        },
      },
    });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      if (this.config.dryRun) {
        logger.info(`[DRY RUN] Would send message to ${chatId}: ${text}`);
        return;
      }

      // Implement actual message sending
      logger.info(`Sent message to ${chatId}: ${text}`);
    } catch (error) {
      logger.error("Failed to send message:", error);
      throw error;
    }
  }

  async replyToMessage(
    chatId: string,
    messageId: string,
    text: string
  ): Promise<void> {
    try {
      if (this.config.dryRun) {
        logger.info(
          `[DRY RUN] Would reply to message ${messageId} in ${chatId}: ${text}`
        );
        return;
      }

      // Implement actual reply sending
      logger.info(`Sent reply to message ${messageId} in ${chatId}: ${text}`);
    } catch (error) {
      logger.error("Failed to send reply:", error);
      throw error;
    }
  }

  async getCommunityFeedback(): Promise<CommunityFeedback[]> {
    const recentMessages = await prisma.tweet.findMany({
      where: {
        agentId: this.agentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        engagement: true,
        feedback: true,
      },
    });

    return recentMessages.map((message) => ({
      suggestedAction:
        (message.feedback?.suggestedAction as
          | "move"
          | "battle"
          | "alliance"
          | "ignore") || "move",
      targetAgent: message.feedback?.targetAgent,
      coordinates:
        message.feedback?.coordinateX && message.feedback?.coordinateY
          ? {
              x: message.feedback.coordinateX,
              y: message.feedback.coordinateY,
            }
          : undefined,
      confidence: message.feedback?.confidence || 0.5,
      influence: {
        memberCount: 0, // Could be fetched from group info
        messageViews: message.engagement?.impressions || 0,
        reactions: message.engagement?.likes || 0,
        replies: message.engagement?.comments || 0,
        influencerImpact: message.engagement?.influencerImpact || 0,
        sentiment:
          (message.feedback?.sentiment as
            | "positive"
            | "negative"
            | "neutral") || "neutral",
      },
      reasoning: message.feedback?.reasoning,
    }));
  }
}
