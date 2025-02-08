import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount, AgentInfo } from "@/types/program";
import { PrismaClient } from "@prisma/client";
import { getAgentAta } from "../utils/program";
import { gameConfig } from "@/config/env";
import { BN } from "@coral-xyz/anchor";

// Represents outcome of a 1v1 battle between two agents
type SimpleBattleOutcome = {
  winnerOnchainId: number;
  loserOnchainId: number;
  percentLoss: number;
};

// Represents outcome of a battle between single agent and an alliance (1v2)
type AgentVsAllianceBattleOutcome = {
  percentLoss: number;
  agentIsWinner: boolean;
  singleAgentOnchainId: number;
  singleAgentAuthority: PublicKey;
  allianceLeaderOnchainId: number;
  allianceLeaderAuthority: PublicKey;
  alliancePartnerOnchainId: number;
  alliancePartnerAuthority: PublicKey;
};

// Represents outcome of a battle between two alliances (2v2)
type AllianceVsAllianceBattleOutcome = {
  percentLoss: number;
  allianceAWins: boolean;
  allianceALeaderOnchainId: number;
  allianceALeaderAuthority: PublicKey;
  allianceAPartnerOnchainId: number;
  allianceAPartnerAuthority: PublicKey;
  allianceBLeaderOnchainId: number;
  allianceBLeaderAuthority: PublicKey;
  allianceBPartnerOnchainId: number;
  allianceBPartnerAuthority: PublicKey;
};

// Groups agents involved in a battle with their sides and balances
type BattleGroup = {
  agents: AgentAccount[];
  currentBattleStart: BN;
  sides: {
    sideA: {
      agents: AgentAccount[];
      totalBalance: number;
    };
    sideB: {
      agents: AgentAccount[];
      totalBalance: number;
    };
  };
};

// Represents a pair of agents in an alliance
type AlliancePair = {
  leader: AgentAccount;
  partner: AgentAccount;
};

// Contains agent and their alliance account info
type AllianceInfo = {
  agent: AgentAccount;
  allianceAccount: AgentAccount;
};

type GameContext = {
  gameOnchainId: number;
  gameId: string;
};

/**
 * Service for handling battle resolutions via interval
 * Monitors active battles and resolves them after the 1 hour duration
 */
export class BattleResolver {
  private resolutionInterval: NodeJS.Timeout | null = null;
  private readonly prisma: PrismaClient;

  constructor(
    private readonly ctx: GameContext,
    private readonly program: Program<MiddleEarthAiProgram>,
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    console.log("🎮 Battle Resolution Service initialized for game", {
      gameOnchainId: this.ctx.gameOnchainId,
    });
  }

  /**
   * Start the battle resolution interval
   */
  public async start() {
    if (this.resolutionInterval) {
      console.log("🔄 Clearing existing battle resolution interval");
      clearInterval(this.resolutionInterval);
    }

    // Initial check
    await this.checkAndResolveBattles();

    this.resolutionInterval = setInterval(() => {
      console.log("⏰ Running scheduled battle resolution check");
      this.checkAndResolveBattles();
    }, gameConfig.battleCheckInterval);

    console.log("🎯 Battle resolution interval started", {
      intervalMs: gameConfig.battleCheckInterval,
    });
  }

  /**
   * Check for battles that need resolution and resolve them
   */
  private async checkAndResolveBattles() {
    try {
      console.log("🔍 Starting battle resolution check cycle");
      const [gamePda] = getGamePDA(
        this.program.programId,
        this.ctx.gameOnchainId
      );
      const gameAccount = await this.program.account.game.fetch(gamePda);
      const agentInfos = gameAccount.agents as AgentInfo[];

      console.log("📊 Retrieved game state and agent information", {
        totalAgents: agentInfos.length,
        gameAccount: JSON.stringify(gameAccount),
      });

      // Get all agents in battle
      const agentsInBattle = (
        await Promise.all(
          agentInfos.map(async (agentInfo) => {
            try {
              const agentAccount = await this.program.account.agent.fetch(
                agentInfo.key
              );
              if (agentAccount.isAlive && agentAccount.currentBattleStart) {
                return agentAccount;
              }
            } catch (error) {
              console.error(
                `❌ Failed to fetch agent data ${agentInfo.key}:`,
                error
              );
            }
            return null;
          })
        )
      ).filter((agent) => agent !== null);

      console.log("⚔️ Identified active battles", {
        battleCount: agentsInBattle.length,
      });

      // if no ongoing battle, return
      if (agentsInBattle.length === 0) {
        return;
      }

      // Group agents by battle and alliances
      const battleGroups = await this.groupAgentsInBattle(agentsInBattle);

      // Resolve each battle
      for (const battleGroup of battleGroups) {
        try {
          // Validate battle duration
          const currentTime = Math.floor(Date.now() / 1000);
          const battleStartTime = battleGroup.currentBattleStart.toNumber();

          if (
            currentTime - battleStartTime <
            gameConfig.mechanics.cooldowns.battleDuration
          ) {
            console.log("⏳ Battle not ready for resolution", {
              timeRemaining:
                gameConfig.mechanics.cooldowns.battleDuration -
                (currentTime - battleStartTime),
            });
            continue;
          }

          const { type, outcome } = this.determineBattleType(battleGroup);

          console.log("🎯 Processing battle resolution", { type });

          // Resolve battle based on type
          switch (type) {
            case "Simple":
              await this.resolveSimpleBattle(
                outcome as SimpleBattleOutcome,
                gamePda
              );
              break;
            case "AgentVsAlliance":
              await this.resolveAgentVsAllianceBattle(
                outcome as AgentVsAllianceBattleOutcome,
                gamePda
              );
              break;
            case "AllianceVsAlliance":
              await this.resolveAllianceVsAllianceBattle(
                outcome as AllianceVsAllianceBattleOutcome,
                gamePda
              );
              break;
          }

          console.log(`✅ Successfully resolved ${type} battle`);
        } catch (error) {
          console.error(`❌ Battle resolution failed:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Battle resolution check cycle failed:", error);
    }
  }

  /**
   * Group agents by their battle start time and alliance relationships
   */
  private async groupAgentsInBattle(
    agents: AgentAccount[]
  ): Promise<BattleGroup[]> {
    console.log("🔍 Starting to group agents in battle", {
      agentCount: agents.length,
    });

    // First, group by battle start time
    const battleGroups = new Map<string, AgentAccount[]>();

    agents.forEach((agent) => {
      // not in battle, return
      if (!agent.currentBattleStart) return;

      const key = agent.currentBattleStart.toString();
      if (!battleGroups.has(key)) {
        battleGroups.set(key, []);
      }
      battleGroups.get(key)?.push(agent);
    });

    console.log("📊 Initial battle groups formed", {
      groupCount: battleGroups.size,
    });

    // Then, for each battle group, separate into sides based on alliances
    const battleGroupsArray = await Promise.all(
      Array.from(battleGroups.entries()).map(
        async ([startTime, groupAgents]) => {
          console.log("⚔️ Processing battle group", {
            startTime,
            agentCount: groupAgents.length,
          });

          const sides = {
            sideA: { agents: [] as AgentAccount[], totalBalance: 0 },
            sideB: { agents: [] as AgentAccount[], totalBalance: 0 },
          };

          // First, fetch all alliance accounts for agents that have them
          const alliancePromises = groupAgents
            .filter((agent) => agent.allianceWith !== null)
            .map(async (agent) => {
              try {
                console.log("🤝 Fetching alliance account for agent", {
                  agentId: agent.id.toString(),
                });
                const allianceAccount = (await this.program.account.agent.fetch(
                  agent.allianceWith!
                )) as AgentAccount;
                return {
                  agent,
                  allianceAccount,
                } as AllianceInfo;
              } catch (error) {
                console.error(
                  `❌ Failed to fetch alliance for agent ${agent.id}:`,
                  error
                );
                return null;
              }
            });

          const alliances = (await Promise.all(alliancePromises)).filter(
            (alliance): alliance is AllianceInfo => alliance !== null
          );

          console.log("🤝 Alliance accounts fetched successfully", {
            allianceCount: alliances.length,
          });

          // Create alliance pairs
          const alliancePairs = new Map<string, AlliancePair>();
          alliances.forEach(({ agent, allianceAccount }) => {
            const key = [
              agent.authority.toString(),
              allianceAccount.authority.toString(),
            ]
              .sort()
              .join("-");

            if (!alliancePairs.has(key)) {
              alliancePairs.set(key, {
                leader: agent,
                partner: allianceAccount,
              });
            }
          });

          console.log("👥 Alliance pairs created and mapped", {
            pairCount: alliancePairs.size,
          });

          // Assign alliance pairs to sides
          let assignedToSideA = false;
          for (const { leader, partner } of alliancePairs.values()) {
            const side = assignedToSideA ? sides.sideA : sides.sideB;
            side.agents.push(leader, partner);
            side.totalBalance +=
              leader.tokenBalance.toNumber() + partner.tokenBalance.toNumber();
            assignedToSideA = !assignedToSideA;
          }

          // Assign remaining single agents
          const allianceAgents = new Set(
            [...alliancePairs.values()].flatMap((pair) => [
              pair.leader.authority.toString(),
              pair.partner.authority.toString(),
            ])
          );

          const singleAgents = groupAgents.filter(
            (agent) => !allianceAgents.has(agent.authority.toString())
          );

          console.log("👤 Processing single agents for battle sides", {
            singleAgentCount: singleAgents.length,
          });

          singleAgents.forEach((agent) => {
            const side = assignedToSideA ? sides.sideA : sides.sideB;
            side.agents.push(agent);
            side.totalBalance += agent.tokenBalance.toNumber();
            assignedToSideA = !assignedToSideA;
          });

          console.log("⚖️ Battle sides balanced and finalized", {
            sideAAgents: sides.sideA.agents.length,
            sideBAgents: sides.sideB.agents.length,
          });

          return {
            agents: groupAgents,
            currentBattleStart: new BN(startTime),
            sides,
          };
        }
      )
    );

    console.log("✅ Battle groups processing completed successfully", {
      totalGroups: battleGroupsArray.length,
    });
    return battleGroupsArray;
  }

  /**
   * Calculate battle outcome based on token balances
   */
  private calculateBattleOutcome(battleGroup: BattleGroup): {
    winningSide: "sideA" | "sideB";
    percentLoss: number;
  } {
    console.log("🎲 Calculating battle outcome based on balances", {
      sideABalance: battleGroup.sides.sideA.totalBalance,
      sideBBalance: battleGroup.sides.sideB.totalBalance,
    });

    const totalBalance =
      battleGroup.sides.sideA.totalBalance +
      battleGroup.sides.sideB.totalBalance;
    const sideAProbability =
      battleGroup.sides.sideA.totalBalance / totalBalance;

    // Determine winner
    const winningSide = Math.random() > sideAProbability ? "sideB" : "sideA";

    // Calculate loss percentage (20-30%)
    const percentLoss = 20 + Math.floor(Math.random() * 11);

    console.log("🏆 Battle outcome determined", {
      winningSide,
      percentLoss,
      sideAProbability: sideAProbability.toFixed(2),
    });

    return { winningSide, percentLoss };
  }

  /**
   * Determine battle type based on the number of agents and alliances
   */
  private determineBattleType(battleGroup: BattleGroup): {
    type: "Simple" | "AgentVsAlliance" | "AllianceVsAlliance";
    outcome:
      | SimpleBattleOutcome
      | AgentVsAllianceBattleOutcome
      | AllianceVsAllianceBattleOutcome;
  } {
    console.log("🔍 Analyzing battle configuration", {
      sideAAgents: battleGroup.sides.sideA.agents.length,
      sideBAgents: battleGroup.sides.sideB.agents.length,
    });

    const { sides } = battleGroup;
    const { winningSide, percentLoss } =
      this.calculateBattleOutcome(battleGroup);

    // Simple battle (1v1)
    if (sides.sideA.agents.length === 1 && sides.sideB.agents.length === 1) {
      console.log("⚔️ Detected Simple battle (1v1)");
      return {
        type: "Simple",
        outcome: {
          winnerOnchainId:
            winningSide === "sideA"
              ? sides.sideA.agents[0].id.toNumber()
              : sides.sideB.agents[0].id.toNumber(),
          loserOnchainId:
            winningSide === "sideA"
              ? sides.sideB.agents[0].id.toNumber()
              : sides.sideA.agents[0].id.toNumber(),
          percentLoss,
        },
      };
    }

    // Agent vs Alliance (1v2)
    if (
      (sides.sideA.agents.length === 1 && sides.sideB.agents.length === 2) ||
      (sides.sideA.agents.length === 2 && sides.sideB.agents.length === 1)
    ) {
      console.log("⚔️ Detected Agent vs Alliance battle (1v2)");
      const singleSide =
        sides.sideA.agents.length === 1 ? sides.sideA : sides.sideB;
      const allianceSide =
        sides.sideA.agents.length === 2 ? sides.sideA : sides.sideB;
      const singleAgent = singleSide.agents[0];
      const [allianceLeader, alliancePartner] = allianceSide.agents;

      return {
        type: "AgentVsAlliance",
        outcome: {
          agentIsWinner:
            (winningSide === "sideA" && sides.sideA.agents.length === 1) ||
            (winningSide === "sideB" && sides.sideB.agents.length === 1),
          percentLoss,
          singleAgentOnchainId: singleAgent.id.toNumber(),
          singleAgentAuthority: singleAgent.authority,
          allianceLeaderOnchainId: allianceLeader.id.toNumber(),
          allianceLeaderAuthority: allianceLeader.authority,
          alliancePartnerOnchainId: alliancePartner.id.toNumber(),
          alliancePartnerAuthority: alliancePartner.authority,
        },
      };
    }

    // Alliance vs Alliance (2v2)
    if (sides.sideA.agents.length === 2 && sides.sideB.agents.length === 2) {
      console.log("⚔️ Detected Alliance vs Alliance battle (2v2)");
      const [allianceALeader, allianceAPartner] = sides.sideA.agents;
      const [allianceBLeader, allianceBPartner] = sides.sideB.agents;

      return {
        type: "AllianceVsAlliance",
        outcome: {
          allianceAWins: winningSide === "sideA",
          percentLoss,
          allianceALeaderOnchainId: allianceALeader.id.toNumber(),
          allianceALeaderAuthority: allianceALeader.authority,
          allianceAPartnerOnchainId: allianceAPartner.id.toNumber(),
          allianceAPartnerAuthority: allianceAPartner.authority,
          allianceBLeaderOnchainId: allianceBLeader.id.toNumber(),
          allianceBLeaderAuthority: allianceBLeader.authority,
          allianceBPartnerOnchainId: allianceBPartner.id.toNumber(),
          allianceBPartnerAuthority: allianceBPartner.authority,
        },
      };
    }

    console.error("❌ Invalid battle configuration detected", {
      sideAAgents: sides.sideA.agents.length,
      sideBAgents: sides.sideB.agents.length,
    });

    throw new Error(
      `Invalid battle configuration: sideA=${sides.sideA.agents.length} agents, sideB=${sides.sideB.agents.length} agents`
    );
  }

  /**
   * Apply health penalty to losing agents and handle agent death
   */
  private async applyHealthPenalty(agentIds: number[]): Promise<void> {
    try {
      // Update health for all losing agents
      await Promise.all(
        agentIds.map(async (agentId) => {
          const agent = await this.prisma.agent.findUnique({
            where: {
              onchainId_gameId: {
                onchainId: agentId,
                gameId: this.ctx.gameId,
              },
            },
          });

          if (!agent) {
            console.error("Agent not found for health penalty", { agentId });
            return;
          }

          const newHealth = agent.health - gameConfig.mechanics.deathChance;

          if (newHealth <= 0) {
            // Kill agent both onchain and in database
            const [gamePda] = getGamePDA(
              this.program.programId,
              this.ctx.gameOnchainId
            );
            const [agentPda] = getAgentPDA(
              this.program.programId,
              gamePda,
              agent.onchainId
            );

            await this.program.methods
              .killAgent()
              .accounts({
                agent: agentPda,
              })
              .rpc();

            await this.prisma.agent.update({
              where: {
                onchainId_gameId: {
                  onchainId: agent.onchainId,
                  gameId: agent.gameId,
                },
              },
              data: {
                health: 0,
                isAlive: false,
                deathTimestamp: new Date(),
              },
            });

            // Cancel any active battles for this agent
            await this.prisma.battle.updateMany({
              where: {
                OR: [
                  { attacker: { onchainId: agentId, gameId: agent.gameId } },
                  { defender: { onchainId: agentId, gameId: agent.gameId } },
                  {
                    attackerAlly: { onchainId: agentId, gameId: agent.gameId },
                  },
                  {
                    defenderAlly: { onchainId: agentId, gameId: agent.gameId },
                  },
                ],
                status: "Active",
              },
              data: {
                status: "Cancelled",
                endTime: new Date(),
              },
            });

            console.log("☠️ Agent killed due to health depletion", {
              agentId,
              finalHealth: 0,
            });
          } else {
            // Just update health
            await this.prisma.agent.update({
              where: {
                onchainId_gameId: {
                  onchainId: agent.onchainId,
                  gameId: agent.gameId,
                },
              },
              data: {
                health: newHealth,
              },
            });

            console.log("💔 Applied health penalty to agent", {
              agentId,
              newHealth,
              penalty: gameConfig.mechanics.deathChance,
            });
          }
        })
      );
    } catch (error) {
      console.error("Failed to apply health penalties:", error);
      throw error;
    }
  }

  /**
   * Resolve a simple battle between two agents
   */
  private async resolveSimpleBattle(
    outcome: SimpleBattleOutcome,
    gamePda: PublicKey
  ) {
    const [winnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.winnerOnchainId
    );
    const [loserPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.loserOnchainId
    );
    const winnerTokenAccount = await getAgentAta(winnerPda);
    const loserTokenAccount = await getAgentAta(loserPda);

    console.log("💰 Retrieved token accounts for battle participants");

    try {
      // Resolve battle onchain
      await this.program.methods
        .resolveBattleSimple(new BN(outcome.percentLoss))
        .accounts({
          winner: winnerPda,
          loser: loserPda,
          winnerToken: winnerTokenAccount.address,
          loserToken: loserTokenAccount.address,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Apply health penalty to loser
      await this.applyHealthPenalty([outcome.loserOnchainId]);

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            {
              attacker: {
                onchainId: outcome.winnerOnchainId,
                gameId: this.ctx.gameId,
              },
            },
            {
              defender: {
                onchainId: outcome.winnerOnchainId,
                gameId: this.ctx.gameId,
              },
            },
          ],
          status: "Active",
        },
      });

      if (activeBattle) {
        await this.prisma.battle.update({
          where: { id: activeBattle.id },
          data: {
            status: "Resolved",
            winner: {
              connect: {
                onchainId_gameId: {
                  onchainId: outcome.winnerOnchainId,
                  gameId: this.ctx.gameId,
                },
              },
            },
            endTime: new Date(),
          },
        });
      }

      console.log("🏆 Simple battle resolved successfully");
    } catch (error) {
      console.error("Failed to resolve simple battle:", error);
      throw error;
    }
  }

  /**
   * Resolve a battle between an agent and an alliance
   */
  private async resolveAgentVsAllianceBattle(
    outcome: AgentVsAllianceBattleOutcome,
    gamePda: PublicKey
  ) {
    const [singleAgentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.singleAgentOnchainId
    );

    const [allianceLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceLeaderOnchainId)
    );

    const [alliancePartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.alliancePartnerOnchainId)
    );

    // Get token accounts
    const singleAgentToken = await getAgentAta(singleAgentPda);
    const allianceLeaderToken = await getAgentAta(allianceLeaderPda);
    const alliancePartnerToken = await getAgentAta(alliancePartnerPda);

    console.log("💰 Retrieved token accounts for all battle participants");

    try {
      // Resolve battle onchain
      await this.program.methods
        .resolveBattleAgentVsAlliance(
          new BN(outcome.percentLoss),
          outcome.agentIsWinner
        )
        .accounts({
          singleAgent: singleAgentPda,
          allianceLeader: allianceLeaderPda,
          alliancePartner: alliancePartnerPda,
          singleAgentToken: singleAgentToken.address,
          allianceLeaderToken: allianceLeaderToken.address,
          alliancePartnerToken: alliancePartnerToken.address,
          singleAgentAuthority: outcome.singleAgentAuthority,
          allianceLeaderAuthority: outcome.allianceLeaderAuthority,
          alliancePartnerAuthority: outcome.alliancePartnerAuthority,
        })
        .rpc();

      // Apply health penalties to losing side
      if (outcome.agentIsWinner) {
        await this.applyHealthPenalty([
          outcome.allianceLeaderOnchainId,
          outcome.alliancePartnerOnchainId,
        ]);
      } else {
        await this.applyHealthPenalty([outcome.singleAgentOnchainId]);
      }

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            {
              attacker: {
                onchainId: outcome.singleAgentOnchainId,
                gameId: this.ctx.gameId,
              },
            },
            {
              defender: {
                onchainId: outcome.singleAgentOnchainId,
                gameId: this.ctx.gameId,
              },
            },
          ],
          status: "Active",
        },
      });

      if (activeBattle) {
        await this.prisma.battle.update({
          where: { id: activeBattle.id },
          data: {
            status: "Resolved",
            winner: {
              connect: {
                onchainId_gameId: {
                  onchainId: outcome.agentIsWinner
                    ? outcome.singleAgentOnchainId
                    : outcome.allianceLeaderOnchainId,
                  gameId: this.ctx.gameId,
                },
              },
            },
            endTime: new Date(),
          },
        });
      }

      console.log("🏆 Agent vs Alliance battle resolved successfully");
    } catch (error) {
      console.error("Failed to resolve agent vs alliance battle:", error);
      throw error;
    }
  }

  /**
   * Resolve a battle between two alliances
   */
  private async resolveAllianceVsAllianceBattle(
    outcome: AllianceVsAllianceBattleOutcome,
    gamePda: PublicKey
  ) {
    const [allianceALeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.allianceALeaderOnchainId
    );
    const [allianceAPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.allianceAPartnerOnchainId
    );
    const [allianceBLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      outcome.allianceBLeaderOnchainId
    );
    const [allianceBPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,

      outcome.allianceBPartnerOnchainId
    );

    // Get token accounts
    const allianceALeaderToken = await getAgentAta(allianceALeaderPda);
    const allianceAPartnerToken = await getAgentAta(allianceAPartnerPda);
    const allianceBLeaderToken = await getAgentAta(allianceBLeaderPda);
    const allianceBPartnerToken = await getAgentAta(allianceBPartnerPda);

    try {
      // Resolve battle onchain
      await this.program.methods
        .resolveBattleAllianceVsAlliance(
          outcome.percentLoss,
          outcome.allianceAWins
        )
        .accounts({
          leaderA: allianceALeaderPda,
          partnerA: allianceAPartnerPda,
          leaderB: allianceBLeaderPda,
          partnerB: allianceBPartnerPda,
          leaderAToken: allianceALeaderToken.address,
          partnerAToken: allianceAPartnerToken.address,
          leaderBToken: allianceBLeaderToken.address,
          partnerBToken: allianceBPartnerToken.address,
          leaderAAuthority: outcome.allianceALeaderAuthority,
          partnerAAuthority: outcome.allianceAPartnerAuthority,
          leaderBAuthority: outcome.allianceBLeaderAuthority,
          partnerBAuthority: outcome.allianceBPartnerAuthority,
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Apply health penalties to losing alliance
      if (outcome.allianceAWins) {
        await this.applyHealthPenalty([
          outcome.allianceBLeaderOnchainId,
          outcome.allianceBPartnerOnchainId,
        ]);
      } else {
        await this.applyHealthPenalty([
          outcome.allianceALeaderOnchainId,
          outcome.allianceAPartnerOnchainId,
        ]);
      }

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            {
              attacker: {
                onchainId: outcome.allianceALeaderOnchainId,
                gameId: this.ctx.gameId,
              },
            },
            {
              defender: {
                onchainId: outcome.allianceALeaderOnchainId,
                gameId: this.ctx.gameId,
              },
            },
          ],
          status: "Active",
        },
      });

      if (activeBattle) {
        await this.prisma.battle.update({
          where: { id: activeBattle.id },
          data: {
            status: "Resolved",
            winner: {
              connect: {
                onchainId_gameId: {
                  onchainId: outcome.allianceAWins
                    ? outcome.allianceALeaderOnchainId
                    : outcome.allianceBLeaderOnchainId,
                  gameId: this.ctx.gameId,
                },
              },
            },
            endTime: new Date(),
          },
        });
      }

      console.log("🏆 Alliance vs Alliance battle resolved successfully");
    } catch (error) {
      console.error("Failed to resolve alliance vs alliance battle:", error);
      throw error;
    }
  }

  /**
   * Stop the battle resolution interval
   */
  public stop() {
    if (this.resolutionInterval) {
      console.log("🛑 Stopping battle resolution interval");
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
    }
    console.log("✋ Battle resolution interval stopped successfully");
  }
}
