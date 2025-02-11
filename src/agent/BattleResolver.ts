import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { AgentAccount } from "@/types/program";
import { Agent, Prisma, PrismaClient } from "@prisma/client";
import { getAgentAta } from "../utils/program";
import { gameConfig } from "@/config/env";
import { GameManager } from "./GameManager";

// Battle cooldown constant (in seconds)
const BATTLE_COOLDOWN = gameConfig.mechanics.cooldowns.battle; // 1hr

// Battle types
type BattleType = "SIMPLE" | "AGENT_VS_ALLIANCE" | "ALLIANCE_VS_ALLIANCE";

// Battle participant
type BattleParticipant = {
  agentAccount: AgentAccount;
  agent: Agent;
  tokenAccountPub: PublicKey;
};

// Battle group
type BattleGroup = {
  type: BattleType;
  startTime: number;
  sideA: BattleParticipant[];
  sideB: BattleParticipant[];
};

type Battle = Prisma.BattleGetPayload<{
  include: {
    attacker: true;
    defender: true;
    attackerAlly: true;
    defenderAlly: true;
  };
}>;

/**
 * Battle resolver
 */
export class BattleResolver {
  private resolutionInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly program: Program<MiddleEarthAiProgram>,
    private readonly gameManager: GameManager,
    private readonly prisma: PrismaClient
  ) {
    console.log("🎮 Battle Resolution Service initialized");
  }

  /**
   * Fetch the most active game from the database
   */
  private async fetchActiveGame() {
    try {
      const activeGame = await this.prisma.game.findFirst({
        where: {
          isActive: true,
          agents: {
            some: {
              isAlive: true,
            },
          },
        },
        orderBy: [{ lastUpdate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          onchainId: true,
          _count: {
            select: {
              agents: true,
            },
          },
        },
      });

      if (!activeGame) {
        console.log("⚠️ No active game found");
        return null;
      }

      console.log("🎮 Processing active game", {
        gameId: activeGame.id,
        onchainId: activeGame.onchainId,
        agentCount: activeGame._count.agents,
      });

      return activeGame;
    } catch (error) {
      console.error("❌ Failed to fetch active game", error);
      return null;
    }
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

  /**
   * Stop the battle resolution service
   */
  public stop() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
      console.log("✋ Battle resolution service stopped");
    }
  }

  /**
   * Resolve all pending battles
   */
  private async resolvePendingBattles() {
    try {
      // Fetch the latest active game
      const activeGame = await this.fetchActiveGame();
      if (!activeGame) return;

      // Get all active battles from database
      const activeBattles = await this.prisma.battle.findMany({
        where: {
          gameId: activeGame.id,
          status: "Active",
        },
        include: {
          attacker: true,
          defender: true,
          attackerAlly: true,
          defenderAlly: true,
        },
      });

      if (!activeBattles.length) return;

      console.log("⚔️ Processing active battles", {
        count: activeBattles.length,
        gameId: activeGame.id,
      });

      // Process each battle in parallel
      await Promise.all(
        activeBattles.map(async (battle) => {
          try {
            const battleGroup = await this.createBattleGroup(
              battle,
              activeGame
            );
            if (!battleGroup) return;

            if (!this.isBattleReadyToResolve(battleGroup)) {
              return;
            }

            await this.resolveBattle(battleGroup, activeGame);
          } catch (error) {
            console.error("❌ Failed to process battle", {
              battleId: battle.id,
              error,
            });
          }
        })
      );
    } catch (error) {
      console.error("❌ Battle resolution cycle failed", error);
    }
  }

  /**
   * Create a battle group from database battle record
   */
  private async createBattleGroup(
    battle: Battle,
    game: { id: string; onchainId: number }
  ): Promise<BattleGroup | null> {
    try {
      const sideA: BattleParticipant[] = [];
      const sideB: BattleParticipant[] = [];

      // Get PDAs and token accounts for all participants
      const [gamePda] = getGamePDA(this.program.programId, game.onchainId);

      // Helper function to create battle participant
      const createParticipant = async (
        agent: Agent
      ): Promise<BattleParticipant> => {
        const [agentPda] = getAgentPDA(
          this.program.programId,
          gamePda,
          agent.onchainId
        );
        const ata = await getAgentAta(agentPda);
        if (!ata)
          throw new Error(
            `Failed to get token account for agent ${agent.onchainId}`
          );

        const agentAccount = await this.program.account.agent.fetch(agentPda);

        return {
          agentAccount,
          agent,
          tokenAccountPub: ata.address,
        };
      };

      // Process attacker side
      sideA.push(await createParticipant(battle.attacker));
      if (battle.attackerAlly) {
        sideA.push(await createParticipant(battle.attackerAlly));
      }

      // Process defender side
      sideB.push(await createParticipant(battle.defender));
      if (battle.defenderAlly) {
        sideB.push(await createParticipant(battle.defenderAlly));
      }

      return {
        type: this.determineBattleType(sideA.length, sideB.length),
        startTime: battle.startTime.getTime() / 1000,
        sideA,
        sideB,
      };
    } catch (error) {
      console.error("❌ Failed to create battle group", error);
      return null;
    }
  }

  /**
   * Determine battle type based on participant count
   */
  private determineBattleType(
    sideACount: number,
    sideBCount: number
  ): BattleType {
    if (sideACount === 1 && sideBCount === 1) return "SIMPLE";
    if (sideACount === 2 && sideBCount === 2) return "ALLIANCE_VS_ALLIANCE";
    return "AGENT_VS_ALLIANCE";
  }

  /**
   * Check if battle is ready to be resolved
   */
  private isBattleReadyToResolve(battle: BattleGroup): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const cooldown = BATTLE_COOLDOWN;
    return currentTime - battle.startTime >= cooldown;
  }

  /**
   * Calculate battle outcome with improved randomness and balance
   */
  private calculateBattleOutcome(
    sideA: BattleParticipant[],
    sideB: BattleParticipant[]
  ): {
    sideAWins: boolean;
    percentLoss: number;
  } {
    // Calculate total power for each side (tokens + health)
    const calculatePower = (side: BattleParticipant[]) => {
      return side.reduce((sum, p) => {
        const tokenPower = p.agentAccount.tokenBalance.toNumber();
        return sum + tokenPower;
      }, 0);
    };

    const sideAPower = calculatePower(sideA);
    const sideBPower = calculatePower(sideB);
    const totalPower = sideAPower + sideBPower;

    // Calculate win probability with power ratio and randomness
    const baseProbability = sideAPower / totalPower;
    const randomFactor = Math.random() * 0.3; // 30% random factor
    const finalProbability = baseProbability * 0.7 + randomFactor;

    // Calculate loss percentage based on power difference
    const powerDiff = Math.abs(baseProbability - 0.5);
    const baseLoss = 20; // Minimum 20% loss
    const maxAdditionalLoss = 20; // Up to additional 20% based on power difference
    const percentLoss = Math.floor(baseLoss + powerDiff * maxAdditionalLoss);

    return {
      sideAWins: finalProbability > 0.5,
      percentLoss: Math.min(percentLoss, 50), // Cap at 50%
    };
  }

  /**
   * Resolve a battle
   */
  private async resolveBattle(
    battle: BattleGroup,
    game: { id: string; onchainId: number }
  ) {
    const { sideAWins, percentLoss } = this.calculateBattleOutcome(
      battle.sideA,
      battle.sideB
    );
    const [gamePda] = getGamePDA(this.program.programId, game.onchainId);

    try {
      switch (battle.type) {
        case "SIMPLE":
          await this.resolveSimpleBattle(
            gamePda,
            battle.sideA[0],
            battle.sideB[0],
            percentLoss
          );
          break;

        case "AGENT_VS_ALLIANCE":
          const [single, alliance] =
            battle.sideA.length === 1
              ? [battle.sideA[0], battle.sideB]
              : [battle.sideB[0], battle.sideA];

          await this.resolveAgentVsAllianceBattle(
            gamePda,
            single,
            alliance[0],
            alliance[1],
            sideAWins === (battle.sideA.length === 1), // single wins if sideA is single
            percentLoss
          );
          break;

        case "ALLIANCE_VS_ALLIANCE":
          await this.resolveAllianceVsAllianceBattle(
            gamePda,
            battle.sideA[0],
            battle.sideA[1],
            battle.sideB[0],
            battle.sideB[1],
            sideAWins,
            percentLoss
          );
          break;
      }

      // Update battle status and apply health penalties
      await this.finalizeBattle(
        sideAWins ? battle.sideA : battle.sideB,
        sideAWins ? battle.sideB : battle.sideA,
        game
      );
    } catch (error) {
      console.error("❌ Battle resolution failed", error);
      throw error;
    }
  }

  /**
   * Resolve a simple battle between two agents
   */
  private async resolveSimpleBattle(
    gamePda: PublicKey,
    winner: BattleParticipant,
    loser: BattleParticipant,
    percentLoss: number
  ) {
    const [winnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      winner.agent.onchainId
    );
    const [loserPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      loser.agent.onchainId
    );

    await this.program.methods
      .resolveBattleSimple(new BN(percentLoss))
      .accounts({
        winner: winnerPda,
        loser: loserPda,
        winnerToken: winner.tokenAccountPub,
        loserToken: loser.tokenAccountPub,
        loserAuthority: loser.agent.authority,
        authority: this.program.provider.publicKey,
      })
      .rpc();
  }

  /**
   * Resolve a battle between an agent and an alliance
   */
  private async resolveAgentVsAllianceBattle(
    gamePda: PublicKey,
    single: BattleParticipant,
    leader: BattleParticipant,
    partner: BattleParticipant,
    singleWins: boolean,
    percentLoss: number
  ) {
    const [singlePda] = getAgentPDA(
      this.program.programId,
      gamePda,
      single.agent.onchainId
    );
    const [leaderPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      leader.agent.onchainId
    );
    const [partnerPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      partner.agent.onchainId
    );

    await this.program.methods
      .resolveBattleAgentVsAlliance(new BN(percentLoss), singleWins)
      .accounts({
        singleAgent: singlePda,
        allianceLeader: leaderPda,
        alliancePartner: partnerPda,
        singleAgentToken: single.tokenAccountPub,
        allianceLeaderToken: leader.tokenAccountPub,
        alliancePartnerToken: partner.tokenAccountPub,
        singleAgentAuthority: single.agent.authority,
        allianceLeaderAuthority: leader.agent.authority,
        alliancePartnerAuthority: partner.agent.authority,
        authority: this.program.provider.publicKey,
      })
      .rpc();
  }

  /**
   * Resolve a battle between two alliances
   */
  private async resolveAllianceVsAllianceBattle(
    gamePda: PublicKey,
    leaderA: BattleParticipant,
    partnerA: BattleParticipant,
    leaderB: BattleParticipant,
    partnerB: BattleParticipant,
    allianceAWins: boolean,
    percentLoss: number
  ) {
    const [leaderAPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      leaderA.agent.onchainId
    );
    const [partnerAPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      partnerA.agent.onchainId
    );
    const [leaderBPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      leaderB.agent.onchainId
    );
    const [partnerBPda] = getAgentPDA(
      this.program.programId,
      gamePda,
      partnerB.agent.onchainId
    );

    await this.program.methods
      .resolveBattleAllianceVsAlliance(new BN(percentLoss), allianceAWins)
      .accounts({
        leaderA: leaderAPda,
        partnerA: partnerAPda,
        leaderB: leaderBPda,
        partnerB: partnerBPda,
        leaderAToken: leaderA.tokenAccountPub,
        partnerAToken: partnerA.tokenAccountPub,
        leaderBToken: leaderB.tokenAccountPub,
        partnerBToken: partnerB.tokenAccountPub,
        leaderAAuthority: leaderA.agent.authority,
        partnerAAuthority: partnerA.agent.authority,
        leaderBAuthority: leaderB.agent.authority,
        partnerBAuthority: partnerB.agent.authority,
        authority: this.program.provider.publicKey,
      })
      .rpc();
  }

  /**
   * Finalize battle by updating status and applying health penalties
   */
  private async finalizeBattle(
    winners: BattleParticipant[],
    losers: BattleParticipant[],
    game: { id: string; onchainId: number }
  ) {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Update battle status
        await prisma.battle.updateMany({
          where: {
            OR: [
              { attacker: { onchainId: winners[0].agent.onchainId } },
              { defender: { onchainId: winners[0].agent.onchainId } },
            ],
            status: "Active",
            gameId: game.id,
          },
          data: {
            status: "Resolved",
            endTime: new Date(),
          },
        });

        // Kill any agent that happen to have a death chance in the range 5% - 10%
        await Promise.all(
          losers.map(async (loser) => {
            const shouldDie = Math.random() <= 0.1; // 10% chance of death

            await prisma.agent.update({
              where: {
                onchainId_gameId: {
                  onchainId: loser.agent.onchainId,
                  gameId: game.id,
                },
              },
              data: {
                isAlive: !shouldDie,
                ...(shouldDie ? { deathTimestamp: new Date() } : {}),
              },
            });

            if (shouldDie) {
              const [gamePda] = getGamePDA(
                this.program.programId,
                game.onchainId
              );
              const [agentPda] = getAgentPDA(
                this.program.programId,
                gamePda,
                loser.agent.onchainId
              );

              await this.program.methods
                .killAgent()
                .accounts({
                  agent: agentPda,
                })
                .rpc();
            }
          })
        );
      });
    } catch (error) {
      console.error("❌ Failed to finalize battle", error);
      throw error;
    }
  }
}
