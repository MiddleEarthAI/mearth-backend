import { Position } from "../types/game";

/**
 * Calculate Euclidean distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a score to be between 0 and 100
 */
export function normalizeScore(
  value: number,
  min: number = 0,
  max: number = 100
): number {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * Calculate weighted average of scores
 */
export function weightedAverage(scores: number[], weights: number[]): number {
  if (scores.length !== weights.length) {
    throw new Error("Scores and weights arrays must have same length");
  }

  const sum = weights.reduce((a, b) => a + b, 0);
  return scores.reduce((acc, score, i) => acc + score * weights[i], 0) / sum;
}

/**
 * Calculate win probability based on token balances
 */
export function calculateWinProbability(
  attackerTokens: number,
  defenderTokens: number
): number {
  const totalTokens = attackerTokens + defenderTokens;
  return totalTokens === 0 ? 0.5 : attackerTokens / totalTokens;
}

/**
 * Calculate optimal movement vector
 */
export function calculateMovementVector(
  current: Position,
  target: Position,
  speed: number
): Position {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return current;

  return {
    x: current.x + (dx / distance) * speed,
    y: current.y + (dy / distance) * speed,
  };
}

/**
 * Calculate optimal token burn amount based on token balances
 */
export function calculateOptimalTokenBurn(
  attackerTokens: number,
  defenderTokens: number
): number {
  // Burn between 31-50% of defender's tokens
  const minBurn = Math.floor(defenderTokens * 0.31);
  const maxBurn = Math.floor(defenderTokens * 0.5);
  return Math.floor(Math.random() * (maxBurn - minBurn + 1)) + minBurn;
}

/**
 * Calculate terrain death risk based on position
 */
export function calculateTerrainRisk(position: Position): number {
  const distance = Math.sqrt(position.x * position.x + position.y * position.y);
  if (distance > 50) return 0.02; // 2% death risk in mountains
  if (distance > 30) return 0.01; // 1% death risk in rivers
  return 0; // No death risk in normal terrain
}
