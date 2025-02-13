import { BN } from "@coral-xyz/anchor";
import { AgentAccount } from "@/types/program";

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
