import { AgentAccount } from "@/types/program";

/**
 * Calculate total tokens at stake in a battle
 */
export function calculateTotalTokens(
  ...accounts: (AgentAccount | null)[]
): number {
  return accounts
    .filter((account): account is AgentAccount => account !== null)
    .reduce((sum, account) => sum + account.tokenBalance, 0);
}

/**
 * Create a dramatic battle initiation message
 */
export function createBattleInitiationMessage(
  attackerHandle: string,
  defenderHandle: string,
  tokensAtStake: number,
  attackerAlly?: AgentAccount | null,
  defenderAlly?: AgentAccount | null
): string {
  if (attackerAlly && defenderAlly) {
    return `⚔️ Alliance War! The forces of @${attackerHandle} and their ally clash with @${defenderHandle}'s alliance! ${tokensAtStake} tokens at stake!`;
  }

  if (attackerAlly) {
    return `⚔️ An alliance led by @${attackerHandle} moves against @${defenderHandle}! ${tokensAtStake} tokens at stake!`;
  }

  if (defenderAlly) {
    return `⚔️ @${attackerHandle} bravely challenges the alliance of @${defenderHandle}! ${tokensAtStake} tokens at stake!`;
  }

  return `⚔️ @${attackerHandle} challenges @${defenderHandle} to battle! ${tokensAtStake} tokens at stake!`;
}
