import { AgentStatus } from "@prisma/client";
import {
  BATTLE_RANGE,
  TOKEN_BURN_MIN,
  TOKEN_BURN_MAX,
  DEATH_CHANCE,
} from "@/constants";
import { calculateDistance } from "./movement";

interface BattleValidationResult {
  success: boolean;
  message: string;
  winProbability?: number;
  tokenBurnAmount?: number;
}

interface CombatantStats {
  id: string;
  name: string;
  status: AgentStatus;
  governanceTokens: number;
  x: number;
  y: number;
}

/**
 * Validates if a battle can occur between two agents
 */
export async function validateBattle(
  attacker: CombatantStats,
  defender: CombatantStats
): Promise<BattleValidationResult> {
  // Check if either agent is defeated
  if (attacker.status === "DEFEATED") {
    return {
      success: false,
      message: "Attacker is defeated and cannot battle",
    };
  }

  if (defender.status === "DEFEATED") {
    return {
      success: false,
      message: "Defender is defeated and cannot be battled",
    };
  }

  // Check if agents have tokens
  if (attacker.governanceTokens <= 0) {
    return {
      success: false,
      message: "Attacker has no governance tokens for battle",
    };
  }

  if (defender.governanceTokens <= 0) {
    return {
      success: false,
      message: "Defender has no governance tokens to battle for",
    };
  }

  // Check distance between agents
  const distance = calculateDistance(
    attacker.x,
    attacker.y,
    defender.x,
    defender.y
  );

  if (distance > BATTLE_RANGE) {
    return {
      success: false,
      message: `Target is out of battle range (${distance.toFixed(
        2
      )} units away, maximum ${BATTLE_RANGE} units)`,
    };
  }

  // Calculate win probability based on token ratio
  const totalTokens = attacker.governanceTokens + defender.governanceTokens;
  const winProbability = attacker.governanceTokens / totalTokens;

  // Calculate potential token burn
  const tokenBurnAmount = Math.floor(
    (defender.governanceTokens *
      (TOKEN_BURN_MIN + Math.random() * (TOKEN_BURN_MAX - TOKEN_BURN_MIN))) /
      100
  );

  return {
    success: true,
    message: "Battle is valid",
    winProbability,
    tokenBurnAmount,
  };
}

/**
 * Calculates battle outcome including token burns and death chance
 */
export function calculateBattleOutcome(
  attackerTokens: number,
  defenderTokens: number
): {
  attackerWon: boolean;
  tokensBurned: number;
  deathOccurred: boolean;
} {
  const totalTokens = attackerTokens + defenderTokens;
  const winProbability = attackerTokens / totalTokens;

  // Determine winner
  const attackerWon = Math.random() < winProbability;

  // Calculate token burn for loser
  const loserTokens = attackerWon ? defenderTokens : attackerTokens;
  const tokensBurned = Math.floor(
    (loserTokens *
      (TOKEN_BURN_MIN + Math.random() * (TOKEN_BURN_MAX - TOKEN_BURN_MIN))) /
      100
  );

  // Check for death (only losers can die)
  const deathOccurred = Math.random() < DEATH_CHANCE;

  return {
    attackerWon,
    tokensBurned,
    deathOccurred,
  };
}
