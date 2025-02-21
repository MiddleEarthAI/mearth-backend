import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import {
  getAgentAuthorityKeypair,
  getMiddleEarthAiAuthorityWallet,
} from "@/utils/program";
import { AgentAccount } from "@/types/program";
import { gameConfig } from "@/config/env";

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

export class BattleHandler {
  constructor(
    private readonly program: MearthProgram,
    private readonly prisma: PrismaClient
  ) {}

  async handle(
    ctx: ActionContext,
    action: BattleAction
  ): Promise<ActionResult> {
    try {
      console.info(
        `Agent ${ctx.agentId} initiating battle with ${action.targetId}`,
        { ctx, action }
      );

      // Get PDAs
      const [gamePda] = getGamePDA(this.program.programId, ctx.gameOnchainId);
      const [attackerPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        ctx.agentOnchainId
      );
      const [defenderPda] = getAgentPDA(
        this.program.programId,
        gamePda,
        action.targetId
      );

      const [attackerAccountData, defenderAccountData] = await Promise.all([
        this.program.account.agent.fetch(attackerPda),
        this.program.account.agent.fetch(defenderPda),
      ]);

      const [attackerAllyAccount, defenderAllyAccount] = await Promise.all([
        attackerAccountData.allianceWith
          ? this.program.account.agent.fetch(attackerAccountData.allianceWith)
          : null,
        defenderAccountData.allianceWith
          ? this.program.account.agent.fetch(defenderAccountData.allianceWith)
          : null,
      ]);

      const [
        attackerRecord,
        defenderRecord,
        attackerAllyRecord,
        defenderAllyRecord,
      ] = await Promise.all([
        this.prisma.agent.findUnique({
          where: { id: ctx.agentId },
          include: { profile: true },
        }),
        this.prisma.agent.findUnique({
          where: {
            onchainId_gameId: {
              onchainId: action.targetId,
              gameId: ctx.gameId,
            },
          },
          include: { profile: true },
        }),
        attackerAllyAccount
          ? this.prisma.agent.findUnique({
              where: {
                onchainId_gameId: {
                  onchainId: Number(attackerAllyAccount.id),
                  gameId: ctx.gameId,
                },
              },
              include: { profile: true },
            })
          : null,
        defenderAllyAccount
          ? this.prisma.agent.findUnique({
              where: {
                onchainId_gameId: {
                  onchainId: Number(defenderAllyAccount.id),
                  gameId: ctx.gameId,
                },
              },
              include: { profile: true },
            })
          : null,
      ]);

      if (!attackerRecord || !defenderRecord) {
        throw new Error("One or more agents not found");
      }

      const sideA = {
        agent: attackerAccountData,
        ally: attackerAllyAccount,
      };
      const sideB = {
        agent: defenderAccountData,
        ally: defenderAllyAccount,
      };

      // Calculate battle outcome
      const outcome = await this.calculateBattleOutcome(sideA, sideB);
      console.info("Battle outcome", { outcome });

      const battleType =
        attackerAllyAccount && defenderAllyAccount
          ? "AllianceVsAlliance"
          : attackerAllyAccount || defenderAllyAccount
          ? "AgentVsAlliance"
          : "Simple";

      console.info(`Battle type: ${battleType}`);
      const startTime = new Date();

      const gameAuthorityWallet = await getMiddleEarthAiAuthorityWallet();

      const attackerAuthorityKeypair = await getAgentAuthorityKeypair(
        attackerRecord.profile.onchainId
      );
      const defenderAuthorityKeypair = await getAgentAuthorityKeypair(
        defenderRecord.profile.onchainId
      );

      // Execute everything in a transaction
      await this.prisma.$transaction(
        async (prisma) => {
          // Create battle record
          const battle = await prisma.battle.create({
            data: {
              type: battleType,
              status: "Resolved",
              tokensStaked: Math.floor(outcome.totalTokensAtStake),
              gameId: ctx.gameId,
              attackerId: attackerRecord.id,
              defenderId: defenderRecord.id,
              attackerAllyId: attackerAllyAccount ? attackerRecord.id : null,
              defenderAllyId: defenderAllyAccount ? defenderRecord.id : null,
              startTime,
              endTime: startTime,
              winnerId:
                outcome.winner === "sideA"
                  ? attackerRecord.id
                  : defenderRecord.id,
            },
          });

          // Create battle event
          const battleEvent = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "BATTLE",
              initiatorId: ctx.agentId,
              targetId: defenderRecord.id,
              message: this.createBattleMessage(
                attackerRecord.profile.xHandle,
                defenderRecord.profile.xHandle,
                outcome
              ),
              metadata: {
                battleId: battle.id,
                battleType: battleType,
                tokensAtStake: outcome.totalTokensAtStake,
                percentageLost: outcome.percentageLost,
                winner: outcome.winner,
                timestamp: new Date().toISOString(),
                agentsToDie: outcome.agentsToDie,
              },
            },
          });

          console.log("Killing agents onchain....................", {
            outcome,
          });
          if (outcome.agentsToDie.length > 0) {
            const deathTime = new Date();

            // Update agent records to mark them as dead
            await Promise.all(
              outcome.agentsToDie.map(async (agentId) => {
                // Update database record
                await prisma.agent.update({
                  where: {
                    onchainId_gameId: {
                      onchainId: agentId,
                      gameId: ctx.gameId,
                    },
                  },
                  data: {
                    isAlive: false,
                    deathTimestamp: deathTime,
                  },
                });

                // Create death event
                await prisma.gameEvent.create({
                  data: {
                    gameId: ctx.gameId,
                    eventType: "AGENT_DEATH",
                    initiatorId: ctx.agentId,
                    targetId:
                      agentId === attackerRecord.profile.onchainId
                        ? attackerRecord.id
                        : defenderRecord.id,
                    message: `💀 @${
                      agentId === attackerRecord.profile.onchainId
                        ? attackerRecord.profile.xHandle
                        : defenderRecord.profile.xHandle
                    } has fallen in battle!`,
                    metadata: {
                      cause: "BATTLE",
                      battleId: battle.id,
                      timestamp: deathTime.toISOString(),
                    },
                  },
                });
              })
            );
          }

          // Create battle cooldowns for all participating agents
          const cooldownEndTime = new Date(
            startTime.getTime() + gameConfig.mechanics.battle.duration
          );

          // Create cooldown for attacker
          await prisma.coolDown.create({
            data: {
              type: "Battle",
              endsAt: cooldownEndTime,
              cooledAgent: {
                connect: {
                  id: attackerRecord.id,
                },
              },
              game: {
                connect: {
                  id: ctx.gameId,
                },
              },
            },
          });

          // Create cooldown for defender
          await prisma.coolDown.create({
            data: {
              type: "Battle",
              endsAt: cooldownEndTime,
              cooledAgent: {
                connect: {
                  id: defenderRecord.id,
                },
              },
              game: {
                connect: {
                  id: ctx.gameId,
                },
              },
            },
          });

          // Create cooldown for attacker's ally if exists
          if (attackerAllyRecord) {
            await prisma.coolDown.create({
              data: {
                type: "Battle",
                endsAt: cooldownEndTime,
                cooledAgent: {
                  connect: {
                    id: attackerAllyRecord.id,
                  },
                },
                game: {
                  connect: {
                    id: ctx.gameId,
                  },
                },
              },
            });
          }

          // Create cooldown for defender's ally if exists
          if (defenderAllyRecord) {
            await prisma.coolDown.create({
              data: {
                type: "Battle",
                endsAt: cooldownEndTime,
                cooledAgent: {
                  connect: {
                    id: defenderAllyRecord.id,
                  },
                },
                game: {
                  connect: {
                    id: ctx.gameId,
                  },
                },
              },
            });
          }

          // Execute onchain battle resolution
          let tx: string;

          if (battleType === "AllianceVsAlliance") {
            if (!attackerAllyRecord || !defenderAllyRecord) {
              throw new Error("Could not find the alliance records");
            }

            const attackerAllyAuthority = await getAgentAuthorityKeypair(
              attackerAllyRecord.profile.onchainId
            );
            const defenderAllyAuthority = await getAgentAuthorityKeypair(
              defenderAllyRecord.profile.onchainId
            );

            const isAttackerWinner = outcome.winner === "sideA";
            tx = await this.program.methods
              .resolveBattleAllianceVsAlliance(
                outcome.percentageLost,
                isAttackerWinner
              )
              .accounts({
                leaderA: isAttackerWinner ? attackerPda : defenderPda,
                partnerA: isAttackerWinner
                  ? attackerAccountData.allianceWith!
                  : defenderAccountData.allianceWith!,
                leaderB: isAttackerWinner ? defenderPda : attackerPda,
                partnerB: isAttackerWinner
                  ? defenderAccountData.allianceWith!
                  : attackerAccountData.allianceWith!,
                leaderAToken: isAttackerWinner
                  ? attackerRecord?.authorityAssociatedTokenAddress
                  : defenderRecord?.authorityAssociatedTokenAddress,
                partnerAToken: isAttackerWinner
                  ? attackerAllyRecord?.authorityAssociatedTokenAddress
                  : defenderAllyRecord?.authorityAssociatedTokenAddress,
                leaderBToken: isAttackerWinner
                  ? defenderRecord?.authorityAssociatedTokenAddress
                  : attackerRecord?.authorityAssociatedTokenAddress,
                partnerBToken: isAttackerWinner
                  ? defenderAllyRecord?.authorityAssociatedTokenAddress
                  : attackerAllyRecord?.authorityAssociatedTokenAddress,
                leaderAAuthority: isAttackerWinner
                  ? attackerAuthorityKeypair.publicKey
                  : defenderAuthorityKeypair.publicKey,
                partnerAAuthority: isAttackerWinner
                  ? attackerAllyAuthority.publicKey
                  : defenderAllyAuthority.publicKey,
                leaderBAuthority: isAttackerWinner
                  ? defenderAuthorityKeypair.publicKey
                  : attackerAuthorityKeypair.publicKey,
                partnerBAuthority: isAttackerWinner
                  ? defenderAllyAuthority.publicKey
                  : attackerAllyAuthority.publicKey,
                authority: gameAuthorityWallet.keypair.publicKey,
              })
              .signers([
                attackerAuthorityKeypair,
                defenderAuthorityKeypair,
                attackerAllyAuthority,
                defenderAllyAuthority,
                gameAuthorityWallet.keypair,
              ])
              .rpc();
          } else if (battleType === "AgentVsAlliance") {
            const isAttackerSingle = !attackerAllyAccount;

            const singleAgent = isAttackerSingle ? attackerPda : defenderPda;

            const singleAgentToken = isAttackerSingle
              ? attackerRecord.authorityAssociatedTokenAddress
              : defenderRecord.authorityAssociatedTokenAddress;
            const singleAgentAuthorityKeypair = isAttackerSingle
              ? attackerAuthorityKeypair
              : defenderAuthorityKeypair;
            const allianceLeaderAuthorityKeypair = isAttackerSingle
              ? defenderAuthorityKeypair
              : attackerAuthorityKeypair;
            const alliancePartnerAuthorityKeypair = isAttackerSingle
              ? attackerAuthorityKeypair
              : defenderAuthorityKeypair;
            const allianceLeader = isAttackerSingle ? defenderPda : attackerPda;
            const alliancePartner = isAttackerSingle
              ? defenderAccountData.allianceWith!
              : attackerAccountData.allianceWith!;

            const allianceLeaderToken = isAttackerSingle
              ? defenderRecord.authorityAssociatedTokenAddress
              : attackerRecord.authorityAssociatedTokenAddress;
            const alliancePartnerToken = isAttackerSingle
              ? defenderAllyRecord?.authorityAssociatedTokenAddress!
              : attackerAllyRecord?.authorityAssociatedTokenAddress!;

            tx = await this.program.methods
              .resolveBattleAgentVsAlliance(
                outcome.percentageLost,
                isAttackerSingle
                  ? outcome.winner === "sideA"
                  : outcome.winner === "sideB"
              )
              .accounts({
                singleAgent: singleAgent,
                singleAgentToken: singleAgentToken,
                allianceLeader: allianceLeader,
                allianceLeaderToken: allianceLeaderToken,
                alliancePartner: alliancePartner,
                alliancePartnerToken: alliancePartnerToken,
                singleAgentAuthority: singleAgentAuthorityKeypair.publicKey,
                allianceLeaderAuthority:
                  allianceLeaderAuthorityKeypair.publicKey,
                alliancePartnerAuthority:
                  alliancePartnerAuthorityKeypair.publicKey,

                authority: gameAuthorityWallet.keypair.publicKey,
              })
              .signers([
                gameAuthorityWallet.keypair,
                singleAgentAuthorityKeypair,
                allianceLeaderAuthorityKeypair,
                alliancePartnerAuthorityKeypair,
              ])
              .rpc();
          } else {
            const isAttackerWinner = outcome.winner === "sideA";
            tx = await this.program.methods
              .resolveBattleSimple(outcome.percentageLost)
              .accounts({
                winner: isAttackerWinner ? attackerPda : defenderPda,
                loser: isAttackerWinner ? defenderPda : attackerPda,
                winnerToken: isAttackerWinner
                  ? attackerRecord.authorityAssociatedTokenAddress
                  : defenderRecord.authorityAssociatedTokenAddress,
                loserToken: isAttackerWinner
                  ? defenderRecord.authorityAssociatedTokenAddress
                  : attackerRecord.authorityAssociatedTokenAddress,
                loserAuthority: isAttackerWinner
                  ? defenderAuthorityKeypair.publicKey
                  : attackerAuthorityKeypair.publicKey,
                authority: gameAuthorityWallet.keypair.publicKey,
              })
              .signers([
                gameAuthorityWallet.keypair,
                // the loser authority keypair
                isAttackerWinner
                  ? defenderAuthorityKeypair
                  : attackerAuthorityKeypair,
              ])
              .rpc();
          }

          // Kill the agents that died
          await Promise.all(
            outcome.agentsToDie.map(async (agentId) => {
              // Execute on-chain kill instruction
              const [deadAgentPda] = getAgentPDA(
                this.program.programId,
                gamePda,
                agentId
              );
              const deadAgentAuthority = await getAgentAuthorityKeypair(
                agentId
              );

              await this.program.methods
                .killAgent()
                .accountsStrict({
                  agent: deadAgentPda,
                  authority: deadAgentAuthority.publicKey,
                })
                .signers([deadAgentAuthority])
                .rpc();

              return { battle, battleEvent, tx };
            })
          );
        },

        {
          isolationLevel: "Serializable",
          maxWait: 120000, // 2 minutes
          timeout: 180000, // 3 minutes
        }
      );

      return {
        success: true,
        feedback: {
          isValid: true,
        },
      };
    } catch (error) {
      console.error("💥 Battle failed", { error, ctx, action });
      return {
        success: false,
        feedback: {
          isValid: false,
          error: {
            type: "BATTLE",
            message: error instanceof Error ? error.message : String(error),
            context: { currentState: ctx, attemptedAction: action },
          },
        },
      };
    }
  }

  /**
   * Calculate the outcome of a battle between two participants
   * If total tokens is zero, uses agent and ally count as a fallback mechanism
   */

  private async calculateBattleOutcome(
    sideA: BattleSide,
    sideB: BattleSide
  ): Promise<BattleOutcome> {
    // Calculate total tokens for each side
    const sideATokens =
      sideA.agent.stakedBalance + (sideA.ally?.stakedBalance ?? 0);
    const sideBTokens =
      sideB.agent.stakedBalance + (sideB.ally?.stakedBalance ?? 0);
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

    // Check for agentsToDie (10% chance for losing side)
    const agentsToDie: number[] = [];
    const losingSide = sideAWins ? sideB : sideA;

    const deathChance = gameConfig.mechanics.deathChance / 100;

    // Check death for main agent (10% chance)
    if (Math.random() < deathChance) {
      agentsToDie.push(Number(losingSide.agent.id));
    }

    // Check death for ally if exists (10% chance)
    if (losingSide.ally && Math.random() < deathChance) {
      agentsToDie.push(Number(losingSide.ally.id));
    }

    return {
      winner: sideAWins ? "sideA" : "sideB",
      percentageLost,
      totalTokensAtStake: Number(totalTokens),
      agentsToDie,
    };
  }

  private createBattleMessage(
    attackerHandle: string,
    defenderHandle: string,
    outcome: {
      winner: "sideA" | "sideB";
      percentageLost: number;
      totalTokensAtStake: number;
      agentsToDie: number[];
    }
  ): string {
    const winner = outcome.winner === "sideA" ? attackerHandle : defenderHandle;
    const loser = outcome.winner === "sideA" ? defenderHandle : attackerHandle;

    let message = `⚔️ Epic battle concluded! @${winner} emerges victorious over @${loser}! ${outcome.percentageLost}% of ${outcome.totalTokensAtStake} tokens lost in the clash!`;

    if (outcome.agentsToDie.length > 0) {
      message += ` 💀 ${
        outcome.agentsToDie.length === 1 ? "A warrior has" : "Warriors have"
      } fallen in battle!`;
    }

    return message;
  }
}
