/**
 * Battle Resolution (BR) Module
 * This module handles the organization and classification of battles between agents and alliances,
 * including battle outcome calculations based on token balances
 */

import { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { AgentAccount } from "@/types/program";
import * as anchor from "@coral-xyz/anchor";
import { PrismaClient } from "@prisma/client";
import { GameManager } from "./GameManager";
import { getAgentAta } from "@/utils/program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { PublicKey } from "@solana/web3.js";
const { BN } = anchor;

/**
 * Enum representing different types of battles that can occur
 */
enum BattleType {
  AGENT_VS_AGENT = "agentVsAgent", // 1v1 battle between two agents
  AGENT_VS_ALLIANCE = "agentVsAlliance", // Battle between a single agent and an alliance
  ALLIANCE_VS_ALLIANCE = "allianceVsAlliance", // Battle between two alliances
}

/**
 * Represents one side in a battle, containing one or more agents
 */
interface Side {
  agents: AgentAccount[];
  totalTokens?: number; // Total tokens held by this side
  isWinner?: boolean; // Whether this side won the battle
}

/**
 * Represents a battle instance with its participants and metadata
 */
interface Battle {
  startTime: anchor.BN; // When the battle started
  sides: Side[]; // The participating sides (usually 2)
  battleType: BattleType; // Classification of the battle
  percentageLoss?: number; // Percentage of tokens lost by losing side (21-30%)
  winningProbability?: number; // Probability of winning based on token ratios
}

export class BattleResolver {
  private resolutionInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly program: anchor.Program<MiddleEarthAiProgram>,
    private readonly prisma: PrismaClient,
    private readonly gameManager: GameManager
  ) {
    console.log("🎮 Battle Resolution Service initialized");
  }

  /**
   * Start the battle resolution service
   */
  public async start(checkIntervalMs: number = 60000) {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
    }

    // Initial battle resolution
    await this.resolvePendingBattles();

    // Set up interval for continuous monitoring
    this.resolutionInterval = setInterval(
      () => this.resolvePendingBattles(),
      checkIntervalMs
    );

    console.log("🎯 Battle resolution service started", { checkIntervalMs });
  }

  private async resolvePendingBattles() {
    const game = await this.gameManager.getActiveGame();
    const [gamePda] = getGamePDA(this.program.programId, game.dbGame.id);
    const agents = game.agents.map((a) => a.account);
    const battles = this.groupAgentsInBattles(agents);
    console.log("🎯 Resolving battles", battles);
    for (const battle of battles) {
      await this.settleBattle(battle, gamePda);
    }
  }

  private async settleBattle(battle: Battle, gamePda: PublicKey) {
    console.log("Settling battle", battle);

    switch (battle.battleType) {
      case BattleType.AGENT_VS_AGENT: {
        const winnerSide = battle.sides.find((side) => side.isWinner);
        if (!winnerSide) {
          throw new Error("No winner found in battle");
        }
        const loserSide = battle.sides.find((side) => !side.isWinner);
        if (!loserSide) {
          throw new Error("No loser found in battle");
        }

        const [winnerPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          winnerSide.agents[0].id
        );
        const winnerAta = await getAgentAta(winnerPda);

        const [loserPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          loserSide.agents[0].id
        );
        const loserAta = await getAgentAta(loserPda);

        await this.program.methods
          .resolveBattleSimple(new BN(battle.percentageLoss))
          .accounts({
            winner: winnerPda,
            loser: loserPda,
            winnerToken: winnerAta.address,
            loserToken: loserAta.address,
          })
          .rpc();
        break;
      }
      case BattleType.AGENT_VS_ALLIANCE: {
        const singleAgent = battle.sides.find(
          (side) => side.agents.length === 1
        )?.agents[0];
        if (!singleAgent) {
          throw new Error("No single agent found in battle");
        }
        const [singleAgentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          singleAgent.id
        );
        const singleAgentAta = await getAgentAta(singleAgentPda);

        const allianceLeader = battle.sides.find(
          (side) => side.agents.length > 1
        )?.agents[0];
        if (!allianceLeader) {
          throw new Error("No alliance leader found in battle");
        }
        const [allianceLeaderPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          allianceLeader.id
        );
        const allianceLeaderAta = await getAgentAta(allianceLeaderPda);

        const alliancePartner = battle.sides.find(
          (side) => side.agents.length > 1
        )?.agents[1];
        if (!alliancePartner) {
          throw new Error("No alliance partner found in battle");
        }
        const [alliancePartnerPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          alliancePartner.id
        );
        const alliancePartnerAta = await getAgentAta(alliancePartnerPda);

        await this.program.methods
          .resolveBattleAgentVsAlliance(
            new BN(battle.percentageLoss),
            battle.sides[0].agents.length === 1 && battle.sides[0].isWinner
              ? true
              : false
          )
          .accounts({
            singleAgent: singleAgentPda,
            allianceLeader: allianceLeaderPda,
            alliancePartner: alliancePartnerPda,
            allianceLeaderToken: allianceLeaderAta.address,
            alliancePartnerToken: alliancePartnerAta.address,
            singleAgentToken: singleAgentAta.address,
          })
          .rpc();

        break;
      }
      case BattleType.ALLIANCE_VS_ALLIANCE: {
        const allianceAWinner = battle.sides.find((side) => side.isWinner);
        if (!allianceAWinner) {
          throw new Error("No winner found in battle");
        }
        const allianceBLoser = battle.sides.find((side) => !side.isWinner);
        if (!allianceBLoser) {
          throw new Error("No loser found in battle");
        }

        const [allianceALeaderPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          allianceAWinner.agents[0].id
        );
        const allianceALeaderAta = await getAgentAta(allianceALeaderPda);

        const [allianceAPartnerPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          allianceAWinner.agents[1].id
        );
        const allianceAPartnerAta = await getAgentAta(allianceAPartnerPda);

        const [allianceBLeaderPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          allianceBLoser.agents[0].id
        );
        const allianceBLoserLeaderAta = await getAgentAta(allianceBLeaderPda);

        const [allianceBPartnerPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          allianceBLoser.agents[1].id
        );
        const allianceBLoserPartnerAta = await getAgentAta(allianceBPartnerPda);

        await this.program.methods
          .resolveBattleAllianceVsAlliance(
            new BN(battle.percentageLoss),
            allianceAWinner.isWinner ?? false
          )
          .accounts({
            leaderA: allianceALeaderPda,
            partnerA: allianceAPartnerPda,
            leaderB: allianceBLeaderPda,
            partnerB: allianceBPartnerPda,
            leaderAToken: allianceALeaderAta.address,
            partnerAToken: allianceAPartnerAta.address,
            leaderBToken: allianceBLoserLeaderAta.address,
            partnerBToken: allianceBLoserPartnerAta.address,
          })
          .rpc();

        break;
      }
      default:
        throw new Error("Invalid battle type");
    }
  }

  /**
   * Groups agents into their respective battles and organizes them by direct alliances only
   * @param agents Array of all agents to be organized into battles
   * @returns Array of Battle objects representing all ongoing battles
   */
  private groupAgentsInBattles(agents: AgentAccount[]): Battle[] {
    const battles: Battle[] = [];
    const battleMap = new Map<string, AgentAccount[]>();

    // First pass: Group agents by their battle start time
    for (const agent of agents) {
      if (agent.currentBattleStart) {
        const battleKey = agent.currentBattleStart.toString();
        if (!battleMap.has(battleKey)) {
          battleMap.set(battleKey, []);
        }
        battleMap.get(battleKey)!.push(agent);
      }
    }

    // Second pass: Process each battle time group and organize into direct alliances
    for (const [startTime, battleAgents] of battleMap) {
      const sides: Side[] = [];
      const processedAgents = new Set<string>();

      // Process each agent in the current battle
      for (const agent of battleAgents) {
        if (!processedAgents.has(agent.id.toString())) {
          const allianceGroup: AgentAccount[] = [agent];
          processedAgents.add(agent.id.toString());

          // Check for direct alliance only
          if (agent.allianceWith) {
            const directAlly = battleAgents.find((a) =>
              a.authority.equals(agent.allianceWith!)
            );
            if (directAlly && !processedAgents.has(directAlly.id.toString())) {
              allianceGroup.push(directAlly);
              processedAgents.add(directAlly.id.toString());
            }
          }

          // Check for agents directly allied with the current agent
          const directAllies = battleAgents.filter(
            (a) =>
              a.allianceWith &&
              a.allianceWith.equals(agent.authority) &&
              !processedAgents.has(a.id.toString())
          );

          for (const ally of directAllies) {
            allianceGroup.push(ally);
            processedAgents.add(ally.id.toString());
          }

          if (allianceGroup.length > 0) {
            // Calculate total tokens for this side
            const totalTokens = allianceGroup.reduce(
              (sum, agent) => sum + (agent.tokenBalance?.toNumber() || 0),
              0
            );
            sides.push({ agents: allianceGroup, totalTokens });
          }
        }
      }

      const battleType = this.determineBattleType(sides);
      const { winProbability, lossPercentage } =
        this.calculateBattleOutcome(sides);

      // Determine winner based on probability
      const randomValue = Math.random() * 100;
      sides[0].isWinner = randomValue <= winProbability;
      sides[1].isWinner = !sides[0].isWinner;

      battles.push({
        startTime: new BN(startTime),
        sides: sides,
        battleType: battleType,
        percentageLoss: lossPercentage,
        winningProbability: winProbability,
      });
    }

    return battles;
  }

  /**
   * Calculates the winning probability and potential loss percentage for a battle
   * @param sides Array of sides participating in the battle
   * @returns Object containing winning probability and loss percentage
   */
  private calculateBattleOutcome(sides: Side[]): {
    winProbability: number;
    lossPercentage: number;
  } {
    const totalTokens = sides.reduce(
      (sum, side) => sum + (side.totalTokens || 0),
      0
    );
    const winProbability =
      totalTokens > 0 ? ((sides[0].totalTokens || 0) / totalTokens) * 100 : 50;

    // Random loss percentage between 21-30%
    const lossPercentage = Math.floor(Math.random() * 10) + 21;

    return { winProbability, lossPercentage };
  }

  /**
   * Determines the type of battle based on the composition of the sides
   * @param sides Array of sides participating in the battle
   * @returns The appropriate BattleType
   */
  private determineBattleType(sides: Side[]): BattleType {
    if (sides.length !== 2) {
      return BattleType.AGENT_VS_AGENT;
    }

    const sideAHasAlliance = sides[0].agents.length > 1;
    const sideBHasAlliance = sides[1].agents.length > 1;

    if (sideAHasAlliance && sideBHasAlliance) {
      return BattleType.ALLIANCE_VS_ALLIANCE;
    } else if (sideAHasAlliance || sideBHasAlliance) {
      return BattleType.AGENT_VS_ALLIANCE;
    } else {
      return BattleType.AGENT_VS_AGENT;
    }
  }
}
