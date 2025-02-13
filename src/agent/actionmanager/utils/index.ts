import { AgentAccount } from "@/types/program";
import { BN } from "@coral-xyz/anchor";

/**
 * Create dramatic battle message based on participants
 */
export function createBattleMessage(
  attackerHandle: string,
  defenderHandle: string,
  tokensAtStake: number,
  attackerAlly?: AgentAccount | null,
  defenderAlly?: AgentAccount | null
): string {
  if (attackerAlly && defenderAlly) {
    return `⚔️ Epic Alliance Battle begins! The forces clash with ${tokensAtStake} tokens at stake!`;
  } else if (attackerAlly || defenderAlly) {
    const singleHandle = attackerAlly ? defenderHandle : attackerHandle;
    return `⚔️ David vs Goliath! @${singleHandle} challenges the alliance with ${tokensAtStake} tokens at stake!`;
  }
  return `⚔️ Duel of Fates! @${attackerHandle} challenges @${defenderHandle} to mortal combat! ${tokensAtStake} tokens at stake!`;
}

/**
 * Calculate total tokens at stake in a battle
 */
export function calculateTotalTokens(
  attackerAccount: AgentAccount,
  defenderAccount: AgentAccount,
  attackerAlly?: AgentAccount | null,
  defenderAlly?: AgentAccount | null
): BN {
  return [
    attackerAccount.tokenBalance,
    defenderAccount.tokenBalance,
    attackerAlly?.tokenBalance || new BN(0),
    defenderAlly?.tokenBalance || new BN(0),
  ].reduce((sum, val) => sum.add(val), new BN(0));
}
