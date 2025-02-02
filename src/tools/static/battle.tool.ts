import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { GenerateContextStringResult } from "@/agent/Agent";
import { logger } from "@/utils/logger";

import { PublicKey } from "@solana/web3.js";
import {
  resolveSimpleBattle,
  startAgentVsAllianceBattle,
  startAllianceVsAllianceBattle,
  startSimpleBattle,
} from "@/instructionUtils/battle";
import { BATTLE_COOLDOWN } from "@/constants";
import { AgentAccount } from "@/types/program";

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
export const battleTool = (result: GenerateContextStringResult) =>
  tool({
    description: `Battle tool/action for engaging in combat with other agents in Middle Earth.
Features:
- Initiate battles (Simple, Agent vs Alliance, Alliance vs Alliance)
- Enforce cooldown periods between battles (1 hour)
`,
    parameters: z.object({
      targetAgentXHandle: z
        .enum(["scootlesAI", "purrlockpawsAI", "wanderleafAI", "sirgullihopAI"])
        .transform((val) => val.toLowerCase())
        .describe(
          "Twitter handle of the agent you want to battle with. make sure they are close enough for your reach"
        ),
    }),

    execute: async ({ targetAgentXHandle }) => {
      const agent = result.currentAgent;
      const gameId = agent.gameId;
      const agentId = agent.agentId;

      try {
        // Get agent states with relations
        const [attackerDb, defenderDb] = await Promise.all([
          prisma.agent.findUnique({
            where: { agentId_gameId: { agentId, gameId } },
            include: {
              battles: {
                orderBy: { timestamp: "desc" },
                take: 1,
              },
              game: {
                select: {
                  id: true,
                  gameId: true,
                },
              },
            },
          }),
          prisma.agent.findFirst({
            where: {
              AND: [
                { agentId: agentId },
                { gameId: gameId },
                {
                  agentProfile: {
                    xHandle: targetAgentXHandle,
                  },
                },
              ],
            },
            include: {
              battles: {
                orderBy: { timestamp: "desc" },
                take: 1,
              },
            },
          }),
        ]);

        if (!attackerDb || !defenderDb) {
          return {
            success: false,
            message: "The agent you are trying to battle is not available",
          };
        }

        // Get program and PDAs
        const program = await getProgramWithWallet();

        const [gamePda] = getGamePDA(
          program.programId,
          Number(attackerDb.game.gameId)
        );

        const [attackerPda] = getAgentPDA(
          program.programId,
          gamePda,
          new BN(agentId)
        );

        const [defenderPda] = getAgentPDA(
          program.programId,
          gamePda,
          new BN(defenderDb.agentId)
        );

        // Fetch on-chain accounts
        const attackerAccount = await program.account.agent.fetch(attackerPda);
        const defenderAccount = await program.account.agent.fetch(defenderPda);

        if (!attackerAccount || !defenderAccount)
          return {
            success: false,
            message:
              "Agent not found on chain. You can not battle agents that are dead or not in the game.",
          };

        // Check cooldown period
        const lastBattle = attackerAccount.lastBattle; // milliseconds
        if (lastBattle) {
          const timeSinceLastBattle =
            Math.floor(Date.now() / 1000) - Math.floor(lastBattle / 1000); // milliseconds to seconds

          if (timeSinceLastBattle < BATTLE_COOLDOWN) {
            return {
              success: false,
              message: `Battle cooldown is still active. You must wait ${
                BATTLE_COOLDOWN - timeSinceLastBattle
              } seconds. Expires at ${new Date(
                lastBattle.timestamp.getTime() + BATTLE_COOLDOWN * 1000
              ).toISOString()}`,
            };
          }
        }

        let tx: string;
        let battleType: BattleType;

        // Determine battle type and start battle
        if (attackerAccount.allianceWith && defenderAccount.allianceWith) {
          const attackerAlliedAgentAccount = await program.account.agent.fetch(
            attackerAccount.allianceWith
          );
          const defenderAlliedAgentAccount = await program.account.agent.fetch(
            defenderAccount.allianceWith
          );
          if (!attackerAlliedAgentAccount || !defenderAlliedAgentAccount) {
            return {
              success: false,
              message:
                "Allied agent not found on chain. You can not battle agents that are dead or not in the game.",
            };
          }
          const attackerAllyAccount = await program.account.agent.fetch(
            attackerAccount.allianceWith
          );
          const defenderAllyAccount = await program.account.agent.fetch(
            defenderAccount.allianceWith
          );
          // Alliance vs Alliance battle
          battleType = BattleType.AllianceVsAlliance;
          const result = await startAllianceVsAllianceBattle(
            Number(attackerDb.game.gameId),
            agentId,
            attackerAlliedAgentAccount.id,
            defenderDb.agentId,
            defenderAllyAccount.id
          );
          tx = result.tx;
        } else if (
          !attackerAccount.allianceWith &&
          defenderAccount.allianceWith
        ) {
          const defenderAllyAccount = await program.account.agent.fetch(
            defenderAccount.allianceWith
          );
          // Agent vs Alliance battle
          battleType = BattleType.AgentVsAlliance;
          const result = await startAgentVsAllianceBattle(
            Number(attackerDb.game.gameId),
            agentId,
            defenderAccount.id,
            defenderAllyAccount.id
          );
          tx = result.tx;
        } else if (
          attackerAccount.allianceWith &&
          !defenderAccount.allianceWith
        ) {
          const attackerAllyAccount = await program.account.agent.fetch(
            attackerAccount.allianceWith
          );
          // Agent vs Alliance battle
          battleType = BattleType.AgentVsAlliance;
          const result = await startAgentVsAllianceBattle(
            Number(attackerDb.game.gameId),
            agentId,
            defenderAccount.id,
            attackerAllyAccount.id
          );
          tx = result.tx;
        } else {
          // Simple 1v1 battle
          battleType = BattleType.Simple;
          const result = await startSimpleBattle(
            Number(attackerDb.game.gameId),
            agentId,
            defenderAccount.id
          );
          tx = result.tx;
        }

        // Calculate battle outcome
        const outcome = calculateBattleOutcome(
          attackerAccount,
          defenderAccount
        );

        // Record battle in database
        const battle = await prisma.battle.create({
          data: {
            gameId: gameId.toString(),
            type: battleType,

            outcome: outcome.result,

            tokensGained:
              outcome.result === BattleOutcome.Victory
                ? outcome.tokenPercentage.attacker
                : 0,
            tokensLost:
              outcome.result === BattleOutcome.Defeat
                ? outcome.tokenPercentage.defender
                : 0,
            timestamp: new Date(),
            opponentId: defenderDb.id,
            agentId: attackerDb.id,
            startTime: new Date(),
            resolutionTime: new Date(),
            probability: outcome.tokenPercentage.attacker,
          },
        });

        // Resolve battle based on type
        if (battleType === BattleType.Simple) {
          if (!attackerAccount || !defenderAccount) {
            throw new Error("Token accounts not found");
          }

          await resolveSimpleBattle(
            Number(attackerDb.game.gameId),
            agentId,
            defenderDb.agentId,
            outcome.tokenPercentage.attacker,
            new PublicKey(defenderDb.publicKey),
            new PublicKey(attackerAccount.authority),
            new PublicKey(defenderAccount.authority)
          );
        } else if (battleType === BattleType.AgentVsAlliance) {
          // Implement agent vs alliance resolution
          // Add necessary parameters and logic
        } else {
          // Implement alliance vs alliance resolution
          // Add necessary parameters and logic
        }

        return {
          success: true,
          battleId: battle.id,
          outcome: outcome.result,
          tokensGained: battle.tokensGained,
          tokensLost: battle.tokensLost,
          explanation: outcome.explanation,
          transactionHash: tx,
        };
      } catch (error) {
        logger.error("Battle execution failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Battle execution failed"
        );
      }
    },
  });
interface BattleOutcomeResult {
  result: BattleOutcome;
  explanation: string;
  tokenPercentage: {
    attacker: number;
    defender: number;
  };
}

function calculateBattleOutcome(
  attackerAccount: AgentAccount,
  defenderAccount: AgentAccount,
  battleType: BattleType = BattleType.Simple
): BattleOutcomeResult {
  // Fixed 20% token transfer rate as shown in tests
  const TOKEN_TRANSFER_PERCENTAGE = 20;

  // For simple battles, winner always gets 20% of loser's tokens
  if (battleType === BattleType.Simple) {
    const attackerStrength = attackerAccount?.tokenBalance || 0;
    const defenderStrength = defenderAccount?.tokenBalance || 0;

    // Simple comparison of token balances determines winner
    if (attackerStrength > defenderStrength) {
      return {
        result: BattleOutcome.Victory,
        explanation: "Victory - Attacker claims 20% of defender's tokens",
        tokenPercentage: {
          attacker: TOKEN_TRANSFER_PERCENTAGE / 100, // 0.2 for 20%
          defender: TOKEN_TRANSFER_PERCENTAGE / 100,
        },
      };
    } else {
      return {
        result: BattleOutcome.Defeat,
        explanation: "Defeat - Attacker loses 20% of tokens to defender",
        tokenPercentage: {
          attacker: TOKEN_TRANSFER_PERCENTAGE / 100,
          defender: TOKEN_TRANSFER_PERCENTAGE / 100,
        },
      };
    }
  }

  // For alliance battles, same 20% transfer logic applies
  // but distributed among alliance members
  return {
    result: BattleOutcome.Victory,
    explanation: "Alliance battle resolved with 20% token transfer",
    tokenPercentage: {
      attacker: TOKEN_TRANSFER_PERCENTAGE / 100,
      defender: TOKEN_TRANSFER_PERCENTAGE / 100,
    },
  };
}
