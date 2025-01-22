import { AgentDecision, BattleStrategy } from "../types/game";

/**
 * Parse LLM decision response
 */
export function parseDecision(response: string): AgentDecision {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      action: parsed.action,
      target: parsed.target || undefined,
      position: parsed.position || undefined,
      reason: parsed.reason,
      confidence: 70, // Default confidence
      communityAlignment: 50, // Default alignment
    };
  } catch (error) {
    console.error("Failed to parse LLM decision:", error);
    return {
      action: "WAIT",
      reason: "Error processing decision",
      confidence: 0,
      communityAlignment: 0,
    };
  }
}

/**
 * Parse battle strategy response
 */
export function parseBattleStrategy(
  response: string
): Omit<BattleStrategy, "suggestedTokenBurn"> {
  try {
    const lines = response.split("\n");

    const decision = lines
      .find((l) => l.toLowerCase().includes("decision"))
      ?.includes("yes");

    const probability = parseInt(
      lines.find((l) => l.includes("%"))?.match(/\d+/)?.[0] || "0"
    );

    const reason = lines
      .find((l) => l.toLowerCase().includes("reason"))
      ?.split(":")[1]
      ?.trim();

    const riskLevel = lines
      .find((l) => l.toLowerCase().includes("risk level"))
      ?.split(":")[1]
      ?.trim()
      .toLowerCase();

    return {
      shouldFight: decision || false,
      reason: reason || "Strategic decision",
      estimatedSuccess: probability,
    };
  } catch (error) {
    console.error("Failed to parse battle strategy:", error);
    return {
      shouldFight: false,
      reason: "Error processing strategy",
      estimatedSuccess: 0,
    };
  }
}

/**
 * Parse trait adjustments response
 */
export function parseTraitAdjustments(response: string): {
  adjustedAggressiveness: number;
  adjustedAlliancePropensity: number;
  reason: string;
} {
  try {
    const lines = response.split("\n");

    const aggressiveness = parseInt(
      lines
        .find((l) => l.toLowerCase().includes("aggressiveness"))
        ?.match(/\d+/)?.[0] || "0"
    );

    const alliancePropensity = parseInt(
      lines
        .find((l) => l.toLowerCase().includes("alliance"))
        ?.match(/\d+/)?.[0] || "0"
    );

    const reason = lines
      .find((l) => l.toLowerCase().includes("reason"))
      ?.split(":")[1]
      ?.trim();

    return {
      adjustedAggressiveness: Math.min(100, Math.max(0, aggressiveness)),
      adjustedAlliancePropensity: Math.min(
        100,
        Math.max(0, alliancePropensity)
      ),
      reason: reason || "Community influence",
    };
  } catch (error) {
    console.error("Failed to parse trait adjustments:", error);
    return {
      adjustedAggressiveness: 0,
      adjustedAlliancePropensity: 0,
      reason: "Error processing adjustments",
    };
  }
}

/**
 * Extract structured data from unstructured text
 */
export function extractStructuredData<T extends Record<string, unknown>>(
  text: string,
  patterns: { [K in keyof T]: RegExp }
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, pattern] of Object.entries(patterns) as [
    keyof T,
    RegExp,
  ][]) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result[key] = match[1] as T[keyof T];
    }
  }

  return result;
}
