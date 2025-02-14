import { AgentAccount } from "@/types/program";

interface BattleSide {
  agent: AgentAccount;
  ally: AgentAccount | null;
}

interface BattleOutcome {
  winner: "sideA" | "sideB";
  percentageLost: number;
  totalTokensAtStake: number;
  agentsToDie: number[];
}

/**
 * Calculate the outcome of a battle between two participants
 * If total tokens is zero, uses agent and ally count as a fallback mechanism
 */
export function calculateBattleOutcome(
  sideA: BattleSide,
  sideB: BattleSide
): BattleOutcome {
  // Calculate total tokens for each side
  const sideATokens =
    sideA.agent.tokenBalance + (sideA.ally?.tokenBalance ?? 0);
  const sideBTokens =
    sideB.agent.tokenBalance + (sideB.ally?.tokenBalance ?? 0);
  const totalTokens = sideATokens + sideBTokens;

  let sideAWins: boolean;

  if (totalTokens === 0) {
    // Use number of agents as fallback when no tokens
    const sideACount = sideA.ally ? 2 : 1;
    const sideBCount = sideB.ally ? 2 : 1;
    const totalCount = sideACount + sideBCount;

    // Calculate probability based on agent count
    const sideAProbability = sideACount / totalCount;
    const rand = Math.random();
    sideAWins = rand < sideAProbability;
  } else {
    // Calculate winning probabilities based on tokens
    const sideAProbability = sideATokens / totalTokens;
    const rand = Math.random();
    sideAWins = rand < sideAProbability;
  }

  // Generate loss percentage (20-30%)
  const percentageLost = Math.floor(Math.random() * 11) + 20;

  // Check for agentsToDie (5% chance for losing side)
  const agentsToDie: number[] = [];
  const losingSide = sideAWins ? sideB : sideA;

  // Check death for main agent
  if (Math.random() < 0.05) {
    agentsToDie.push(Number(losingSide.agent.id));
  }

  // Check death for ally if exists
  if (losingSide.ally && Math.random() < 0.05) {
    agentsToDie.push(Number(losingSide.ally.id));
  }

  return {
    winner: sideAWins ? "sideA" : "sideB",
    percentageLost,
    totalTokensAtStake: totalTokens,
    agentsToDie,
  };
}

// /**
//  * Create a dramatic battle message
//  */
// export function createBattleMessage(
//   sideA: BattleSide,
//   sideB: BattleSide,
//   outcome: BattleOutcome
// ): string {
//   const winner =
//     outcome.winner === "sideA"
//       ? sideA.agent.profile.xHandle
//       : sideB.agent.profile.xHandle;
//   const loser =
//     outcome.winner === "sideA"
//       ? sideB.agent.profile.xHandle
//       : sideA.agent.profile.xHandle;

//   let message = `⚔️ Epic battle concluded! @${winner} emerges victorious over @${loser}! ${outcome.percentageLost}% of ${outcome.totalTokensAtStake} tokens lost in the clash!`;

//   if (outcome.agentsToDie.length > 0) {
//     message += ` 💀 ${
//       outcome.agentsToDie.length === 1 ? "A warrior has" : "Warriors have"
//     } fallen in battle!`;
//   }

//   return message;
// }
