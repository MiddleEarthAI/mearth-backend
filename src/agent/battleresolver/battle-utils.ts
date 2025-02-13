import { BattleGroup, BattleOutcome, BattleParticipant } from "./types/battle";
import { AgentAccount } from "@/types/program";
import { generateBattleId } from "@/utils/battle";
import { gameConfig } from "@/config/env";
import { logger } from "@/utils/logger";

/**
 * Convert an agent account to a battle participant
 */
export function toBattleParticipant(agent: AgentAccount): BattleParticipant {
  return {
    agent: {
      id: agent.id.toString(),
      onchainId: agent.id,
      authority: agent.authority,
    },
    agentAccount: agent,
    tokenBalance: agent.tokenBalance.toNumber(),
  };
}

/**
 * Calculate battle outcome with improved randomness and balance
 */
export function calculateBattleOutcome(
  sideA: BattleParticipant[],
  sideB: BattleParticipant[]
): BattleOutcome {
  // Calculate total power for each side
  const calculatePower = (side: BattleParticipant[]) =>
    side.reduce((sum, p) => sum + p.tokenBalance, 0);

  const sideAPower = calculatePower(sideA);
  const sideBPower = calculatePower(sideB);
  const totalPower = sideAPower + sideBPower;

  // Calculate win probability with power ratio and randomness
  const baseProbability = totalPower > 0 ? sideAPower / totalPower : 0.5;
  const randomFactor = Math.random() * 0.3; // 30% random factor
  const finalProbability = baseProbability * 0.7 + randomFactor;

  // Calculate loss percentage based on power difference
  const powerDiff = Math.abs(baseProbability - 0.5);
  const baseLoss = 20; // Minimum 20% loss
  const maxAdditionalLoss = 20; // Up to additional 20% based on power difference
  const percentLoss = Math.floor(baseLoss + powerDiff * maxAdditionalLoss);

  return {
    sideAWins: finalProbability > 0.5,
    percentLoss: Math.min(percentLoss, 50), // Cap at 50%
  };
}

/**
 * Group agents into their respective battles
 */
export function organizeBattles(
  agents: AgentAccount[],
  gameId: number
): BattleGroup[] {
  const battles: BattleGroup[] = [];
  const battleMap = new Map<string, AgentAccount[]>();

  try {
    // Group agents by battle start time
    for (const agent of agents) {
      if (agent.currentBattleStart) {
        const battleKey = agent.currentBattleStart.toString();
        const group = battleMap.get(battleKey) || [];
        group.push(agent);
        battleMap.set(battleKey, group);
      }
    }

    // Process each battle group
    for (const [startTime, battleAgents] of battleMap) {
      const processedAgents = new Set<string>();
      const sideA: BattleParticipant[] = [];
      const sideB: BattleParticipant[] = [];

      // Helper to find and add allies
      const addAllies = (agent: AgentAccount, side: BattleParticipant[]) => {
        // Add direct alliance
        if (agent.allianceWith) {
          const ally = battleAgents.find(
            (a) =>
              a.authority.equals(agent.allianceWith!) &&
              !processedAgents.has(a.id.toString())
          );
          if (ally) {
            side.push(toBattleParticipant(ally));
            processedAgents.add(ally.id.toString());
          }
        }

        // Add agents allied with current agent
        battleAgents
          .filter(
            (a) =>
              a.allianceWith?.equals(agent.authority) &&
              !processedAgents.has(a.id.toString())
          )
          .forEach((ally) => {
            side.push(toBattleParticipant(ally));
            processedAgents.add(ally.id.toString());
          });
      };

      // Process each agent in the battle
      for (const agent of battleAgents) {
        if (!processedAgents.has(agent.id.toString())) {
          const side = sideA.length === 0 ? sideA : sideB;
          side.push(toBattleParticipant(agent));
          processedAgents.add(agent.id.toString());
          addAllies(agent, side);
        }
      }

      // Only create valid battle groups
      if (sideA.length > 0 && sideB.length > 0) {
        const battleId = generateBattleId(battleAgents, startTime, gameId);
        const type = determineBattleType(sideA.length, sideB.length);

        battles.push({
          id: battleId,
          type,
          sideA,
          sideB,
          startTime: parseInt(startTime),
          cooldownDuration: gameConfig.mechanics.cooldowns.battle,
        });
      }
    }

    logger.info("Battle groups organized successfully", {
      totalBattles: battles.length,
      gameId,
    });

    return battles;
  } catch (error) {
    logger.error("Failed to organize battles", { error, gameId });
    throw error;
  }
}

/**
 * Determine battle type based on participant count
 */
function determineBattleType(
  sideACount: number,
  sideBCount: number
): BattleGroup["type"] {
  if (sideACount === 1 && sideBCount === 1) return "Simple";
  if (sideACount === 2 && sideBCount === 2) return "AllianceVsAlliance";
  return "AgentVsAlliance";
}
