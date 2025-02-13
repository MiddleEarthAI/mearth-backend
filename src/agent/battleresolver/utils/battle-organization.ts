import { AgentAccount } from "@/types/program";
import { BattleGroup, BattleParticipant } from "../types/battle";
import { gameConfig } from "@/config/env";
import { generateBattleId } from "@/utils/battle";

/**
 * Convert an agent account to a battle participant
 */
function toBattleParticipant(agent: AgentAccount): BattleParticipant {
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
 * Group agents into their respective battles
 */
export function groupAgentsInBattles(
  agents: AgentAccount[],
  gameId: number
): BattleGroup[] {
  const battles: BattleGroup[] = [];
  const battleMap = new Map<string, AgentAccount[]>();

  // First pass: Group agents by their battle start time
  for (const agent of agents) {
    if (agent.currentBattleStart) {
      const battleKey = agent.currentBattleStart.toString();
      if (!battleMap.has(battleKey)) {
        battleMap.set(battleKey, []);
      }
      battleMap.get(battleKey)!.push(agent);
    }
  }

  // Second pass: Process each battle time group
  for (const [startTime, battleAgents] of battleMap) {
    const processedAgents = new Set<string>();
    const sideA: BattleParticipant[] = [];
    const sideB: BattleParticipant[] = [];

    // Process each agent in the current battle
    for (const agent of battleAgents) {
      if (!processedAgents.has(agent.id.toString())) {
        const currentSide = sideA.length === 0 ? sideA : sideB;
        currentSide.push(toBattleParticipant(agent));
        processedAgents.add(agent.id.toString());

        // Check for direct alliance
        if (agent.allianceWith) {
          const directAlly = battleAgents.find((a) =>
            a.authority.equals(agent.allianceWith!)
          );
          if (directAlly && !processedAgents.has(directAlly.id.toString())) {
            currentSide.push(toBattleParticipant(directAlly));
            processedAgents.add(directAlly.id.toString());
          }
        }

        // Check for agents directly allied with the current agent
        const directAllies = battleAgents.filter(
          (a) =>
            a.allianceWith &&
            a.allianceWith.equals(agent.authority) &&
            !processedAgents.has(a.id.toString())
        );

        for (const ally of directAllies) {
          currentSide.push(toBattleParticipant(ally));
          processedAgents.add(ally.id.toString());
        }
      }
    }

    // Generate deterministic battle ID
    const battleId = generateBattleId(battleAgents, startTime, gameId);

    // Determine battle type based on side composition
    const type = determineBattleType(sideA, sideB);

    battles.push({
      id: battleId,
      type,
      sideA,
      sideB,
      startTime: parseInt(startTime),
      cooldownDuration: gameConfig.mechanics.cooldowns.battle,
    });
  }

  return battles;
}

/**
 * Determine the type of battle based on the composition of sides
 */
function determineBattleType(
  sideA: BattleParticipant[],
  sideB: BattleParticipant[]
): BattleGroup["type"] {
  if (sideA.length === 1 && sideB.length === 1) {
    return "Simple";
  } else if (sideA.length === 2 && sideB.length === 2) {
    return "AllianceVsAlliance";
  } else {
    return "AgentVsAlliance";
  }
}
