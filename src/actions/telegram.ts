import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { Telegram } from "@/deps/telegram";
import natural from "natural";

type MessageSentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

interface TelegramValidationResult {
  isValid: boolean;
  message: string;
  sentiment?: {
    score: number;
    comparative: number;
    words: string[];
  };
}

interface TelegramMessageResponse {
  messageId: string;
  chatId: string;
}

/**
 * Validates a Telegram message before sending
 */
async function validateTelegramMessage(
  agentId: string,
  message: string
): Promise<TelegramValidationResult> {
  // Check message length
  if (message.length < 1 || message.length > 4096) {
    return {
      isValid: false,
      message: "Message must be between 1 and 4096 characters",
    };
  }

  // Check for spam by looking at recent messages
  const recentMessages = await prisma.message.findMany({
    where: {
      agentId,
      platform: "TELEGRAM",
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
  });

  if (recentMessages.length >= 5) {
    return {
      isValid: false,
      message:
        "Too many messages sent recently. Please wait before sending more.",
    };
  }

  // Analyze sentiment
  const analyzer = new natural.SentimentAnalyzer(
    "English",
    natural.PorterStemmer,
    "afinn"
  );
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(message) || [];
  const sentiment = analyzer.getSentiment(words);

  return {
    isValid: true,
    message: "Message validation passed",
    sentiment: {
      score: sentiment,
      comparative: words.length > 0 ? sentiment / words.length : 0,
      words,
    },
  };
}

/**
 * Records message engagement metrics
 */
async function recordMessageEngagement(messageId: string) {
  await prisma.messageEngagement.create({
    data: {
      messageId,
      platform: "TELEGRAM",
      views: 0,
      reactions: 0,
      replies: 0,
      forwards: 0,
    },
  });
}

/**
 * Creates message feedback based on content analysis
 */
async function createMessageFeedback(
  messageId: string,
  content: string,
  sentiment: TelegramValidationResult["sentiment"]
) {
  // Extract potential coordinates from message
  const coordRegex = /\((\d+),\s*(\d+)\)/;
  const coordMatch = content.match(coordRegex);
  const coordinates = coordMatch
    ? {
        x: parseFloat(coordMatch[1]),
        y: parseFloat(coordMatch[2]),
      }
    : null;

  // Extract potential agent mentions
  const handleRegex = /@(\w+)/g;
  const mentionedHandles = content.match(handleRegex) || [];
  const targetAgent = mentionedHandles[0]?.slice(1); // First mentioned handle without @

  await prisma.messageFeedback.create({
    data: {
      messageId,
      platform: "TELEGRAM",
      suggestedAction: content.toLowerCase().includes("alliance")
        ? "FORM_ALLIANCE"
        : content.toLowerCase().includes("battle")
        ? "PREPARE_BATTLE"
        : "OBSERVE",
      targetAgent: targetAgent || "",
      coordinateX: coordinates?.x || 0,
      coordinateY: coordinates?.y || 0,
      confidence: sentiment?.comparative || 0,
      reasoning: `Sentiment score: ${sentiment?.score}, Words analyzed: ${sentiment?.words.length}`,
      sentiment:
        sentiment?.score && sentiment.score > 0
          ? "POSITIVE"
          : sentiment?.score && sentiment.score < 0
          ? "NEGATIVE"
          : "NEUTRAL",
    },
  });
}

export const telegramTool = async function (
  agentId: string,
  telegram: Telegram | null
) {
  return tool({
    description: `Strategic communication tool for Middle Earth agents via Telegram:
      - Broadcast intentions and actions to groups
      - Form alliances and declare battles
      - Share intelligence and locations
      - Influence community sentiment
      Messages are analyzed for sentiment and strategic content.`,
    parameters: z.object({
      message: z
        .string()
        .max(4096)
        .describe(
          "Strategic message to broadcast. Include coordinates as (x,y) and mention targets with @handle."
        ),
      chatId: z
        .string()
        .optional()
        .describe("Optional specific chat/group ID to send the message to"),
      replyToMessageId: z
        .string()
        .optional()
        .describe("Optional message ID to reply to"),
    }),
    execute: async ({ message, chatId, replyToMessageId }) => {
      try {
        if (!telegram) {
          throw new Error("Telegram client not initialized");
        }

        // Get agent data
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            currentLocation: true,
          },
        });

        if (!agent) {
          throw new Error("Agent not found");
        }

        if (agent.status !== "ACTIVE") {
          throw new Error("Agent is not active");
        }

        // Validate message
        const validation = await validateTelegramMessage(agentId, message);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }

        // Send message
        const sentMessage = await telegram.sendMessage(
          chatId || "@middleearthai", // Default to main group
          message
        );

        // Record message in database
        const dbMessage = await prisma.message.create({
          data: {
            id: sentMessage.messageId,
            agentId,
            platform: "TELEGRAM",
            content: message,
            chatId: sentMessage.chatId,
            replyToMessageId: replyToMessageId || null,
            createdAt: new Date(),
          },
        });

        // Record engagement metrics
        await recordMessageEngagement(dbMessage.id);

        // Create message feedback
        await createMessageFeedback(
          dbMessage.id,
          message,
          validation.sentiment
        );

        return {
          success: true,
          messageId: dbMessage.id,
          sentiment: validation.sentiment,
        };
      } catch (error) {
        logger.error("Error in telegram tool:", error);
        throw error;
      }
    },
  });
};
