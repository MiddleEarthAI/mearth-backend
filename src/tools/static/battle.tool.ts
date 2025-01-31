import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";

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
export const battleTool = (agentId: number, gameId: number) =>
  tool({
    description: `Battle tool/action for engaging in combat with other agents in Middle Earth.
Features:
- Initiate battles (Simple, Agent vs Alliance, Alliance vs Alliance)
- Enforce cooldown periods between battles (1 hour)
- Calculate outcomes based on staked tokens
- Transfer tokens between winners/losers
- Track battle history`,

    parameters: z.object({
      defenderXHandle: z
        .string()
        .describe("Twitter handle of the agent to battle"),
    }),

    execute: async ({ defenderXHandle }) => {
      const gameService = getGameService();
      const gameStateService = getGameStateService();

      try {
        // Get agent states
        const [attackerDb, defenderDb] = await Promise.all([
          prisma.agent.findUnique({
            where: { agentId },
            include: {
              location: true,
              tokenomics: true,
              battles: {
                orderBy: { timestamp: "desc" },
                take: 1,
              },
            },
          }),
          prisma.agent.findUnique({
            where: { xHandle: defenderXHandle },
            include: {
              location: true,
              tokenomics: true,
            },
          }),
        ]);

        if (!attackerDb || !defenderDb) {
          return {
            message: "The agent you are trying to battle is not available",
          };
        }

        const agent = await gameStateService.getAgent(agentId, gameId);
        const defender = await gameStateService.getAgent(
          defenderDb.agentId,
          gameId
        );

        const lastBattle = agent?.lastBattle;
        if (lastBattle) {
          const cooldownPeriod = 3600;
          const timeSinceLastBattle =
            Math.floor(Date.now() / 1000) -
            Math.floor(lastBattle.timestamp.getTime() / 1000);

          if (timeSinceLastBattle < cooldownPeriod) {
            return {
              message: `Battle cooldown active. Please wait ${
                cooldownPeriod - timeSinceLastBattle
              } seconds. expires at ${new Date(
                lastBattle.timestamp.getTime() + cooldownPeriod * 1000
              ).toISOString()}`,
            };
          }
        }

        if (agent?.allianceWith && defender?.allianceWith) {
          gameService.startBattleAlliances(
            gameId,
            agent.id,
            agent.allianceWith,
            defender.id,
            defender.allianceWith
          );
        } else if (!agent?.allianceWith && defender?.allianceWith) {
          gameService.startBattleAgentVsAlliance(
            gameId,
            agent?.id,
            defender.id,
            defender.allianceWith
          );
        } else if (!agent?.allianceWith && !defender?.allianceWith) {
          gameService.startBattle(gameId, agent?.id, defender?.id);
        }

        // Check cooldown period (3600 seconds = 1 hour)

        // Validate battle conditions
        // if (agent?.tokenBalance! < stake) {
        //   throw new Error("Insufficient tokens staked for battle");
        // }

        // Start battle based on type
        const battleData = {
          attackerDb: { agentId: attackerDb.agentId },
          defenderDb: { agentId: defenderDb.agentId },
          gameId,
          type: BattleType.Simple,
          stake: agent?.tokenBalance!,
        };

        await gameService.startBattle(gameId, agentId, defenderDb.agentId);

        // Calculate battle outcome
        const outcome = calculateBattleOutcome(attackerDb, defenderDb);

        // Record battle result
        // const battle = await prisma.battle.create({
        //   data: {
        //     outcome: outcome.result,
        //     agent: { connect: { agentId: attackerDb.agentId } },
        //     opponent: { connect: { agentId: defenderDb.agentId } },
        //     game: { connect: { gameId } },
        //     tokensGained:
        //       outcome.result === BattleOutcome.Victory ? stake * 0.2 : 0,
        //     tokensLost:
        //       outcome.result === BattleOutcome.Defeat ? stake * 0.2 : 0,
        //     probability: 0.8 + Math.random() * 0.4,
        //   },
        // });

        return {
          // battleId: battle.id,
          // outcome: outcome.result,
          // tokensGained: battle.tokensGained,
          // tokensLost: battle.tokensLost,
          // explanation: outcome.explanation,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Battle execution failed"
        );
      }
    },
  });

interface BattleOutcomeResult {
  result: BattleOutcome;
  explanation: string;
}

function calculateBattleOutcome(
  attackerDb: any,
  defenderDb: any
): BattleOutcomeResult {
  const attackerStrength = attackerDb.tokenomics?.stakedTokens || 0;
  const defenderStrength = defenderDb.tokenomics?.stakedTokens || 0;

  // Add randomness factor (0.8 to 1.2)
  const randomFactor = 0.8 + Math.random() * 0.4;

  const attackerScore = attackerStrength * randomFactor;
  const defenderScore = defenderStrength;

  if (attackerScore > defenderScore * 1.2) {
    return {
      result: BattleOutcome.Victory,
      explanation: "Overwhelming victory due to superior strength",
    };
  } else if (attackerScore > defenderScore) {
    return {
      result: BattleOutcome.Victory,
      explanation: "Narrow victory in a close battle",
    };
  } else {
    return {
      result: BattleOutcome.Defeat,
      explanation: "Defeat against stronger defensive position",
    };
  }
}
