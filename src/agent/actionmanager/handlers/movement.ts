import { ActionContext, ActionResult, MoveAction } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { gameConfig } from "@/config/env";
import { ActionHandler } from "../types";

export class MovementHandler implements ActionHandler<MoveAction> {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(ctx: ActionContext, action: MoveAction): Promise<ActionResult> {
    try {
      console.info(
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

      // Execute movement onchain
      const tx = await this.program.methods
        .moveAgent(action.position.x, action.position.y, {
          [mapTile.terrainType]: {},
        })
        .accountsStrict({
          agent: agentPda,
          game: gamePda,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Update database in transaction
      await this.prisma.$transaction([
        // Update agent position
        this.prisma.agent.update({
          where: { id: ctx.agentId },
          data: { mapTileId: mapTile.id },
        }),
        // Create cooldown
        this.prisma.coolDown.create({
          data: {
            type: "Move",
            endsAt: new Date(
              Date.now() +
                (mapTile.terrainType === "mountain"
                  ? gameConfig.mechanics.cooldowns.movement * 2
                  : gameConfig.mechanics.cooldowns.movement) *
                  1000
            ),
            cooledAgentId: ctx.agentId,
            gameId: ctx.gameId,
          },
        }),
        // Create movement event
        this.prisma.gameEvent.create({
          data: {
            eventType: "MOVE",
            initiatorId: ctx.agentId.toString(),
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
            },
          },
        }),
      ]);

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error(`Movement failed for agent ${ctx.agentId}`, { error });
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
