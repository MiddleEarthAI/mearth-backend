import { logger } from "@/utils/logger";
import { PrismaClient } from "@prisma/client";
import { Message } from "ai";
import { v4 as uuidv4 } from "uuid";

class MemoryConfig {
  maxMessages: number;
  summaryLength: number;

  constructor(config?: { maxMessages?: number; summaryLength?: number }) {
    this.maxMessages = config?.maxMessages ?? 20;
    this.summaryLength = config?.summaryLength ?? 2000;
  }
}

export class Memory {
  private config: MemoryConfig;
  private agentId: string;
  private prisma: PrismaClient;
  private messages: Message[];

  constructor(agentId: string, config?: MemoryConfig) {
    this.config = config || new MemoryConfig();
    this.agentId = agentId;
    this.prisma = new PrismaClient();
    this.messages = [];
  }

  async storeInteraction(
    userInput: string,
    agentResponse: string,
    toolCalls?: any[]
  ): Promise<void> {
    this.messages.push({
      role: "user",
      content: userInput,
      id: uuidv4(), // TODO: Add tool calls
    });
    this.messages.push({
      role: "assistant",
      content: agentResponse,
      id: uuidv4(),
    });
  }

  private async createSummary(messages: Message[]): Promise<string> {
    const summaryPrompt = `
      Summarize the following conversation in less than ${
        this.config.summaryLength
      } words.
      Focus on key points, decisions, and important information discovered through tool usage.

      Conversation:
      ${JSON.stringify(messages)}
    `;

    // const response = await generateText({
    //   model: new
    //   prompt: summaryPrompt,
    // });

    // return response.choices[0].message.content || "";
    return "";
  }

  async storeSummary(
    summary: string,
    startTime: Date,
    endTime: Date,
    messageCount: number
  ): Promise<void> {
    await this.prisma.memory.create({
      data: {
        content: summary,
        agentId: this.agentId,
        role: "System",
      },
    });
  }

  async getRecentContext(): Promise<string> {
    const summaryResult = await this.prisma.memory.findFirst({
      where: {
        agentId: this.agentId,
      },
    });

    const conversations = await this.prisma.memory.findMany({
      where: {
        agentId: this.agentId,
        createdAt: {
          gt: summaryResult?.createdAt,
        },
      },
    });

    const context: string[] = [];
    if (summaryResult) {
      context.push(`Previous conversation summary: ${summaryResult.content}`);
    }

    conversations.forEach((conv: any) => {
      context.push(`User: ${conv.content}`);
      if (conv.tool_calls) {
        context.push(`Tool Usage: ${JSON.stringify(conv.tool_calls)}`);
      }
      context.push(`Assistant: ${conv.content}`);
    });

    return context.join("\n");
  }

  async checkAndSummarize(): Promise<void> {
    try {
      const count = await this.prisma.memory.count({
        where: {
          agentId: this.agentId,
        },
      });

      if (count >= this.config.maxMessages) {
        const messages = await this.prisma.memory.findMany({
          where: {
            agentId: this.agentId,
          },
        });

        if (messages.length > 0) {
          const summary = await this.createSummary([]);
          await this.storeSummary(
            summary,
            messages[0].createdAt,
            messages[messages.length - 1].createdAt,
            messages.length
          );
        }
      }
    } catch (error) {
      logger.error("Error checking and summarizing memory", error);
    }
  }
}
