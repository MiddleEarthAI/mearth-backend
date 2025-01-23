import { actions } from "./utils/actions";
import { v4 as uuidv4 } from "uuid";

import { Twitter } from "./deps/twitter";
import { IAgent } from "./types";
import { Solana } from "./deps/solana";
import { Memory } from "./deps/memory";

import {
  anthropic,
  AnthropicProvider,
  createAnthropic,
} from "@ai-sdk/anthropic";
import { generateText, Message } from "ai";
import { composeContext } from "./templates";

export interface AgentConfig {
  username: string;
  password: string;
  email: string;
  maxMessagesForSummary: number;
}

export class Agent extends Twitter implements IAgent {
  private anthropic: AnthropicProvider;
  private solana: Solana;
  private memory: Memory;
  private messages: Message[]; // store conversation history in memory
  private isRunning: boolean = false;

  constructor(agentConfig: AgentConfig, readonly agentId: string) {
    super({
      username: agentConfig.username,
      password: agentConfig.password,
      email: agentConfig.email,
    });

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

    while (this.isRunning) {
      const agents = await prisma?.agent.findMany();
      const currentAgent = agents?.find((agent) => agent.id === this.agentId);

      const temp = `You an AI agent playing the Middle Earth Game. A strategic game where you can recruit allies and battle other agents. \n
      You are playing the role of ${currentAgent?.name} with twitter handle @${
        currentAgent?.twitterHandle
      }

      #Recent Events:
      ${this.messages
        .filter((message) => message.role === "assistant")
        .map((message) => message.content)
        .join("\n")}

      #Current Agent Status: @${currentAgent?.twitterHandle}
      - Name: ${currentAgent?.name}
      - Token Balance: ${currentAgent?.tokenBalance} Mearth
      - Position: (${currentAgent?.positionX}, ${currentAgent?.positionY})
      - Alliance Status: ${
        currentAgent?.allianceWith
          ? `Allied with ${currentAgent?.allianceWith}`
          : "No active alliances"
      }
      - Last Battle: ${
        currentAgent?.lastBattleTime
          ? new Date(currentAgent.lastBattleTime).toLocaleString()
          : "No battles yet"
      }
      - Combat Stats:
        • Aggressiveness: ${currentAgent?.aggressiveness}/100
        • Alliance Propensity: ${currentAgent?.alliancePropensity}/100
        • Influenceability: ${currentAgent?.influenceability}/100
      
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

      #Rules
      - You can only battle another agent 
      - You can only battle other players if you have enough gold.
      - You can only recruit allies if you have enough gold.
      - You can only battle other players if you have enough gold.
      
      #Task
      Decide your next action considering you are playing the role of @${
        currentAgent?.twitterHandle
      }
      Respond with a JSON format output


      
      
      `;
      const context = composeContext(temp, {});
      await this.processQuery(context);
      await Promise.resolve(setTimeout(this.start, 1 * 60 * 60 * 1000)); // wait 1 hour before starting again
    }
  }

  async processQuery(query: string) {
    // Add user input to conversation history
    this.messages.push({
      role: "user",
      content: query,
      id: uuidv4(),
    });

    try {
      const { text, toolCalls, toolResults } = await generateText({
        model: anthropic("claude-3-5-sonnet-20240620"),
        prompt: query,
        tools: actions,
        maxSteps: 5,
        onStepFinish: (step) => {
          console.log("step", step);
        },
        toolChoice: "required",
      });
      toolResults.forEach((result) => {
        console.log("result", result.toolCallId);
      });
      console.log("response", text);
      // If no tool calls, we're done
      if (!toolCalls) {
        this.messages.push({
          content: text,
          role: "system",
          id: uuidv4(),
        });

        return text || "";
      }
    } catch (error) {
      const errorMessage = `Error processing query: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.messages.push({
        role: "assistant",
        content: errorMessage,
        id: uuidv4(),
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
