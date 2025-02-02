import { logger } from "@/utils/logger";
import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount, AgentInfo } from "@/types/program";
import { Prisma } from "@prisma/client";
import { getAgentAta } from "./utils/program";

type SimpleBattleOutcome = {
  winnerId: number;
  loserId: number;
  percentLoss: number;
};

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

type Battle = Prisma.BattleGetPayload<{
  include: {
    game: {
      select: {
        gameId: true;
      };
    };
    agent: true;
    opponent: {
      include: {
        currentAlliance: true;
      };
    };
  };
}>;

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

type AlliancePair = {
  leader: AgentAccount;
  partner: AgentAccount;
};

type AllianceInfo = {
  agent: AgentAccount;
  allianceAccount: AgentAccount;
};

/**
 * Service for handling battle resolutions via interval
 * Monitors active battles and resolves them after the 1 hour duration
 */
export class BattleResolutionService {
  private resolutionInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 3000000; // 5 mins in milliseconds
  private readonly currentGameId: number;
  // private readonly BATTLE_COOLDOWN = 3600; // 1 hour in seconds

  constructor(
    currentGameId: number,
    private readonly program: Program<MiddleEarthAiProgram>
  ) {
    this.currentGameId = currentGameId;
    logger.info("⚔️ Battle Resolution Service initialized");
  }

  /**
   * Start the battle resolution interval
   */
  public start() {
    // Clear any existing interval
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
    }

    this.resolutionInterval = setInterval(
      () => this.checkAndResolveBattles(),
      this.CHECK_INTERVAL
    );

    logger.info("⚔️ Battle resolution interval started");
  }

  /**
   * Stop the battle resolution interval
   */
  public stop() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
    }
    logger.info("⚔️ Battle resolution interval stopped");
  }

  /**
   * Group agents by their battle start time and alliance relationships
   */
  private async groupAgentsInBattle(
    agents: AgentAccount[]
  ): Promise<BattleGroup[]> {
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

    // Then, for each battle group, separate into sides based on alliances
    const battleGroupsArray = await Promise.all(
      Array.from(battleGroups.entries()).map(
        async ([startTime, groupAgents]) => {
          const sides = {
            sideA: { agents: [] as AgentAccount[], totalBalance: 0 },
            sideB: { agents: [] as AgentAccount[], totalBalance: 0 },
          };

          // First, fetch all alliance accounts for agents that have them
          const alliancePromises = groupAgents
            .filter((agent) => agent.allianceWith !== null)
            .map(async (agent) => {
              try {
                const allianceAccount = (await this.program.account.agent.fetch(
                  agent.allianceWith!
                )) as AgentAccount;
                return {
                  agent,
                  allianceAccount,
                } as AllianceInfo;
              } catch (error) {
                logger.error(
                  `Failed to fetch alliance for agent ${agent.id}:`,
                  error
                );
                return null;
              }
            });

          const alliances = (await Promise.all(alliancePromises)).filter(
            (alliance): alliance is AllianceInfo => alliance !== null
          );

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

          singleAgents.forEach((agent) => {
            const side = assignedToSideA ? sides.sideA : sides.sideB;
            side.agents.push(agent);
            side.totalBalance += agent.tokenBalance.toNumber();
            assignedToSideA = !assignedToSideA;
          });

          return {
            agents: groupAgents,
            currentBattleStart: new BN(startTime),
            sides,
          };
        }
      )
    );

    return battleGroupsArray;
  }

  /**
   * Calculate battle outcome based on token balances
   */
  private calculateBattleOutcome(battleGroup: BattleGroup): {
    winningSide: "sideA" | "sideB";
    percentLoss: number;
  } {
    const totalBalance =
      battleGroup.sides.sideA.totalBalance +
      battleGroup.sides.sideB.totalBalance;
    const sideAProbability =
      battleGroup.sides.sideA.totalBalance / totalBalance;

    // Determine winner
    const winningSide = Math.random() > sideAProbability ? "sideB" : "sideA";

    // Calculate loss percentage (20-30%)
    const percentLoss = 20 + Math.floor(Math.random() * 11);

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
    const { sides, currentBattleStart } = battleGroup;
    const { winningSide, percentLoss } =
      this.calculateBattleOutcome(battleGroup);

    // Simple battle (1v1)
    if (sides.sideA.agents.length === 1 && sides.sideB.agents.length === 1) {
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

    throw new Error(
      `Invalid battle configuration: sideA=${sides.sideA.agents.length} agents, sideB=${sides.sideB.agents.length} agents`
    );
  }

  /**
   * Check for battles that need resolution and resolve them
   */
  private async checkAndResolveBattles() {
    try {
      const [gamePda] = getGamePDA(this.program.programId, this.currentGameId);
      const gameAccount = await this.program.account.game.fetch(gamePda);
      const agentInfos = gameAccount.agents as AgentInfo[];

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
              logger.error(`Failed to fetch agent ${agentInfo.key}:`, error);
            }
            return null;
          })
        )
      ).filter((agent): agent is AgentAccount => agent !== null);

      // Group agents by battle and alliances
      const battleGroups = await this.groupAgentsInBattle(agentsInBattle);

      // Resolve each battle
      for (const battleGroup of battleGroups) {
        try {
          const { type, outcome } = this.determineBattleType(battleGroup);

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

          logger.info(`⚔️ Successfully resolved ${type} battle`);
        } catch (error) {
          logger.error(`Failed to resolve battle:`, error);
        }
      }
    } catch (error) {
      logger.error("Battle resolution check failed:", error);
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
      new BN(outcome.winnerId)
    );
    const [loserPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      new BN(outcome.loserId)
    );
    const winnerTokenAccount = await getAgentAta(winnerPda);
    const loserTokenAccount = await getAgentAta(loserPda);

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
  }
}
