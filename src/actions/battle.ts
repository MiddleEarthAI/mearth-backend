import { AgentStatus } from "@prisma/client";
import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/config/prisma";
import { logger } from "@/utils/logger";
import {
  BATTLE_RANGE,
  TOKEN_BURN_MIN,
  TOKEN_BURN_MAX,
  DEATH_CHANCE,
} from "@/constants";
import { calculateDistance } from "./utils";
import { Solana } from "@/deps/solana";

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
async function validateBattle(
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
function calculateBattleOutcome(
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

export const battleTool = async function (agentId: string, solana: Solana) {
  return tool({
    description: `Strategic battle tool for Middle Earth agents:
      - Challenge other agents to battle
      - Risk tokens and status for victory
      - Calculate win probabilities
      - Execute battle outcomes
      Battles are based on token ratios and proximity.`,
    parameters: z.object({
      twitterHandle: z
        .string()
        .describe("Twitter handle of the agent to battle"),
    }),
    execute: async ({ twitterHandle }) => {
      try {
        // Get attacker data
        const attacker = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            wallet: true,
            currentLocation: true,
          },
        });

        if (!attacker) {
          throw new Error("Attacker agent not found");
        }

        // Get defender data
        const defender = await prisma.agent.findUnique({
          where: { twitterHandle },
          include: {
            wallet: true,
            currentLocation: true,
          },
        });

        if (!defender) {
          throw new Error("Defender agent not found");
        }

        // Validate battle
        const validation = await validateBattle(
          {
            id: attacker.id,
            name: attacker.name,
            status: attacker.status,
            governanceTokens: attacker.wallet.governanceTokens,
            x: attacker.currentLocation.x,
            y: attacker.currentLocation.y,
          },
          {
            id: defender.id,
            name: defender.name,
            status: defender.status,
            governanceTokens: defender.wallet.governanceTokens,
            x: defender.currentLocation.x,
            y: defender.currentLocation.y,
          }
        );

        if (!validation.success) {
          return validation;
        }

        // Calculate battle outcome
        const outcome = calculateBattleOutcome(
          attacker.wallet.governanceTokens,
          defender.wallet.governanceTokens
        );

        // Update database with battle results
        const battle = await prisma.$transaction(async (tx) => {
          // Record battle
          const battle = await tx.battle.create({
            data: {
              attacker: { connect: { id: attacker.id } },
              defender: { connect: { id: defender.id } },
              tokensBurned: outcome.tokensBurned,
              attackerWon: outcome.attackerWon,
              deathOccurred: outcome.deathOccurred,
              attackerTokensBefore: attacker.wallet.governanceTokens,
              defenderTokensBefore: defender.wallet.governanceTokens,
            },
            include: {
              attacker: true,
              defender: true,
            },
          });

          // Update loser's tokens and status
          const loser = outcome.attackerWon ? defender : attacker;
          await tx.wallet.update({
            where: { id: loser.wallet.id },
            data: {
              governanceTokens: {
                decrement: outcome.tokensBurned,
              },
            },
          });

          if (outcome.deathOccurred) {
            await tx.agent.update({
              where: { id: loser.id },
              data: {
                status: "DEFEATED",
              },
            });
          }

          return battle;
        });

        return {
          success: true,
          message: `Battle completed: ${
            outcome.attackerWon ? "Victory" : "Defeat"
          }!`,
          battle,
          outcome: {
            ...outcome,
            loser: outcome.attackerWon ? defender.name : attacker.name,
            winner: outcome.attackerWon ? attacker.name : defender.name,
            tokensBurned: outcome.tokensBurned,
          },
        };
      } catch (error) {
        logger.error("Battle error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Battle failed",
        };
      }
    },
  });
};
