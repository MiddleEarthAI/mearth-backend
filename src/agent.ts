import { moveTool } from "./utils/actions";
import { v4 as uuidv4 } from "uuid";

import { IAgent } from "./types";
import { Solana } from "./deps/solana";
import { Memory } from "./deps/memory";

import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Message } from "ai";
import { composeContext } from "./utils/templates";
import { logger } from "./utils/logger";
import { generateAgentContext } from "./utils/generation";

export interface AgentConfig {
  username: string;
  password: string;
  email: string;
  maxMessagesForSummary: number;
}

export class Agent implements IAgent {
  private anthropic: AnthropicProvider;
  private solana: Solana;
  private memory: Memory;
  private messages: Message[]; // store conversation history in memory
  //   private twitter: Twitter;
  private isRunning: boolean = false;

  constructor(agentConfig: AgentConfig, readonly agentId: string) {
    // this.twitter = new Twitter({
    //   username: agentConfig.username,
    //   password: agentConfig.password,
    //   email: agentConfig.email,
    // });

    // Initialize Anthropic anthropic - expects ANTHROPIC_API_KEY in environment
    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.messages = [];
    this.agentId = agentId;
    this.solana = new Solana();
    this.memory = new Memory(agentId, {
      summaryLength: 100,
      maxMessages: agentConfig.maxMessagesForSummary,
    });
  }

  async start() {
    this.isRunning = true;

    const actionLoop = async () => {
      const agents = await prisma?.agent.findMany();
      const currentAgent = agents?.find((agent) => agent.id === this.agentId);
      const currentAgentPersonality = await prisma?.agentPersonality.findUnique(
        {
          where: {
            agentId: currentAgent?.id,
          },
        }
      );
      const currentAgentMemory = await prisma?.memory.findUnique({
        where: {
          agentId: currentAgent?.id,
        },
      });

      if (!currentAgent) {
        throw new Error("Current agent not found");
      }

      const agentContext = generateAgentContext(
        {
          agent: currentAgent,
          personality: currentAgentPersonality || null,
          memory: currentAgentMemory || null,
        },
        agents || []
      );

      const temp = `
      ${agentContext}
      #Recent Events:
      ${this.messages
        .filter((message) => message.role === "assistant")
        .map((message) => message.content)
        .join("\n")}

     
      
      #Nearby Agents:
      ${agents
        ?.filter((agent) => agent.id !== currentAgent?.id && agent.isAlive)
        .map(
          (agent) => `
      @${agent.twitterHandle}:
      - Name: ${agent.name}
      - Position: (${agent.positionX}, ${agent.positionY}) 
      - Token Balance: ${agent.tokenBalance} MEARTH
      - Status: ${agent.isAlive ? "Active" : "Defeated"}
      - Alliance: ${agent.allianceWith || "None"}
      `
        )
        .join("\n")}

     
      
      #Task
      Decide your next action considering you are playing the role of @${
        currentAgent?.twitterHandle
      }
      `;

      const context = composeContext(temp, {});
      console.log("context", context);
      await this.processQuery(context);
      await actionLoop();
      await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 60 * 1000)); // wait 1 hour before starting again
    };

    actionLoop();
  }

  async processQuery(query: string) {
    // Add user input to conversation history
    this.messages.push({
      role: "user",
      content: query,
      id: uuidv4(),
      createdAt: new Date(),
    });

    try {
      const result = await generateText({
        model: this.anthropic("claude-3-5-sonnet-20240620"),
        prompt: query,
        tools: {
          MOVE: moveTool(this.agentId, this.solana),
        },
        maxSteps: 5,
        onStepFinish: (step) => {
          logger.info("just finished steps");
        },
        toolChoice: "required",
      });

      for (const toolCall of result.toolCalls) {
        switch (toolCall.toolName) {
          case "MOVE": {
            console.log("moving", toolCall.args.x, toolCall.args.y);
            break;
          }
        }
      }
    } catch (error) {
      const errorMessage = `Error processing query: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.messages.push({
        role: "assistant",
        content: errorMessage,
        id: uuidv4(),
        createdAt: new Date(),
      });
      return errorMessage;
    }
  }

  getConversationHistory(): Message[] {
    return this.messages;
  }

  stop() {
    this.isRunning = false;
  }
}
