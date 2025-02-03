import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MearthProgram } from "@/types";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { logger } from "@/utils/logger";
import { TerrainType, AgentAccount, GameAccount } from "@/types/program";
import { PrismaClient } from "@prisma/client";

// Constants
const BATTLE_COOLDOWN = 3600000; // 1 hour in ms
const MOVEMENT_COOLDOWN = 1800000; // 30 minutes in ms
const ALLIANCE_COOLDOWN = 86400000; // 24 hours in ms
const BATTLE_RANGE = 2;
const CURRENT_TIMESTAMP = () => new BN(Math.floor(Date.now() / 1000)); //

export interface ActionContext {
  program: MearthProgram;
  gameId: number;
  agentId: string;
  prisma?: PrismaClient;
}

export interface MoveAction {
  type: "MOVE";
  x: number;
  y: number;
  terrain?: TerrainType;
}

export interface BattleAction {
  type: "BATTLE";
  targetId: string;
  allyId?: string;
  tokensToStake: number;
}

export interface AllianceAction {
  type: "ALLIANCE";
  targetId: string;
  combinedTokens?: number;
}

export type GameAction = MoveAction | BattleAction | AllianceAction;

export class ActionManager {
  private readonly program: MearthProgram;
  private readonly gameId: number;
  private readonly prisma?: PrismaClient;

  constructor(program: MearthProgram, gameId: number, prisma?: PrismaClient) {
    this.program = program;
    this.gameId = gameId;
    this.prisma = prisma;
  }

  /**
   * Fetch and validate game state
   */
  private async validateGameState(): Promise<GameAccount> {
    const [gamePda] = getGamePDA(this.program.programId, new BN(this.gameId));
    const gameAccount = await this.program.account.game.fetch(gamePda);

    if (!gameAccount.isActive) {
      throw new Error("Game is not active");
    }

    return gameAccount;
  }

  /**
   * Fetch and validate agent state
   */
  private async validateAgentState(
    agentPda: PublicKey,
    context: string
  ): Promise<AgentAccount> {
    const agentAccount = await this.program.account.agent.fetch(agentPda);

    if (!agentAccount.isAlive) {
      throw new Error(`${context}: Agent is not alive`);
    }

    if (agentAccount.currentBattleStart !== null) {
      throw new Error(`${context}: Agent is currently in battle`);
    }

    return agentAccount;
  }

  /**
   * Execute a game action with optimized validation
   */
  async executeAction(agentId: string, action: GameAction): Promise<void> {
    const context: ActionContext = {
      program: this.program,
      gameId: this.gameId,
      agentId,
      prisma: this.prisma,
    };

    // Validate game state first
    await this.validateGameState();

    try {
      switch (action.type) {
        case "MOVE":
          await this.handleMove(context, action);
          break;
        case "BATTLE":
          await this.handleBattle(context, action);
          break;
        case "ALLIANCE":
          await this.handleAlliance(context, action);
          break;
        default:
          throw new Error("Invalid action type");
      }
    } catch (error) {
      logger.error("Failed to execute action", {
        agentId,
        action,
        error,
      });
      throw error;
    }
  }

  /**
   * Handle agent movement with enhanced validation
   */
  private async handleMove(
    context: ActionContext,
    action: MoveAction
  ): Promise<void> {
    const { program, gameId, agentId } = context;
    const currentTime = CURRENT_TIMESTAMP();

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(program.programId, new BN(gameId));
      const [agentPda] = getAgentPDA(program.programId, gamePda, agentId);

      // Fetch and validate agent state
      const agentAccount = await this.validateAgentState(agentPda, "Move");

      // Validate movement cooldown onchain
      if (agentAccount.nextMoveTime.gt(currentTime)) {
        throw new Error("Agent is on movement cooldown onchain");
      }

      // Validate coordinates against game map
      const gameAccount = await this.program.account.game.fetch(gamePda);
      if (
        action.x < 0 ||
        action.y < 0 ||
        action.x >= gameAccount.mapDiameter ||
        action.y >= gameAccount.mapDiameter
      ) {
        throw new Error("Invalid coordinates: Out of map bounds");
      }

      // Additional offchain validations
      await this.validateMove(context, action);

      // Execute onchain movement
      await program.methods
        .moveAgent(new BN(action.x), new BN(action.y))
        .accounts({
          agent: agentPda,
          authority: program.provider.publicKey,
        })
        .rpc();

      // Update database if prisma is available
      if (context.prisma) {
        await this.updateMoveInDatabase(context, action, agentId);
      }

      logger.info("Agent movement successful", {
        agentId,
        x: action.x,
        y: action.y,
      });
    } catch (error) {
      logger.error("Movement failed", { error, agentId, action });
      throw error;
    }
  }

  /**
   * Handle battle initiation with enhanced validation
   */
  private async handleBattle(
    context: ActionContext,
    action: BattleAction
  ): Promise<void> {
    const { program, gameId, agentId } = context;
    const currentTime = CURRENT_TIMESTAMP();

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(program.programId, new BN(gameId));
      const [attackerPda] = getAgentPDA(program.programId, gamePda, agentId);
      const [defenderPda] = getAgentPDA(
        program.programId,
        gamePda,
        action.targetId
      );

      // Fetch and validate both agents' states
      const [attackerAccount, defenderAccount] = await Promise.all([
        this.validateAgentState(attackerPda, "Battle-Attacker"),
        this.validateAgentState(defenderPda, "Battle-Defender"),
      ]);

      // Validate battle cooldowns onchain
      if (attackerAccount.lastBattle.gt(currentTime)) {
        throw new Error("Attacker is on battle cooldown onchain");
      }
      if (defenderAccount.lastBattle.gt(currentTime)) {
        throw new Error("Defender is on battle cooldown onchain");
      }

      // Validate token balances
      if (attackerAccount.tokenBalance.lt(new BN(action.tokensToStake))) {
        throw new Error("Insufficient tokens for battle");
      }

      // Additional offchain validations
      await this.validateBattle(context, action);

      let tx: string;

      // Handle different battle types based on alliance status
      if (attackerAccount.allianceWith && defenderAccount.allianceWith) {
        tx = await this.handleAllianceVsAllianceBattle(
          program,
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else if (attackerAccount.allianceWith || defenderAccount.allianceWith) {
        tx = await this.handleAgentVsAllianceBattle(
          program,
          gamePda,
          attackerPda,
          defenderPda,
          attackerAccount,
          defenderAccount
        );
      } else {
        tx = await this.handleSimpleBattle(program, attackerPda, defenderPda);
      }

      // Update database if prisma is available
      if (context.prisma) {
        await this.updateBattleInDatabase(
          context,
          action,
          attackerAccount,
          defenderAccount
        );
      }

      logger.info("Battle initiated successfully", {
        attackerId: agentId,
        defenderId: action.targetId,
        tokensStaked: action.tokensToStake,
        battleType: this.determineBattleType(attackerAccount, defenderAccount),
        transactionHash: tx,
      });
    } catch (error) {
      logger.error("Battle initiation failed", { error, agentId, action });
      throw error;
    }
  }

  /**
   * Handle alliance formation with enhanced validation
   */
  private async handleAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<void> {
    const { program, gameId, agentId } = context;

    try {
      // Get PDAs
      const [gamePda] = getGamePDA(program.programId, new BN(gameId));
      const [initiatorPda] = getAgentPDA(program.programId, gamePda, agentId);
      const [joinerPda] = getAgentPDA(
        program.programId,
        gamePda,
        action.targetId
      );

      // Fetch and validate both agents' states
      const [initiatorAccount, joinerAccount] = await Promise.all([
        this.validateAgentState(initiatorPda, "Alliance-Initiator"),
        this.validateAgentState(joinerPda, "Alliance-Joiner"),
      ]);

      // Validate alliance status onchain
      if (initiatorAccount.allianceWith !== null) {
        throw new Error("Initiator already has an alliance");
      }
      if (joinerAccount.allianceWith !== null) {
        throw new Error("Joiner already has an alliance");
      }

      // Additional offchain validations
      await this.validateAlliance(context, action);

      // Execute onchain alliance
      await program.methods
        .formAlliance()
        .accounts({
          initiator: initiatorPda,
          targetAgent: joinerPda,
        })
        .rpc();

      // Update database if prisma is available
      if (context.prisma) {
        await this.updateAllianceInDatabase(context, action);
      }

      logger.info("Alliance formed successfully", {
        initiatorId: agentId,
        joinerId: action.targetId,
      });
    } catch (error) {
      logger.error("Alliance formation failed", { error, agentId, action });
      throw error;
    }
  }

  // Helper methods for battle handling
  private async handleAllianceVsAllianceBattle(
    program: MearthProgram,
    gamePda: PublicKey,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    const [attackerAllyPda] = getAgentPDA(
      program.programId,
      gamePda,
      attackerAccount.allianceWith!.toString()
    );
    const [defenderAllyPda] = getAgentPDA(
      program.programId,
      gamePda,
      defenderAccount.allianceWith!.toString()
    );

    return program.methods
      .startBattleAlliances()
      .accounts({
        leaderA: attackerPda,
        partnerA: attackerAllyPda,
        leaderB: defenderPda,
        partnerB: defenderAllyPda,
        authority: program.provider.publicKey,
      })
      .rpc();
  }

  private async handleAgentVsAllianceBattle(
    program: MearthProgram,
    gamePda: PublicKey,
    attackerPda: PublicKey,
    defenderPda: PublicKey,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<string> {
    const allianceLeaderPda = attackerAccount.allianceWith
      ? attackerPda
      : defenderPda;
    const alliancePartnerPda = attackerAccount.allianceWith
      ? getAgentPDA(
          program.programId,
          gamePda,
          attackerAccount.allianceWith.toString()
        )[0]
      : getAgentPDA(
          program.programId,
          gamePda,
          defenderAccount.allianceWith!.toString()
        )[0];
    const singleAgentPda = attackerAccount.allianceWith
      ? defenderPda
      : attackerPda;

    return program.methods
      .startBattleAgentVsAlliance()
      .accounts({
        attacker: singleAgentPda,
        allianceLeader: allianceLeaderPda,
        alliancePartner: alliancePartnerPda,
        authority: program.provider.publicKey,
      })
      .rpc();
  }

  private async handleSimpleBattle(
    program: MearthProgram,
    attackerPda: PublicKey,
    defenderPda: PublicKey
  ): Promise<string> {
    return program.methods
      .startBattleSimple()
      .accounts({
        winner: attackerPda,
        loser: defenderPda,
        authority: program.provider.publicKey,
      })
      .rpc();
  }

  // Helper methods for database updates
  private async updateMoveInDatabase(
    context: ActionContext,
    action: MoveAction,
    agentId: string
  ): Promise<void> {
    await context.prisma!.agent.update({
      where: { id: agentId },
      data: {
        mapTiles: {
          connect: {
            x_y: {
              x: action.x,
              y: action.y,
            },
          },
        },
      },
    });

    await context.prisma!.coolDown.create({
      data: {
        type: "Move",
        endsAt: new Date(Date.now() + MOVEMENT_COOLDOWN),
        cooledAgentId: agentId,
        gameId: context.gameId.toString(),
      },
    });
  }

  /**
   * Validate movement action
   * Checks for tile occupation and movement cooldowns in the database
   */
  private async validateMove(
    context: ActionContext,
    action: MoveAction
  ): Promise<void> {
    if (context.prisma) {
      // Check if tile is occupied
      const occupiedTile = await context.prisma.mapTile.findFirst({
        where: {
          x: action.x,
          y: action.y,
          occupiedBy: {
            not: null,
          },
        },
      });

      if (occupiedTile) {
        throw new Error("Tile is already occupied");
      }

      // Check if agent is on cooldown
      const activeCooldown = await context.prisma.coolDown.findFirst({
        where: {
          cooledAgentId: context.agentId,
          type: "Move",
          endsAt: {
            gt: new Date(),
          },
        },
      });

      if (activeCooldown) {
        throw new Error("Agent is on movement cooldown");
      }
    }
  }

  /**
   * Validate battle action
   * Checks for battle range, agent existence, and battle cooldowns
   */
  private async validateBattle(
    context: ActionContext,
    action: BattleAction
  ): Promise<void> {
    if (context.prisma) {
      // Check if agents are in range
      const [attacker, defender] = await Promise.all([
        context.prisma.agent.findUnique({
          where: { id: context.agentId },
          include: { mapTiles: true },
        }),
        context.prisma.agent.findUnique({
          where: { id: action.targetId },
          include: { mapTiles: true },
        }),
      ]);

      if (!attacker || !defender) {
        throw new Error("One or both agents not found in database");
      }

      if (!attacker.mapTiles[0] || !defender.mapTiles[0]) {
        throw new Error("One or both agents have no map position");
      }

      const distance = Math.sqrt(
        Math.pow(attacker.mapTiles[0].x - defender.mapTiles[0].x, 2) +
          Math.pow(attacker.mapTiles[0].y - defender.mapTiles[0].y, 2)
      );

      if (distance > BATTLE_RANGE) {
        throw new Error(
          `Target is out of range. Maximum range is ${BATTLE_RANGE}`
        );
      }

      // Check if any involved agent is on cooldown
      const involvedAgents = [context.agentId, action.targetId];
      if (action.allyId) {
        involvedAgents.push(action.allyId);
      }

      const activeCooldown = await context.prisma.coolDown.findFirst({
        where: {
          cooledAgentId: { in: involvedAgents },
          type: "Battle",
          endsAt: {
            gt: new Date(),
          },
        },
      });

      if (activeCooldown) {
        throw new Error("One of the agents is on battle cooldown");
      }
    }
  }

  /**
   * Validate alliance action
   * Checks for existing alliances and alliance cooldowns
   */
  private async validateAlliance(
    context: ActionContext,
    action: AllianceAction
  ): Promise<void> {
    if (context.prisma) {
      // Check if agents already have an alliance
      const existingAlliance = await context.prisma.alliance.findFirst({
        where: {
          OR: [
            {
              initiatorId: context.agentId,
              joinerId: action.targetId,
            },
            {
              initiatorId: action.targetId,
              joinerId: context.agentId,
            },
          ],
          status: "Active",
        },
      });

      if (existingAlliance) {
        throw new Error("Alliance already exists between these agents");
      }

      // Check if either agent is on cooldown
      const activeCooldown = await context.prisma.coolDown.findFirst({
        where: {
          cooledAgentId: { in: [context.agentId, action.targetId] },
          type: "Alliance",
          endsAt: {
            gt: new Date(),
          },
        },
      });

      if (activeCooldown) {
        throw new Error("One of the agents is on alliance cooldown");
      }
    }
  }

  private async updateBattleInDatabase(
    context: ActionContext,
    action: BattleAction,
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): Promise<void> {
    const game = await context.prisma!.game.findUnique({
      where: { onchainId: BigInt(context.gameId) },
    });

    if (!game) {
      throw new Error("Game not found in database");
    }

    const battleType = this.determineBattleType(
      attackerAccount,
      defenderAccount
    );

    await context.prisma!.battle.create({
      data: {
        attackerId: context.agentId,
        defenderId: action.targetId,
        attackerAllyId: attackerAccount.allianceWith?.toString(),
        defenderAllyId: defenderAccount.allianceWith?.toString(),
        tokensStaked: action.tokensToStake,
        type: battleType,
        gameId: game.id,
        status: "Active",
        startTime: new Date(),
      },
    });

    const involvedAgents = [
      context.agentId,
      action.targetId,
      attackerAccount.allianceWith?.toString(),
      defenderAccount.allianceWith?.toString(),
    ].filter(Boolean) as string[];

    await Promise.all(
      involvedAgents.map((id) =>
        context.prisma!.coolDown.create({
          data: {
            type: "Battle",
            endsAt: new Date(Date.now() + BATTLE_COOLDOWN),
            cooledAgentId: id,
            gameId: game.id,
          },
        })
      )
    );
  }

  private async updateAllianceInDatabase(
    context: ActionContext,
    action: AllianceAction
  ): Promise<void> {
    const game = await context.prisma!.game.findUnique({
      where: { onchainId: BigInt(context.gameId) },
    });

    if (!game) {
      throw new Error("Game not found in database");
    }

    await context.prisma!.alliance.create({
      data: {
        initiatorId: context.agentId,
        joinerId: action.targetId,
        combinedTokens: action.combinedTokens,
        gameId: game.id,
        status: "Active",
        timestamp: new Date(),
      },
    });

    await Promise.all([
      context.prisma!.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + ALLIANCE_COOLDOWN),
          cooledAgentId: context.agentId,
          gameId: game.id,
        },
      }),
      context.prisma!.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + ALLIANCE_COOLDOWN),
          cooledAgentId: action.targetId,
          gameId: game.id,
        },
      }),
    ]);
  }

  // Utility methods
  private determineBattleType(
    attackerAccount: AgentAccount,
    defenderAccount: AgentAccount
  ): "AllianceVsAlliance" | "AgentVsAlliance" | "Simple" {
    return attackerAccount.allianceWith && defenderAccount.allianceWith
      ? "AllianceVsAlliance"
      : attackerAccount.allianceWith || defenderAccount.allianceWith
      ? "AgentVsAlliance"
      : "Simple";
  }

  /**
   * Get current agent state
   */
  async getAgentState(agentId: string): Promise<AgentAccount> {
    const [gamePda] = getGamePDA(this.program.programId, new BN(this.gameId));
    const [agentPda] = getAgentPDA(this.program.programId, gamePda, agentId);

    try {
      return await this.program.account.agent.fetch(agentPda);
    } catch (error) {
      logger.error("Failed to fetch agent state", { error, agentId });
      throw error;
    }
  }

  /**
   * Get current game state
   */
  async getGameState(): Promise<GameAccount> {
    const [gamePda] = getGamePDA(this.program.programId, new BN(this.gameId));

    try {
      return await this.program.account.game.fetch(gamePda);
    } catch (error) {
      logger.error("Failed to fetch game state", { error });
      throw error;
    }
  }
}
