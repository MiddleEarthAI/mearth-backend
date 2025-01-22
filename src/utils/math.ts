import { Position } from "../types/game";

/**
 * Calculate Euclidean distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

/**
 * Normalize a score to be between 0 and 100
 */
export function normalizeScore(
  score: number,
  min: number,
  max: number
): number {
  return Math.min(100, Math.max(0, ((score - min) / (max - min)) * 100));
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
 * Calculate probability based on token ratio
 */
export function calculateWinProbability(
  attackerTokens: number,
  defenderTokens: number
): number {
  const total = attackerTokens + defenderTokens;
  return (attackerTokens / total) * 100;
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
