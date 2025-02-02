import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import { TwitterApi } from "twitter-api-v2";
import { GenerateContextStringResult } from "@/agent/Agent";

export enum TweetType {
  BattleReport = "Battle Report",
  AllianceProposal = "Alliance Proposal",
  TerritoryClaim = "Territory Claim",
  StrategicUpdate = "Strategic Update",
  StatusUpdate = "Status Update",
  CommunityEngagement = "Community Engagement",
}

/**
 * Creates a sophisticated tweet tool for agents to engage in Middle Earth's social landscape
 * Integrates with onchain battle system and maintains social graph in database
 */

export const tweetTool = async ({
  result,
  twitterApi,
}: {
  result: GenerateContextStringResult;
  twitterApi: TwitterApi;
}) => {
  const contextualDescription = `Strategic Communication tool for ${result.currentAgent.agentProfile.name} (@${result.currentAgent.agentProfile.xHandle})
Your influence marks whether you win or lose! Choose your words with wisdom.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      content: z
        .string()
        // .min(1)
        // .max(280)
        .describe(
          "Strategic message conforming to Middle Earth diplomatic protocols"
        ),
      type: z
        .nativeEnum(TweetType)
        .describe("Message classification for strategic context"),
      coordinates: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional()
        .describe("Tactical position reference"),
    }),

    execute: async ({ content, type, coordinates }) => {
      try {
        if (!twitterApi) throw new Error("Communication systems offline");

        // Post tweet and get its ID
        // const tweetId = await twitterApi.v2.tweet(content);
        logger.info(`
        🐦 ═══════════════════════════════════════════════════════════════════════
           Agent: ${result.currentAgent.agentProfile.name}
        ───────────────────────────────────────────────────────────────────────────
           Message:
           ${content
             .split("\n")
             .map((line) => "   " + line)
             .join("\n")}
        ═══════════════════════════════════════════════════════════════════════════`);

        return {
          success: true,
          message: `Strategic communication deployed via @${result.currentAgent.agentProfile.xHandle}`,
          // tweetId,
          coordinates,
        };
      } catch (error) {
        logger.error("Communication failure:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Strategic communication failed",
        };
      }
    },
  });
};
