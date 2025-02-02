import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import {
  MOVEMENT_UNITS_PER_HOUR,
  MOVE_COOLDOWN_MS,
  getTerrainTypeByCoordinates,
} from "@/constants";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { logger } from "@/utils/logger";
import { TerrainType } from "@prisma/client";

/**
 * Tool for agents to navigate the Middle Earth map
 */
export const movementTool = (
  agentId: number,
  gameId: number,
  gameDbId: string
) => {
  return tool({
    description: `Movement Tool for navigating Middle Earth's game world.
what you can do:
- Move to specific coordinates
- Navigate different terrains (plains, mountains, rivers)
- Strategic positioning
`,

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
    }),

    execute: async ({ destination }) => {
      try {
        // Get program and PDAs
        const program = await getProgramWithWallet();

        const [gamePda] = getGamePDA(program.programId, Number(gameId));

        const [agentPda] = getAgentPDA(
          program.programId,
          gamePda,
          new BN(agentId)
        );

        const agentAccount = await program.account.agent.fetch(agentPda);

        const lastMove = agentAccount.lastMove.toNumber();

        const now = Date.now();
        const timeSinceLastMove = now - lastMove;

        if (timeSinceLastMove < MOVE_COOLDOWN_MS) {
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
          Math.pow(destination.x - agentAccount.x, 2) +
            Math.pow(destination.y - agentAccount.y, 2)
        );

        if (distance > MOVEMENT_UNITS_PER_HOUR) {
          return {
            success: false,
            message: `Movement distance too large. Maximum allowed distance is ${MOVEMENT_UNITS_PER_HOUR} units.`,
          };
        }

        const tx = await program.methods
          .moveAgent(new BN(destination.x), new BN(destination.y), terrainType)
          .accounts({
            agent: agentPda,
            authority: program.provider.publicKey,
          })
          .rpc();

        // Update agent state in database
        await prisma.agent.update({
          where: {
            agentId_gameId: {
              agentId: agentId,
              gameId: gameDbId,
            },
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
                lastActionDetails: `Moved to (${destination.x}, ${
                  destination.y
                }) on ${Object.keys(terrainType)[0]} terrain`,
              },
            },
          },
        });

        logger.info(
          `🚶 Agent ${agentId} moved to (${destination.x}, ${
            destination.y
          }) on ${Object.keys(terrainType)[0]} terrain`
        );

        return {
          success: true,
          newPosition: `You just successfully relocated to(${destination.x}, ${
            destination.y
          }). Make sure to share this action to your community. You next move will be happening at ${new Date(
            lastMove + MOVE_COOLDOWN_MS
          ).toISOString()} seconds. current time is ${new Date().toISOString()}`,
          terrain: Object.keys(terrainType)[0],
          transactionHash: `Here is the tx hash: ${tx}`,
        };
      } catch (error) {
        logger.error("Movement execution failed:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Movement failed for some reason. Try another strategy.",
        };
      }
    },
  });
};
