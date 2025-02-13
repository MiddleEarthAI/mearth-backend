import { BattleParticipant, BattleOutcome } from "../types/battle";

/**
 * Calculate the outcome of a battle based on token balances
 */
export function calculateBattleOutcome(
  sideA: BattleParticipant[],
  sideB: BattleParticipant[]
): BattleOutcome {
  // Calculate total tokens for each side
  const sideATokens = sideA.reduce(
    (sum, participant) => sum + participant.tokenBalance,
    0
  );
  const sideBTokens = sideB.reduce(
    (sum, participant) => sum + participant.tokenBalance,
    0
  );

  // Calculate winning probability based on token ratio
  const totalTokens = sideATokens + sideBTokens;
  const sideAProbability =
    totalTokens > 0 ? (sideATokens / totalTokens) * 100 : 50;

  // Determine winner based on probability
  const sideAWins = Math.random() * 100 <= sideAProbability;

  // Calculate loss percentage (21-30%)
  const percentLoss = Math.floor(Math.random() * 10) + 21;

  return {
    sideAWins,
    percentLoss,
  };
}
