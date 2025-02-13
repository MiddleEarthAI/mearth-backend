import {
  ActionContext,
  FormAllianceAction,
  BreakAllianceAction,
  ActionResult,
} from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { gameConfig } from "@/config/env";
import { ActionHandler } from "../types";
import { logger } from "@/utils/logger";

export class AllianceHandler
  implements ActionHandler<FormAllianceAction | BreakAllianceAction>
{
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  private async handleFormAlliance(
    ctx: ActionContext,
    action: FormAllianceAction
  ): Promise<ActionResult> {
    const timestamp = Date.now();
    try {
      console.info(
        `Agent ${ctx.agentId} forming alliance with ${action.targetId}`
      );

      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [agentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [targetAgentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      // Get agents with profiles
      const [initiator, target] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: ctx.gameId,
            },
          },
          include: { profile: true },
        }),
      ]);

      if (!initiator || !target) {
        throw new Error("Agent not found");
      }

      // Perform all operations in a single transaction
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Step 1: Create alliance record
          const alliance = await prisma.alliance.create({
            data: {
              status: "Active",
              initiatorId: ctx.agentId,
              joinerId: target.id,
              gameId: ctx.gameId,
            },
          });

          // Step 2: Create cooldown
          const cooldown = await prisma.coolDown.create({
            data: {
              type: "Alliance",
              endsAt: new Date(
                timestamp + gameConfig.mechanics.cooldowns.newAlliance * 1000 // convert to ms
              ),
              cooledAgentId: ctx.agentId,
              gameId: ctx.gameId,
            },
          });

          // Step 5: Create alliance event
          const event = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "ALLIANCE_FORM",
              initiatorId: ctx.agentId,
              targetId: target.id,
              message: `@${initiator.profile.xHandle} forms an alliance with @${target.profile.xHandle}`,
              metadata: {
                toJSON: () => ({
                  initiatorHandle: initiator.profile.xHandle,
                  targetHandle: target.profile.xHandle,
                  // transactionHash: tx,
                  timestamp: new Date(timestamp).toISOString(),
                }),
              },
            },
          });

          // Step 3: Execute onchain alliance formation
          let tx: string;
          try {
            tx = await this.program.methods
              .formAlliance()
              .accountsStrict({
                initiator: agentPda,
                targetAgent: targetAgentPda,
                game: gamePda,
                authority: this.program.provider.publicKey,
              })
              .rpc();
          } catch (error) {
            // If onchain operation fails, log and throw to trigger rollback
            console.error("Onchain alliance formation failed", {
              error,
              initiatorId: ctx.agentId,
              targetId: action.targetId,
            });
            throw error;
          }

          return { alliance, cooldown, event, tx };
        },
        {
          maxWait: 10000, // 10s max wait time
          timeout: 30000, // 30s timeout
        }
      );

      console.info("Alliance formation completed successfully", {
        initiatorId: ctx.agentId,
        targetId: action.targetId,
        tx: result.tx,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error(`Alliance formation failed for agent ${ctx.agentId}`, {
        error,
      });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "FORM_ALLIANCE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  private async handleBreakAlliance(
    ctx: ActionContext,
    action: BreakAllianceAction
  ): Promise<ActionResult> {
    const timestamp = Date.now();
    try {
      console.info(
        `Agent ${ctx.agentId} breaking alliance with ${action.targetId}`
      );

      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [agentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [targetAgentPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      // Get agents with profiles and existing alliance
      const [initiator, target] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: ctx.gameId,
            },
          },
          include: { profile: true },
        }),
      ]);

      if (!initiator || !target) {
        throw new Error("Agent not found");
      }

      const existingAlliance = await this.prisma.alliance.findFirst({
        where: {
          OR: [
            {
              initiatorId: ctx.agentId,
              joinerId: target.id,
            },
            {
              initiatorId: target.id,
              joinerId: ctx.agentId,
            },
          ],
          status: "Active",
        },
      });

      if (!existingAlliance) {
        throw new Error("No active alliance found between agents");
      }

      // Perform all operations in a single transaction
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Step 1: Update alliance status
          const updatedAlliance = await prisma.alliance.update({
            where: { id: existingAlliance.id },
            data: { status: "Broken" },
          });

          // Step 2: Create cooldown
          const cooldown = await prisma.coolDown.create({
            data: {
              type: "Alliance",
              endsAt: new Date(
                timestamp + gameConfig.mechanics.cooldowns.newAlliance * 1000
              ),
              cooledAgentId: ctx.agentId,
              gameId: ctx.gameId,
            },
          });

          // Step 4: Create alliance break event
          const event = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "ALLIANCE_BREAK",
              initiatorId: ctx.agentId,
              targetId: target.id,
              message: `@${initiator.profile.xHandle} breaks their alliance with @${target.profile.xHandle}`,
              metadata: {
                toJSON: () => ({
                  initiatorHandle: initiator.profile.xHandle,
                  targetHandle: target.profile.xHandle,
                  // transactionHash: tx,
                  timestamp: new Date(timestamp).toISOString(),
                }),
              },
            },
          });

          // Step 3: Execute onchain alliance break
          let tx: string;
          try {
            tx = await this.program.methods
              .breakAlliance()
              .accountsStrict({
                initiator: agentPda,
                targetAgent: targetAgentPda,
                game: gamePda,
                authority: this.program.provider.publicKey,
              })
              .rpc();
          } catch (error) {
            // If onchain operation fails, log and throw to trigger rollback
            console.error("Onchain alliance break failed", {
              error,
              initiatorId: ctx.agentId,
              targetId: action.targetId,
            });
            throw error;
          }

          return { alliance: updatedAlliance, cooldown, event, tx };
        },
        {
          maxWait: 10000, // 10s max wait time
          timeout: 30000, // 30s timeout
        }
      );

      console.info("Alliance break completed successfully", {
        initiatorId: ctx.agentId,
        targetId: action.targetId,
        tx: result.tx,
      });

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error(`Alliance break failed for agent ${ctx.agentId}`, {
        error,
      });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "BREAK_ALLIANCE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  async handle(
    ctx: ActionContext,
    action: FormAllianceAction | BreakAllianceAction
  ): Promise<ActionResult> {
    if (action.type === "FORM_ALLIANCE") {
      return this.handleFormAlliance(ctx, action);
    } else {
      return this.handleBreakAlliance(ctx, action);
    }
  }
}
