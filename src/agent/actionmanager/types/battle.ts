import { BattleType } from "@prisma/client";

export interface BattleMetadata {
  id: string;
  battleType: BattleType;
  tokensAtStake: number;
  timestamp: string;
  attackerHandle: string;
  defenderHandle: string;
}
