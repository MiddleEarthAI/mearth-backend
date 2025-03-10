import { ActionContext, BattleAction, ActionResult } from "@/types";
import { MearthProgram } from "@/types";
import { PrismaClient } from "@prisma/client";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

import { getMiddleEarthAiAuthorityWallet } from "@/utils/program";
import { AgentAccount } from "@/types/program";
import { gameConfig } from "@/config/env";
import { createTransferInstruction, getAccount } from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { MEARTH_DECIMALS } from "@/constants";
import { formatNumber, getAgentTokenAccountAddress } from "@/utils";

interface BattleSide {
  agent: AgentAccount & { vaultBalance: bigint; vault: string };
  ally: (AgentAccount & { vaultBalance: bigint; vault: string }) | null;
}

interface BattleOutcome {
  winner: "sideA" | "sideB";
  percentageLost: number;
  totalTokensAtStake: bigint;
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
      // Get agent accounts and balances
      const [attackerAccountData, defenderAccountData] = await Promise.all([
        (async () => {
          const agent: AgentAccount = await this.program.account.agent.fetch(
            attackerPda
          );
          const agentVaultAddress = getAgentTokenAccountAddress(agent.id);

          const vault = await getAccount(
            this.program.provider.connection,
            new PublicKey(agentVaultAddress)
          );
          const vaultBalance = vault.amount / BigInt(MEARTH_DECIMALS); // we are dealing with bigints here
          return { ...agent, vaultBalance, vault: agentVaultAddress };
        })(),
        (async () => {
          const agent: AgentAccount = await this.program.account.agent.fetch(
            defenderPda
          );
          const agentVaultAddress = getAgentTokenAccountAddress(agent.id);
          const vault = await getAccount(
            this.program.provider.connection,
            new PublicKey(agentVaultAddress)
          );
          const vaultBalance = vault.amount / BigInt(MEARTH_DECIMALS); // we are dealing with bigints here
          return { ...agent, vaultBalance, vault: agentVaultAddress };
        })(),
      ]);

      // Get ally accounts and balances if they exist
      const [attackerAllyAccount, defenderAllyAccount] = await Promise.all([
        attackerAccountData.allianceWith
          ? (async () => {
              if (!attackerAccountData.allianceWith) return null;
              const allyAccount = await this.program.account.agent.fetch(
                attackerAccountData.allianceWith
              );
              const allyVaultAddress = getAgentTokenAccountAddress(
                allyAccount.id
              );
              const allyVault = await getAccount(
                this.program.provider.connection,
                new PublicKey(allyVaultAddress)
              );
              const allyVaultBalance =
                allyVault.amount / BigInt(MEARTH_DECIMALS); // we are dealing with bigints here
              return {
                ...allyAccount,
                vaultBalance: allyVaultBalance,
                vault: allyVaultAddress,
              };
            })()
          : null,
        defenderAccountData.allianceWith
          ? (async () => {
              if (!defenderAccountData.allianceWith) return null;
              const allyAccount = await this.program.account.agent.fetch(
                defenderAccountData.allianceWith
              );
              const allyVaultAddress = getAgentTokenAccountAddress(
                allyAccount.id
              );
              const allyVault = await getAccount(
                this.program.provider.connection,
                new PublicKey(allyVaultAddress)
              );
              const allyVaultBalance =
                allyVault.amount / BigInt(MEARTH_DECIMALS); // we are dealing with bigints here
              return {
                ...allyAccount,
                vaultBalance: allyVaultBalance,
                vault: allyVaultAddress,
              };
            })()
          : null,
      ]);
      // Get agent records
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
                  onchainId: attackerAllyAccount.id,
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
                  onchainId: defenderAllyAccount.id,
                  gameId: ctx.gameId,
                },
              },
              include: { profile: true },
            })
          : null,
      ]);

      if (!attackerRecord || !defenderRecord) {
        throw new Error("attacker or defender not found");
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

      // Execute everything in a transaction
      await this.prisma.$transaction(
        async (prisma) => {
          // Create battle record
          const battle = await prisma.battle.create({
            data: {
              type: battleType,
              status: "Resolved",
              tokensStaked: outcome.totalTokensAtStake,
              gameId: ctx.gameId,
              attackerId: attackerRecord.id,
              defenderId: defenderRecord.id,
              attackerAllyId: attackerAllyAccount
                ? attackerAllyRecord?.id
                : null,
              defenderAllyId: defenderAllyAccount
                ? defenderAllyRecord?.id
                : null,
              startTime,
              endTime: startTime,
              winnerId:
                outcome.winner === "sideA"
                  ? attackerRecord.id
                  : defenderRecord.id,
            },
          });

          const winner =
            outcome.winner === "sideA"
              ? attackerRecord.profile.xHandle
              : defenderRecord.profile.xHandle;
          const loser =
            outcome.winner === "sideA"
              ? defenderRecord.profile.xHandle
              : attackerRecord.profile.xHandle;

          const loserTokens =
            outcome.winner === "sideA"
              ? sideB.agent.vaultBalance
              : sideA.agent.vaultBalance;

          let message = `⚔️ Epic battle concluded! @${winner} emerges victorious over @${loser}! ${
            outcome.percentageLost
          }% of @${loser} (${formatNumber(
            Number(loserTokens / BigInt(MEARTH_DECIMALS))
          )}) tokens lost in the clash!`;

          if (outcome.agentsToDie.length > 0) {
            message += ` 💀 ${
              outcome.agentsToDie.length === 1
                ? "A warrior has"
                : "Warriors have"
            } fallen in battle!`;
          }

          // Create battle event
          const battleEvent = await prisma.gameEvent.create({
            data: {
              gameId: ctx.gameId,
              eventType: "BATTLE",
              initiatorId: ctx.agentId,
              targetId: defenderRecord.id,
              message,
              metadata: {
                battleId: battle.id,
                battleType: battleType,
                tokensAtStake: outcome.totalTokensAtStake.toString(),
                percentageLost: outcome.percentageLost,
                winner: outcome.winner,
                timestamp: new Date().toISOString(),
                agentsToDie: outcome.agentsToDie,
              },
            },
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
            startTime.getTime() + gameConfig.mechanics.battle.duration * 1000
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
                  ? attackerRecord?.vault
                  : defenderRecord?.vault,
                partnerAToken: isAttackerWinner
                  ? attackerAllyRecord?.vault
                  : defenderAllyRecord?.vault,
                leaderBToken: isAttackerWinner
                  ? defenderRecord?.vault
                  : attackerRecord?.vault,
                partnerBToken: isAttackerWinner
                  ? defenderAllyRecord?.vault
                  : attackerAllyRecord?.vault,
                leaderAAuthority: isAttackerWinner
                  ? gameAuthorityWallet.keypair.publicKey
                  : gameAuthorityWallet.keypair.publicKey,
                partnerAAuthority: isAttackerWinner
                  ? gameAuthorityWallet.keypair.publicKey
                  : gameAuthorityWallet.keypair.publicKey,
                leaderBAuthority: isAttackerWinner
                  ? gameAuthorityWallet.keypair.publicKey
                  : gameAuthorityWallet.keypair.publicKey,
                partnerBAuthority: isAttackerWinner
                  ? gameAuthorityWallet.keypair.publicKey
                  : gameAuthorityWallet.keypair.publicKey,
                authority: gameAuthorityWallet.keypair.publicKey,
              })
              .signers([gameAuthorityWallet.keypair])
              .rpc();
          } else if (battleType === "AgentVsAlliance") {
            // determine the solo agent
            const isAttackerSingle = !attackerAllyAccount;

            const singleAgent = isAttackerSingle ? attackerPda : defenderPda;

            const singleAgentToken = isAttackerSingle
              ? attackerRecord.vault
              : defenderRecord.vault;
            const singleAgentAuthorityKeypair = isAttackerSingle
              ? gameAuthorityWallet.keypair
              : gameAuthorityWallet.keypair;
            const allianceLeaderAuthorityKeypair = isAttackerSingle
              ? gameAuthorityWallet.keypair
              : gameAuthorityWallet.keypair;
            const alliancePartnerAuthorityKeypair = isAttackerSingle
              ? gameAuthorityWallet.keypair
              : gameAuthorityWallet.keypair;
            const allianceLeader = isAttackerSingle ? defenderPda : attackerPda;
            const alliancePartner = isAttackerSingle
              ? defenderAccountData.allianceWith!
              : attackerAccountData.allianceWith!;

            const allianceLeaderToken = isAttackerSingle
              ? defenderRecord.vault
              : attackerRecord.vault;
            const alliancePartnerToken = isAttackerSingle
              ? defenderAllyRecord?.vault!
              : attackerAllyRecord?.vault!;

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
                  ? attackerRecord.vault
                  : defenderRecord.vault,
                loserToken: isAttackerWinner
                  ? defenderRecord.vault
                  : attackerRecord.vault,
                loserAuthority: isAttackerWinner
                  ? gameAuthorityWallet.keypair.publicKey
                  : gameAuthorityWallet.keypair.publicKey,
                authority: gameAuthorityWallet.keypair.publicKey,
              })
              .signers([gameAuthorityWallet.keypair])
              .rpc();
          }

          // Kill the agents that died

          console.log("Killing agents onchain if any....................", {
            outcome,
          });
          await Promise.all(
            outcome.agentsToDie.map(async (agentId) => {
              // Execute on-chain kill instruction
              const [deadAgentPda] = getAgentPDA(
                this.program.programId,
                gamePda,
                agentId
              );

              await this.program.methods
                .killAgent()
                .accountsStrict({
                  agent: deadAgentPda,
                  authority: gameAuthorityWallet.keypair.publicKey,
                  game: gamePda,
                })
                .signers([gameAuthorityWallet.keypair])
                .rpc();
              // Transfer all tokens from dead agent to winner(s)
              const deadAgentVaultAddress =
                getAgentTokenAccountAddress(agentId);
              const deadAgentVault = await getAccount(
                this.program.provider.connection,
                new PublicKey(deadAgentVaultAddress)
              );

              // Determine winner vault(s) to distribute tokens to
              const winnerVaults = [];
              if (outcome.winner === "sideA") {
                winnerVaults.push(sideA.agent.vault);
                if (sideA.ally) winnerVaults.push(sideA.ally.vault);
              } else {
                winnerVaults.push(sideB.agent.vault);
                if (sideB.ally) winnerVaults.push(sideB.ally.vault);
              }

              // Calculate tokens per winner
              const tokensPerWinner =
                deadAgentVault.amount / BigInt(winnerVaults.length);

              // Transfer tokens to each winner using latest Solana methods
              const connection = this.program.provider.connection;

              await Promise.all(
                winnerVaults.map(async (winnerVault) => {
                  const transaction = new Transaction().add(
                    createTransferInstruction(
                      new PublicKey(deadAgentVaultAddress),
                      new PublicKey(winnerVault),
                      gameAuthorityWallet.keypair.publicKey,
                      tokensPerWinner
                    )
                  );

                  const latestBlockhash = await connection.getLatestBlockhash();
                  transaction.recentBlockhash = latestBlockhash.blockhash;
                  transaction.feePayer = gameAuthorityWallet.keypair.publicKey;

                  transaction.sign(gameAuthorityWallet.keypair);
                  const rawTransaction = transaction.serialize();

                  const signature = await connection.sendRawTransaction(
                    rawTransaction,
                    {
                      skipPreflight: false,
                      preflightCommitment: "confirmed",
                      maxRetries: 3,
                    }
                  );

                  await connection.confirmTransaction(
                    {
                      signature,
                      blockhash: latestBlockhash.blockhash,
                      lastValidBlockHeight:
                        latestBlockhash.lastValidBlockHeight,
                    },
                    "confirmed"
                  );
                })
              );

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
    // getting the agents vault balances
    const sideATokens =
      sideA.agent.vaultBalance +
      (sideA.ally ? sideA.ally.vaultBalance : BigInt(0));

    const sideBTokens =
      sideB.agent.vaultBalance +
      (sideB.ally ? sideB.ally.vaultBalance : BigInt(0));

    const totalTokens = sideATokens + sideBTokens;

    let sideAWins: boolean;

    if (totalTokens === BigInt(0)) {
      // Use number of agents as fallback when no tokens
      const sideACount = sideA.ally ? 2 : 1;
      const sideBCount = sideB.ally ? 2 : 1;
      const totalCount = sideACount + sideBCount;

      // Calculate probability based on agent count
      const sideAProbability = sideACount / totalCount;
      const rand = Math.random();
      sideAWins = rand < sideAProbability;
    } else {
      const sideAProbability = sideATokens / totalTokens;
      const rand = Math.random();
      sideAWins = rand < sideAProbability;
    }

    // Calculate battle losses and deaths
    const percentageLost = Math.floor(Math.random() * 11) + 20;
    const agentsToDie: number[] = [];
    const losingSide = sideAWins ? sideB : sideA;

    const deathChance = gameConfig.mechanics.deathChance / 100;

    if (Math.random() < deathChance) {
      agentsToDie.push(losingSide.agent.id);
    }

    if (losingSide.ally && Math.random() < deathChance) {
      agentsToDie.push(losingSide.ally.id);
    }

    console.log("Battle outcome:::::::::::::::", {
      sideAWins,
      percentageLost,
      totalTokens: totalTokens.toString(),
      agentsToDie,
    });

    return {
      winner: sideAWins ? "sideA" : "sideB",
      percentageLost,
      totalTokensAtStake: totalTokens / BigInt(MEARTH_DECIMALS),
      agentsToDie,
    };
  }
}
