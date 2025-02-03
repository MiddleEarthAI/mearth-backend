import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/utils/logger";
import { prisma } from "@/config/prisma";
import { TWEET_COOLDOWN_MS } from "@/constants";
import TwitterManager from "@/agent/TwitterManager";

/**
 * Creates a sophisticated tweet tool for agents to engage in Middle Earth's social landscape
 * Integrates with onchain battle system and maintains social graph in database
 */

export const tweetTool = async ({
  agentId,
  agentDbId,
  gameDbId,
  twitter,
}: {
  agentId: number;
  agentDbId: string;
  gameDbId: string;
  twitter: TwitterManager;
}) => {
  const cooldown = await prisma.cooldown.findUnique({
    where: {
      agentId_type: {
        agentId: agentDbId,
        type: "Tweet",
      },
    },
  });
  const contextualDescription = `Tool/action you can use to POST TWEETS
Engage with the community to shape your destiny in Middle Earth. Your tweets influence battles, alliances and survival.
Every interaction from humans can alter your path - use your words wisely to gain support and $mearth tokens. You can only make your next tweet post at ${cooldown?.endsAt.toLocaleString()}
`;

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
    }),

    execute: async ({ content }) => {
      try {
        if (!twitter) throw new Error("Communication systems offline");

        const cooldown = await prisma.cooldown.upsert({
          where: {
            agentId_type: {
              agentId: agentDbId,
              type: "Tweet",
            },
          },
          update: {
            endsAt: new Date(Date.now() + TWEET_COOLDOWN_MS), //
          },
          create: {
            agentId: agentDbId,
            gameId: gameDbId,
            type: "Tweet",
            endsAt: new Date(Date.now() + TWEET_COOLDOWN_MS),
          },
        });

        // Post tweet and get its ID
        const postResult = await twitter.postTweet(content);

        const tweet = await prisma.tweet.create({
          data: {
            content,
            timestamp: new Date(),
            type: "Battle", // ??
            agentId: agentDbId,
            conversationId: postResult.data.id,
          },
        });

        logger.info(`
        🐦 ═══════════════════════════════════════════════════════════════════════
           Agent: ${agentId}
        ───────────────────────────────────────────────────────────────────────────
           Message:
           ${content
             .split("\n")
             .map((line) => "   " + line)
             .join("\n")}
        ═══════════════════════════════════════════════════════════════════════════`);

        return {
          success: true,
          message: `Tweet deployed via @${agentId}.You just twitted: ${content} 
          You can make your next tweet post at ${cooldown?.endsAt.toLocaleString()}`,
          tweetId: tweet.id,
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
