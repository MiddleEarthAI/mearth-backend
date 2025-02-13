import { ActionContext, ActionResult, MoveAction } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { gameConfig } from "@/config/env";
import { ActionHandler } from "../types";
import { logger } from "@/utils/logger";

export class MovementHandler implements ActionHandler<MoveAction> {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(ctx: ActionContext, action: MoveAction): Promise<ActionResult> {
    const timestamp = Date.now();
    try {
      logger.info(
        `Agent ${ctx.agentId} moving to (${action.position.x}, ${action.position.y})`
      );

      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [agentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );

      // Get agent with profile
      const agent = await this.prisma.agent.findUnique({
        where: { id: ctx.agentId },
        include: { profile: true },
      });

      if (!agent) {
        throw new Error("Agent not found");
      }

      const mapTile = await this.prisma.mapTile.findUnique({
        where: { x_y: { x: action.position.x, y: action.position.y } },
      });

      if (!mapTile) {
        throw new Error("Invalid map tile");
      }

      // Perform all operations in a single transaction
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Step 1: Update agent position
          const updatedAgent = await prisma.agent.update({
            where: { id: ctx.agentId },
            data: {
              mapTileId: mapTile.id,
            },
          });

          // Step 2: Create cooldown
          const cooldown = await prisma.coolDown.create({
            data: {
              type: "Move",
              endsAt: new Date(
                timestamp +
                  (mapTile.terrainType === "mountain"
                    ? gameConfig.mechanics.cooldowns.movement * 2
                    : gameConfig.mechanics.cooldowns.movement) *
                    1000
              ),
              cooledAgentId: ctx.agentId,
              gameId: ctx.gameId,
            },
          });

          // Step 3: Create movement event
          const event = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "MOVE",
              initiatorId: ctx.agentId,
              message: `@${agent.profile.xHandle} ventures ${
                mapTile.terrainType === "mountain"
                  ? "into treacherous mountains"
                  : mapTile.terrainType === "river"
                  ? "across rushing waters"
                  : "across the plains"
              } at (${action.position.x}, ${action.position.y})`,
              metadata: {
                terrain: mapTile.terrainType,
                position: { x: action.position.x, y: action.position.y },
                agentHandle: agent.profile.xHandle,
                // transactionHash: tx,
                timestamp: new Date(timestamp).toISOString(),
              },
            },
          });

          // Step 4: Execute onchain movement
          let tx: string;
          try {
            tx = await this.program.methods
              .moveAgent(action.position.x, action.position.y, {
                [mapTile.terrainType]: {},
              })
              .accountsStrict({
                agent: agentPda,
                game: gamePda,
                authority: this.program.provider.publicKey,
              })
              .rpc();
          } catch (error) {
            // If onchain operation fails, log and throw to trigger rollback
            logger.error("Onchain movement failed", {
              error,
              agentId: ctx.agentId,
              position: action.position,
            });
            throw error;
          }

          return { agent: updatedAgent, cooldown, event, tx };
        },
        {
          maxWait: 10000, // 10s max wait time
          timeout: 30000, // 30s timeout
        }
      );

      logger.info("Movement completed successfully", {
        agentId: ctx.agentId,
        position: action.position,
        tx: result.tx,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      logger.error(`Movement failed for agent ${ctx.agentId}`, { error });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "MOVE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }
}
