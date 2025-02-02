import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { logger } from "@/utils/logger";

import { BATTLE_COOLDOWN } from "@/constants";

export enum BattleOutcome {
  Victory = "Victory",
  Defeat = "Defeat",
}

export enum BattleType {
  Simple = "Simple",
  AgentVsAlliance = "AgentVsAlliance",
  AllianceVsAlliance = "AllianceVsAlliance",
}

/**
 * Tool for initiating and managing battles between agents with cooldown periods
 */
export const battleTool = (
  agentId: number,
  agentDbId: string,
  gameId: number,
  gameDbId: string,

  currentAgentXhandle: string
) =>
  tool({
    description: `Battle tool/action for engaging in combat with other agents in Middle Earth.
Features:
- Initiate battles (Simple, Agent vs Alliance, Alliance vs Alliance)
- Enforce cooldown periods between battles (1 hour)
`,
    parameters: z.object({
      targetAgentXHandle: z
        .string()
        .describe(
          "Twitter handle of the agent you want to battle with. make sure they are close enough for your reach. Available agents: @scootlesAI | @purrlockpawsAI | @wanderleafAI | @sirgullihopAI "
        ),
    }),

    execute: async ({ targetAgentXHandle }) => {
      try {
        const targetAgent = await prisma.agent.findFirst({
          where: {
            gameId: gameDbId,
            agentProfile: {
              xHandle: targetAgentXHandle,
            },
            NOT: {
              agentId: agentId,
            },
          },
          include: {
            agentProfile: true,
          },
        });
        const agent = await prisma.agent.findUnique({
          where: {
            id: agentDbId,
          },
        });
        if (!agent || !targetAgent) {
          return {
            success: false,
            message: "Agent not found",
          };
        }

        // Get program and PDAs
        const program = await getProgramWithWallet();

        const [gamePda] = getGamePDA(program.programId, gameId);

        const [attackerPda] = getAgentPDA(program.programId, gamePda, agentId);

        const [defenderPda] = getAgentPDA(program.programId, gamePda, agentId);

        // Fetch on-chain accounts
        const attackerAccount = await program.account.agent.fetch(attackerPda);
        const defenderAccount = await program.account.agent.fetch(defenderPda);

        if (!attackerAccount || !defenderAccount)
          return {
            success: false,
            message:
              "Agent not found on chain. You can not battle agents that are dead or not in the game.",
          };

        if (attackerAccount.currentBattleStart) {
          return {
            success: false,
            message:
              "You are already in a battle. You can not go into another battle while in a battle.",
          };
        }

        if (defenderAccount.currentBattleStart) {
          return {
            success: false,
            message: `The agent (@${targetAgentXHandle}) you are trying to battle is already in a battle. You can not go into another battle while in a battle.`,
          };
        }
        if (attackerAccount.lastBattle + BATTLE_COOLDOWN * 1000 > Date.now()) {
          return {
            success: false,
            message: `Battle cooldown is still active. You must wait ${
              BATTLE_COOLDOWN - (Date.now() - attackerAccount.lastBattle) / 1000
            } seconds. Expires at ${new Date(
              attackerAccount.lastBattle + BATTLE_COOLDOWN * 1000
            ).toISOString()}`,
          };
        }

        if (defenderAccount.lastBattle + BATTLE_COOLDOWN * 1000 > Date.now()) {
          return {
            success: false,
            message: `Battle cooldown is still active. You must wait ${
              BATTLE_COOLDOWN - (Date.now() - defenderAccount.lastBattle) / 1000
            } seconds. Expires at ${new Date(
              defenderAccount.lastBattle + BATTLE_COOLDOWN * 1000
            ).toISOString()}`,
          };
        }

        // Determine battle type and start battle
        if (attackerAccount.allianceWith && defenderAccount.allianceWith) {
          const attackerAlly = await program.account.agent.fetch(
            attackerAccount.allianceWith
          );
          const defenderAlly = await program.account.agent.fetch(
            defenderAccount.allianceWith
          );
          // Get PDAs
          const [attackerAllyPda] = getAgentPDA(
            program.programId,
            gamePda,
            new BN(attackerAlly.id)
          );
          const [defenderAllyPda] = getAgentPDA(
            program.programId,
            gamePda,
            new BN(defenderAlly.id)
          );

          const tx = await program.methods
            .startBattleAlliances()
            .accounts({
              leaderA: attackerAllyPda,
              partnerA: attackerPda,
              leaderB: defenderAllyPda,
              partnerB: defenderPda,
            })
            .rpc();

          await prisma.battle.create({
            data: {
              gameId: gameDbId,
              agentId: agentDbId,
              opponentId: targetAgent?.id,
              outcome: BattleOutcome.Victory,
              probability: 0,
              type: BattleType.AllianceVsAlliance,
              resolutionTime: new Date(Date.now() + BATTLE_COOLDOWN * 1000),
              startTime: new Date(),
            },
          });

          return {
            success: true,
            message: "Battle started successfully. Battle ID: " + tx,
            transactionHash: tx,
          };
        }

        if (attackerAccount.allianceWith && !defenderAccount.allianceWith) {
          const attackerAlly = await program.account.agent.fetch(
            attackerAccount.allianceWith
          );

          const [attackerAllyPda] = getAgentPDA(
            program.programId,
            gamePda,
            new BN(attackerAlly.id)
          );

          const tx = await program.methods
            .startBattleAgentVsAlliance()
            .accounts({
              attacker: attackerPda,
              allianceLeader: attackerAllyPda,
              alliancePartner: defenderPda,
            })
            .rpc();

          await prisma.battle.create({
            data: {
              gameId: gameDbId,
              agentId: agentDbId,
              opponentId: targetAgent?.id,
              outcome: BattleOutcome.Victory,
              probability: 0,
              resolutionTime: new Date(Date.now() + BATTLE_COOLDOWN * 1000),
              startTime: new Date(),
              type: BattleType.AgentVsAlliance,
            },
          });

          return {
            success: true,
            message: `Battle started successfully. Battle ID: ${tx}. Battle Info: ${attackerAlly.id} vs ${defenderAccount.id} `,
          };
        }

        if (defenderAccount.allianceWith && !attackerAccount.allianceWith) {
          const defenderAlly = await program.account.agent.fetch(
            defenderAccount.allianceWith
          );

          const [defenderAllyPda] = getAgentPDA(
            program.programId,
            gamePda,
            new BN(defenderAlly.id)
          );

          const tx = await program.methods
            .startBattleAgentVsAlliance()
            .accounts({
              attacker: defenderPda,
              allianceLeader: defenderAllyPda,
              alliancePartner: attackerPda,
            })
            .rpc();
        }

        await prisma.battle.create({
          data: {
            gameId: gameDbId,
            agentId: agentDbId,
            opponentId: targetAgent?.id,
            outcome: BattleOutcome.Victory,
            probability: 0,
            startTime: new Date(),
            resolutionTime: new Date(Date.now() + BATTLE_COOLDOWN * 1000),
            type: BattleType.AgentVsAlliance,
          },
        });

        if (!attackerAccount.allianceWith && !defenderAccount.allianceWith) {
          const tx = await program.methods
            .startBattleSimple()
            .accounts({
              winner: attackerPda,
              loser: defenderPda,
            })
            .rpc();

          await prisma.battle.create({
            data: {
              gameId: gameDbId,
              agentId: agentDbId,
              opponentId: targetAgent?.id,
              outcome: BattleOutcome.Victory,
              probability: 0,
              startTime: new Date(),
              resolutionTime: new Date(Date.now() + BATTLE_COOLDOWN * 1000),
              type: BattleType.Simple,
            },
          });

          return {
            success: true,
            message: "Battle started successfully. Battle ID: " + tx,
            transactionHash: tx,
          };
        }

        await prisma.agent.update({
          where: {
            id: agentDbId,
          },
          data: {
            state: {
              update: {
                lastActionType: "battle",
                lastActionTime: new Date(),
              },
            },
          },
        });

        return {
          success: false,
          message: "You can not battle at this time. Please try again later.",
        };
      } catch (error) {
        logger.error("Battle execution failed:", error);
        return {
          success: false,
          message: "Battle execution failed",
        };
      }
    },
  });
