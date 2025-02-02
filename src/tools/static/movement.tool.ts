import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { MOVE_COOLDOWN_MS, getTerrainTypeByCoordinates } from "@/constants";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { GenerateContextStringResult } from "@/agent/Agent";
import { logger } from "@/utils/logger";
import { TerrainType } from "@prisma/client";
import * as movementUtils from "@/instructionUtils/movement";

/**
 * Tool for agents to navigate the Middle Earth map
 */
export const movementTool = (result: GenerateContextStringResult) => {
  const currentAgent = result.currentAgent;

  return tool({
    description: `Movement Tool for navigating Middle Earth's game world.

Features:
- Move to specific coordinates
- Navigate different terrains (plains, mountains, rivers)
- Calculate movement costs
- Handle movement cooldowns
- Avoid obstacles and other agents
- Strategic positioning

TERRAIN EFFECTS:
- Plains: Normal movement
- Mountains: Slower movement, defensive advantage
- Rivers: Restricted movement, strategic crossing points

COOLDOWN:
- Each movement has a cooldown period
- Cooldown varies by terrain type
- Must wait for cooldown to expire before next move

STRATEGIC CONSIDERATIONS:
- Position affects battle outcomes
- Terrain provides tactical advantages
- Movement reveals position to others
- Consider alliance proximity`,

    parameters: z.object({
      destination: z
        .object({
          x: z
            .number()
            .describe(
              "X coordinate to move to. must be within the game world's bounds"
            ),
          y: z
            .number()
            .describe(
              "Y coordinate to move to. must be within the game world's bounds"
            ),
        })
        .describe("Target coordinates"),
      strategy: z
        .enum(["cautious", "direct", "stealth"])
        .describe("Movement strategy affecting speed and visibility")
        .optional(),
    }),

    execute: async ({ destination, strategy = "direct" }) => {
      try {
        // Get current agent state with location
        const agent = await prisma.agent.findUnique({
          where: {
            agentId_gameId: {
              agentId: currentAgent.agentId,
              gameId: currentAgent.gameId,
            },
          },
          include: {
            location: true,
            game: true,
            state: true,
          },
        });

        if (!agent) {
          return {
            success: false,
            message:
              "You seem not to be in the game anymore we couldn't find you in the database. Did you die?",
          };
        }

        if (!agent.state?.isAlive) {
          return {
            success: false,
            message: "You seem not to be alive anymore. You can't move.",
          };
        }
        // Get program and PDAs
        const program = await getProgramWithWallet();

        const [gamePda] = getGamePDA(
          program.programId,
          Number(agent.game.gameId)
        );
        const [agentPda] = getAgentPDA(
          program.programId,
          gamePda,
          new BN(agent.agentId)
        );

        // Fetch on-chain agent account
        const agentAccount = await program.account.agent.fetch(agentPda);

        // Check cooldown
        const lastMove = agentAccount.lastMove.toNumber() * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeSinceLastMove = now - lastMove;

        if (timeSinceLastMove < MOVE_COOLDOWN_MS) {
          // const waitTime = Math.ceil(
          //   (MOVE_COOLDOWN_MS - timeSinceLastMove) / 1000
          // );
          return {
            success: false,
            message: `You are on cooldown. Wait untile ${new Date(
              lastMove + MOVE_COOLDOWN_MS
            ).toISOString()} seconds. current time is ${new Date().toISOString()}`,
          };
        }

        // Get and validate terrain type
        const terrainType = getTerrainTypeByCoordinates(
          destination.x,
          destination.y
        );

        // Validate movement distance
        const distance = Math.sqrt(
          Math.pow(destination.x - agent.location!.x, 2) +
            Math.pow(destination.y - agent.location!.y, 2)
        );

        const MAX_MOVE_DISTANCE = 10; // Maximum allowed movement distance
        if (distance > MAX_MOVE_DISTANCE) {
          return {
            success: false,
            message: `Movement distance too large. Maximum allowed distance is ${MAX_MOVE_DISTANCE} units.`,
          };
        }

        // Execute movement
        const result = await movementUtils.moveAgent(
          Number(agent.game.gameId),
          agent.agentId,
          destination.x,
          destination.y,
          terrainType
        );

        // Update agent state in database
        await prisma.agent.update({
          where: {
            id: agent.id,
          },
          data: {
            location: {
              update: {
                x: destination.x,
                y: destination.y,
                terrainType:
                  Object.keys(terrainType)[0].toLowerCase() === "mountain"
                    ? TerrainType.Mountain
                    : Object.keys(terrainType)[0].toLowerCase() === "river"
                    ? TerrainType.River
                    : TerrainType.Plain,
              },
            },
            state: {
              update: {
                lastActionType: "move",
                lastActionTime: new Date(),
                lastActionDetails: `Moved to (${destination.x}, ${destination.y}) using ${strategy} strategy`,
              },
            },
          },
        });

        logger.info(
          `🚶 Agent ${agent.agentId} moved to (${destination.x}, ${
            destination.y
          }) on ${
            Object.keys(terrainType)[0]
          } terrain using ${strategy} strategy`
        );

        return {
          success: true,
          newPosition: destination,
          terrain: Object.keys(terrainType)[0],
          strategy,
          transactionHash: result.tx,
        };
      } catch (error) {
        logger.error("Movement execution failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Movement failed"
        );
      }
    },
  });
};
