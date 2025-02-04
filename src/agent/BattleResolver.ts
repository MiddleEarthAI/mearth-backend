import { logger } from "@/utils/logger";
import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount, AgentInfo } from "@/types/program";
import { PrismaClient } from "@prisma/client";
import { getAgentAta } from "../utils/program";

// Constants
const BATTLE_DURATION = 3600; // 1 hour in seconds
const HEALTH_PENALTY = 5; // 5% health penalty for losing
const CHECK_INTERVAL = 300000; // 5 minutes in milliseconds

// Represents outcome of a 1v1 battle between two agents
type SimpleBattleOutcome = {
  winnerId: number;
  loserId: number;
  percentLoss: number;
};

// Represents outcome of a battle between single agent and an alliance (1v2)
type AgentVsAllianceBattleOutcome = {
  percentLoss: number;
  agentIsWinner: boolean;
  singleAgentId: number;
  singleAgentAuthority: PublicKey;
  allianceLeaderId: number;
  allianceLeaderAuthority: PublicKey;
  alliancePartnerId: number;
  alliancePartnerAuthority: PublicKey;
};

// Represents outcome of a battle between two alliances (2v2)
type AllianceVsAllianceBattleOutcome = {
  percentLoss: number;
  allianceAWins: boolean;
  allianceALeaderId: number;
  allianceALeaderAuthority: PublicKey;
  allianceAPartnerId: number;
  allianceAPartnerAuthority: PublicKey;
  allianceBLeaderId: number;
  allianceBLeaderAuthority: PublicKey;
  allianceBPartnerId: number;
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

/**
 * Service for handling battle resolutions via interval
 * Monitors active battles and resolves them after the 1 hour duration
 */
export class BattleResolver {
  private resolutionInterval: NodeJS.Timeout | null = null;
  private readonly prisma: PrismaClient;

  constructor(
    private readonly currentGameId: number,
    private readonly program: Program<MiddleEarthAiProgram>,
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    logger.info("🎮 Battle Resolution Service initialized for game", {
      currentGameId,
    });
  }

  /**
   * Start the battle resolution interval
   */
  public async start() {
    if (this.resolutionInterval) {
      logger.info("🔄 Clearing existing battle resolution interval");
      clearInterval(this.resolutionInterval);
    }

    // Initial check
    await this.checkAndResolveBattles();

    this.resolutionInterval = setInterval(() => {
      logger.info("⏰ Running scheduled battle resolution check");
      this.checkAndResolveBattles();
    }, CHECK_INTERVAL);

    logger.info("🎯 Battle resolution interval started", {
      intervalMs: CHECK_INTERVAL,
    });
  }

  /**
   * Stop the battle resolution interval
   */
  public stop() {
    if (this.resolutionInterval) {
      logger.info("🛑 Stopping battle resolution interval");
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
    }
    logger.info("✋ Battle resolution interval stopped successfully");
  }

  /**
   * Group agents by their battle start time and alliance relationships
   */
  private async groupAgentsInBattle(
    agents: AgentAccount[]
  ): Promise<BattleGroup[]> {
    logger.info("🔍 Starting to group agents in battle", {
      agentCount: agents.length,
    });

    // First, group by battle start time
    const battleGroups = new Map<string, AgentAccount[]>();

    agents.forEach((agent) => {
      if (!agent.currentBattleStart) return;

      const key = agent.currentBattleStart.toString();
      if (!battleGroups.has(key)) {
        battleGroups.set(key, []);
      }
      battleGroups.get(key)?.push(agent);
    });

    logger.info("📊 Initial battle groups formed", {
      groupCount: battleGroups.size,
    });

    // Then, for each battle group, separate into sides based on alliances
    const battleGroupsArray = await Promise.all(
      Array.from(battleGroups.entries()).map(
        async ([startTime, groupAgents]) => {
          logger.info("⚔️ Processing battle group", {
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
                logger.debug("🤝 Fetching alliance account for agent", {
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
                logger.error(
                  `❌ Failed to fetch alliance for agent ${agent.id}:`,
                  error
                );
                return null;
              }
            });

          const alliances = (await Promise.all(alliancePromises)).filter(
            (alliance): alliance is AllianceInfo => alliance !== null
          );

          logger.info("🤝 Alliance accounts fetched successfully", {
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

          logger.info("👥 Alliance pairs created and mapped", {
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

          logger.info("👤 Processing single agents for battle sides", {
            singleAgentCount: singleAgents.length,
          });

          singleAgents.forEach((agent) => {
            const side = assignedToSideA ? sides.sideA : sides.sideB;
            side.agents.push(agent);
            side.totalBalance += agent.tokenBalance.toNumber();
            assignedToSideA = !assignedToSideA;
          });

          logger.info("⚖️ Battle sides balanced and finalized", {
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

    logger.info("✅ Battle groups processing completed successfully", {
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
    logger.info("🎲 Calculating battle outcome based on balances", {
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

    logger.info("🏆 Battle outcome determined", {
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
    logger.info("🔍 Analyzing battle configuration", {
      sideAAgents: battleGroup.sides.sideA.agents.length,
      sideBAgents: battleGroup.sides.sideB.agents.length,
    });

    const { sides, currentBattleStart } = battleGroup;
    const { winningSide, percentLoss } =
      this.calculateBattleOutcome(battleGroup);

    // Simple battle (1v1)
    if (sides.sideA.agents.length === 1 && sides.sideB.agents.length === 1) {
      logger.info("⚔️ Detected Simple battle (1v1)");
      return {
        type: "Simple",
        outcome: {
          winnerId:
            winningSide === "sideA"
              ? sides.sideA.agents[0].id.toNumber()
              : sides.sideB.agents[0].id.toNumber(),
          loserId:
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
      logger.info("⚔️ Detected Agent vs Alliance battle (1v2)");
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
          singleAgentId: singleAgent.id.toNumber(),
          singleAgentAuthority: singleAgent.authority,
          allianceLeaderId: allianceLeader.id.toNumber(),
          allianceLeaderAuthority: allianceLeader.authority,
          alliancePartnerId: alliancePartner.id.toNumber(),
          alliancePartnerAuthority: alliancePartner.authority,
        },
      };
    }

    // Alliance vs Alliance (2v2)
    if (sides.sideA.agents.length === 2 && sides.sideB.agents.length === 2) {
      logger.info("⚔️ Detected Alliance vs Alliance battle (2v2)");
      const [allianceALeader, allianceAPartner] = sides.sideA.agents;
      const [allianceBLeader, allianceBPartner] = sides.sideB.agents;

      return {
        type: "AllianceVsAlliance",
        outcome: {
          allianceAWins: winningSide === "sideA",
          percentLoss,
          allianceALeaderId: allianceALeader.id.toNumber(),
          allianceALeaderAuthority: allianceALeader.authority,
          allianceAPartnerId: allianceAPartner.id.toNumber(),
          allianceAPartnerAuthority: allianceAPartner.authority,
          allianceBLeaderId: allianceBLeader.id.toNumber(),
          allianceBLeaderAuthority: allianceBLeader.authority,
          allianceBPartnerId: allianceBPartner.id.toNumber(),
          allianceBPartnerAuthority: allianceBPartner.authority,
        },
      };
    }

    logger.error("❌ Invalid battle configuration detected", {
      sideAAgents: sides.sideA.agents.length,
      sideBAgents: sides.sideB.agents.length,
    });

    throw new Error(
      `Invalid battle configuration: sideA=${sides.sideA.agents.length} agents, sideB=${sides.sideB.agents.length} agents`
    );
  }

  /**
   * Check for battles that need resolution and resolve them
   */
  private async checkAndResolveBattles() {
    try {
      logger.info("🔍 Starting battle resolution check cycle");
      const [gamePda] = getGamePDA(this.program.programId, this.currentGameId);
      const gameAccount = await this.program.account.game.fetch(gamePda);
      const agentInfos = gameAccount.agents as AgentInfo[];

      logger.info("📊 Retrieved game state and agent information", {
        totalAgents: agentInfos.length,
      });

      // Get all agents in battle
      const agentsInBattle = (
        await Promise.all(
          agentInfos.map(async (agentInfo) => {
            try {
              const agentAccount = (await this.program.account.agent.fetch(
                agentInfo.key
              )) as AgentAccount;
              if (agentAccount.isAlive && agentAccount.currentBattleStart) {
                return agentAccount;
              }
            } catch (error) {
              logger.error(
                `❌ Failed to fetch agent data ${agentInfo.key}:`,
                error
              );
            }
            return null;
          })
        )
      ).filter((agent): agent is AgentAccount => agent !== null);

      logger.info("⚔️ Identified active battles", {
        battleCount: agentsInBattle.length,
      });

      // Group agents by battle and alliances
      const battleGroups = await this.groupAgentsInBattle(agentsInBattle);

      // Resolve each battle
      for (const battleGroup of battleGroups) {
        try {
          // Validate battle duration
          const currentTime = Math.floor(Date.now() / 1000);
          const battleStartTime = battleGroup.currentBattleStart.toNumber();

          if (currentTime - battleStartTime < BATTLE_DURATION) {
            logger.info("⏳ Battle not ready for resolution", {
              timeRemaining: BATTLE_DURATION - (currentTime - battleStartTime),
            });
            continue;
          }

          const { type, outcome } = this.determineBattleType(battleGroup);

          logger.info("🎯 Processing battle resolution", { type });

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

          logger.info(`✅ Successfully resolved ${type} battle`);
        } catch (error) {
          logger.error(`❌ Battle resolution failed:`, error);
        }
      }
    } catch (error) {
      logger.error("❌ Battle resolution check cycle failed:", error);
    }
  }

  /**
   * Apply health penalty to losing agents and handle agent death
   */
  private async applyHealthPenalty(agentIds: string[]): Promise<void> {
    try {
      // Update health for all losing agents
      await Promise.all(
        agentIds.map(async (agentId) => {
          const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
          });

          if (!agent) {
            logger.error("Agent not found for health penalty", { agentId });
            return;
          }

          const newHealth = agent.health - HEALTH_PENALTY;

          if (newHealth <= 0) {
            // Kill agent both onchain and in database
            const [gamePda] = getGamePDA(
              this.program.programId,
              this.currentGameId
            );
            const [agentPda] = getAgentPDA(
              this.program.programId,
              gamePda,
              // agentId 1
              new BN(1) // refactor to use agentOnchainId
            );

            await this.program.methods
              .killAgent()
              .accounts({
                agent: agentPda,
              })
              .rpc();

            await this.prisma.agent.update({
              where: { id: agentId },
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
                  { attackerId: agentId },
                  { defenderId: agentId },
                  { attackerAllyId: agentId },
                  { defenderAllyId: agentId },
                ],
                status: "Active",
              },
              data: {
                status: "Cancelled",
                endTime: new Date(),
              },
            });

            logger.info("☠️ Agent killed due to health depletion", {
              agentId,
              finalHealth: 0,
            });
          } else {
            // Just update health
            await this.prisma.agent.update({
              where: { id: agentId },
              data: {
                health: newHealth,
              },
            });

            logger.info("💔 Applied health penalty to agent", {
              agentId,
              newHealth,
              penalty: HEALTH_PENALTY,
            });
          }
        })
      );
    } catch (error) {
      logger.error("Failed to apply health penalties:", error);
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
    logger.info("⚔️ Starting simple battle resolution", {
      winnerId: outcome.winnerId,
      loserId: outcome.loserId,
      percentLoss: outcome.percentLoss,
    });

    const [winnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.winnerId)
    );
    const [loserPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.loserId)
    );
    const winnerTokenAccount = await getAgentAta(winnerPda);
    const loserTokenAccount = await getAgentAta(loserPda);

    logger.info("💰 Retrieved token accounts for battle participants");

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
      await this.applyHealthPenalty([outcome.loserId.toString()]);

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            { attackerId: outcome.winnerId.toString() },
            { defenderId: outcome.winnerId.toString() },
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
              connect: { id: outcome.winnerId.toString() },
            },
            endTime: new Date(),
          },
        });
      }

      logger.info("🏆 Simple battle resolved successfully");
    } catch (error) {
      logger.error("Failed to resolve simple battle:", error);
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
    logger.info("⚔️ Starting agent vs alliance battle resolution", {
      singleAgentId: outcome.singleAgentId,
      allianceLeaderId: outcome.allianceLeaderId,
      alliancePartnerId: outcome.alliancePartnerId,
      percentLoss: outcome.percentLoss,
    });

    const [singleAgentPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.singleAgentId)
    );

    const [allianceLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceLeaderId)
    );

    const [alliancePartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.alliancePartnerId)
    );

    // Get token accounts
    const singleAgentToken = await getAgentAta(singleAgentPda);
    const allianceLeaderToken = await getAgentAta(allianceLeaderPda);
    const alliancePartnerToken = await getAgentAta(alliancePartnerPda);

    logger.info("💰 Retrieved token accounts for all battle participants");

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
          authority: this.program.provider.publicKey,
        })
        .rpc();

      // Apply health penalties to losing side
      if (outcome.agentIsWinner) {
        await this.applyHealthPenalty([
          outcome.allianceLeaderId.toString(),
          outcome.alliancePartnerId.toString(),
        ]);
      } else {
        await this.applyHealthPenalty([outcome.singleAgentId.toString()]);
      }

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            { attackerId: outcome.singleAgentId.toString() },
            { defenderId: outcome.singleAgentId.toString() },
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
                id: outcome.agentIsWinner
                  ? outcome.singleAgentId.toString()
                  : outcome.allianceLeaderId.toString(),
              },
            },
            endTime: new Date(),
          },
        });
      }

      logger.info("🏆 Agent vs Alliance battle resolved successfully");
    } catch (error) {
      logger.error("Failed to resolve agent vs alliance battle:", error);
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
    logger.info("⚔️ Starting alliance vs alliance battle resolution", {
      allianceALeaderId: outcome.allianceALeaderId,
      allianceAPartnerId: outcome.allianceAPartnerId,
      allianceBLeaderId: outcome.allianceBLeaderId,
      allianceBPartnerId: outcome.allianceBPartnerId,
      percentLoss: outcome.percentLoss,
    });

    const [allianceALeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceALeaderId)
    );
    const [allianceAPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceAPartnerId)
    );
    const [allianceBLeaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceBLeaderId)
    );
    const [allianceBPartnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.allianceBPartnerId)
    );

    // Get token accounts
    const allianceALeaderToken = await getAgentAta(allianceALeaderPda);
    const allianceAPartnerToken = await getAgentAta(allianceAPartnerPda);
    const allianceBLeaderToken = await getAgentAta(allianceBLeaderPda);
    const allianceBPartnerToken = await getAgentAta(allianceBPartnerPda);

    logger.info("💰 Retrieved token accounts for all alliance members");

    try {
      // Resolve battle onchain
      await this.program.methods
        .resolveBattleAllianceVsAlliance(
          new BN(outcome.percentLoss),
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
          outcome.allianceBLeaderId.toString(),
          outcome.allianceBPartnerId.toString(),
        ]);
      } else {
        await this.applyHealthPenalty([
          outcome.allianceALeaderId.toString(),
          outcome.allianceAPartnerId.toString(),
        ]);
      }

      // Update battle status in database
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          OR: [
            { attackerId: outcome.allianceALeaderId.toString() },
            { defenderId: outcome.allianceALeaderId.toString() },
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
                id: outcome.allianceAWins
                  ? outcome.allianceALeaderId.toString()
                  : outcome.allianceBLeaderId.toString(),
              },
            },
            endTime: new Date(),
          },
        });
      }

      logger.info("🏆 Alliance vs Alliance battle resolved successfully");
    } catch (error) {
      logger.error("Failed to resolve alliance vs alliance battle:", error);
      throw error;
    }
  }
}
