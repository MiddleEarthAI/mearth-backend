import {
  Connection,
  PublicKey,
  Commitment,
  TransactionSignature,
  SystemProgram,
} from "@solana/web3.js";

import { ISolana } from "@/types";
import { logger } from "@/utils/logger";

import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { MearthProgram, TerrainType } from "@/types";

import { KeyManager } from "./keyManager";

export class SolanaConfig {
  rpcUrl: string;
  commitment: Commitment;
  constructor(config?: SolanaConfig) {
    this.rpcUrl =
      config?.rpcUrl ??
      process.env.SOLANA_RPC_URL! ??
      "https://api.devnet.solana.com";
    this.commitment =
      config?.commitment ??
      (process.env.SOLANA_COMMITMENT! as Commitment) ??
      "confirmed";
  }
}

export interface GameEventHandlers {
  onAgentMoved?: (event: {
    agentId: number;
    oldX: number;
    oldY: number;
    newX: number;
    newY: number;
  }) => void;
  onBattleInitiated?: (event: {
    agentId: number;
    opponentAgentId: number;
  }) => void;
  onBattleResolved?: (event: {
    winnerId: number;
    loserId: number;
    transferAmount: bigint;
  }) => void;
}

/**
 * Service for interacting with the Solana program and managing real-time updates
 */
export class Solana implements ISolana {
  private connection: Connection;
  private wsConnection: Connection | null = null;
  private subscriptionIds: number[] = [];
  private keyManager: KeyManager;
  private program: MearthProgram | null = null;
  private eventHandlers: GameEventHandlers = {};

  constructor(readonly solanaConfig?: SolanaConfig) {
    this.solanaConfig = new SolanaConfig(solanaConfig);

    this.keyManager = new KeyManager();
    this.connection = new Connection(this.solanaConfig.rpcUrl, {
      commitment: this.solanaConfig.commitment,
    });
  }

  /**
   * Initialize and return the program instance
   */
  async getProgram(): Promise<MearthProgram> {
    if (!this.program) {
      // Create a provider with wallet
      const provider = new anchor.AnchorProvider(
        this.connection,
        // Use a dummy wallet since we'll be signing with specific keypairs
        {
          publicKey: PublicKey.default,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        },
        { commitment: this.solanaConfig?.commitment }
      );

      anchor.setProvider(provider);

      this.program = new anchor.Program<MiddleEarthAiProgram>(
        mearthIdl as MiddleEarthAiProgram
      );
    }
    return this.program;
  }

  /**
   * Set event handlers for game events
   */
  setEventHandlers(handlers: GameEventHandlers) {
    this.eventHandlers = handlers;
  }

  /**
   * Start monitoring program events
   */
  async startMonitoring(): Promise<void> {
    const rpcUrl = this.solanaConfig?.rpcUrl;
    if (!rpcUrl) {
      throw new Error("RPC URL is not set");
    }

    try {
      // Create a new WebSocket connection
      this.wsConnection = new Connection(rpcUrl, {
        commitment: this.solanaConfig?.commitment,
      });

      const program = await this.getProgram();

      const moveSubId = program?.addEventListener("agentMoved", (event) => {
        logger.info("Agent moved event called");
        console.log(event);
      });

      const battleSubId = program?.addEventListener(
        "battleInitiated",
        (event) => {
          logger.info("Battle initiated event called");
          console.log(event);
        }
      );

      this.subscriptionIds.push(moveSubId, battleSubId);
      logger.info("Started monitoring Solana program events");
    } catch (error) {
      logger.error("Failed to start monitoring:", error);
      throw error;
    }
  }

  /**
   * Find a Program Derived Address (PDA)
   */
  private async findPDA(
    seeds: Buffer[],
    programId: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(seeds, programId);
  }

  /**
   * Find the PDA for an agent
   */
  private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("agent"), Buffer.from(agentId)],
      (await this.getProgram()).programId
    );
  }

  /**
   * Find the PDA for a battle
   */
  private async findBattlePDA(
    initiatorId: string,
    defenderId: string
  ): Promise<[PublicKey, number]> {
    return this.findPDA(
      [
        Buffer.from("battle"),
        Buffer.from(initiatorId),
        Buffer.from(defenderId),
      ],
      (await this.getProgram()).programId
    );
  }

  /**
   * Find the PDA for an alliance
   */
  private async findAlliancePDA(
    agent1Id: string,
    agent2Id: string
  ): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("alliance"), Buffer.from(agent1Id), Buffer.from(agent2Id)],
      (await this.getProgram()).programId
    );
  }

  /**
   * Find the PDA for a game
   */
  private async findGamePDA(gameId: number): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("game"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)],
      (await this.getProgram()).programId
    );
  }

  /**
   * Initialize a new game
   */
  async initializeGame(gameId: number): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [gamePDA, bump] = await this.findGamePDA(gameId);
      const adminKeypair = await this.keyManager.getKeypair("admin");

      const tx = await program.methods
        .initializeGame(new anchor.BN(gameId), bump)
        .accounts({})
        .signers([adminKeypair])
        .rpc();

      logger.info(`Game initialized with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to initialize game:", error);
      throw error;
    }
  }

  /**
   * Register a new agent
   */
  async registerAgent(
    agentId: string,
    x: number,
    y: number,
    name: string
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [agentPDA] = await this.findAgentPDA(agentId);
      const keypair = await this.keyManager.getKeypair(agentId);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1

      const tx = await program.methods
        .registerAgent(Number(agentId), x, y, name)
        .accounts({
          agent: agentPDA,
          // authority: keypair.publicKey,
          game: gamePDA,
          // systemProgram: SystemProgram.programId,
        })
        .signers([keypair])
        .rpc();

      logger.info(`Agent registered with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to register agent:", error);
      throw error;
    }
  }

  /**
   * Process a battle between agents
   */
  async processBattle(
    initiatorId: string,
    defenderId: string,
    tokensBurned: number
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [initiatorPDA] = await this.findAgentPDA(initiatorId);
      const [defenderPDA] = await this.findAgentPDA(defenderId);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1
      const initiatorKeypair = await this.keyManager.getKeypair(initiatorId);

      const tx = await program.methods
        .resolveBattleSimple(tokensBurned)
        .accounts({
          winner: initiatorPDA,
          loser: defenderPDA,
          loserAuthority: Gamepad,
          // game: gamePDA,
          authority: initiatorKeypair.publicKey,
          // systemProgram: SystemProgram.programId,
        })
        .signers([initiatorKeypair])
        .rpc();

      logger.info(`Battle processed with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to process battle:", error);
      throw error;
    }
  }

  /**
   * Form an alliance between agents
   */
  async formAlliance(
    agent1Id: string,
    agent2Id: string
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [agent1PDA] = await this.findAgentPDA(agent1Id);
      const [agent2PDA] = await this.findAgentPDA(agent2Id);
      const [alliancePDA] = await this.findAlliancePDA(agent1Id, agent2Id);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1
      const agent1Keypair = await this.keyManager.getKeypair(agent1Id);

      const tx = await program.methods
        .formAlliance()
        .accounts({
          initiator: agent1PDA,
          targetAgent: agent2PDA,
        })
        .signers([agent1Keypair])
        .rpc();

      logger.info(`Alliance formed with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to form alliance:", error);
      throw error;
    }
  }

  /**
   * Break an alliance between agents
   */
  async breakAlliance(
    agent1Id: string,
    agent2Id: string
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [agent1PDA] = await this.findAgentPDA(agent1Id);
      const [agent2PDA] = await this.findAgentPDA(agent2Id);
      const [alliancePDA] = await this.findAlliancePDA(agent1Id, agent2Id);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1
      const agent1Keypair = await this.keyManager.getKeypair(agent1Id);

      const tx = await program.methods
        .breakAlliance()
        .accounts({
          initiator: agent1PDA,
          targetAgent: agent2PDA,
        })
        .signers([agent1Keypair])
        .rpc();

      logger.info(`Alliance broken with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to break alliance:", error);
      throw error;
    }
  }

  /**
   * Update agent position
   */
  async processMovement(
    agentId: string,
    x: number,
    y: number,
    terrain: TerrainType = TerrainType.PLAIN
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const keypair = await this.keyManager.getKeypair(agentId);
      const [agentPDA] = await this.findAgentPDA(agentId);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1

      const tx = await program.methods
        .moveAgent(x, y, terrain)
        .accounts({
          agent: agentPDA,
        })
        .signers([keypair])
        .rpc();

      logger.info(`Agent movement processed with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to process movement:", error);
      throw error;
    }
  }

  /**
   * Get agent's token balance
   */
  async getTokenBalance(agentId: string): Promise<number> {
    try {
      const program = await this.getProgram();
      const [agentPDA] = await this.findAgentPDA(agentId);
      const agentAccount = await program.account.agent.fetch(agentPDA);
      return Number(agentAccount.tokenBalance.toString());
    } catch (error) {
      logger.error("Failed to get token balance:", error);
      throw error;
    }
  }

  /**
   * Process alliance between agents
   */
  async processAlliance(agent1Id: string, agent2Id: string): Promise<string> {
    return this.formAlliance(agent1Id, agent2Id);
  }

  /**
   * Transfer tokens between agents
   */
  async transferTokens(
    fromAgentId: string,
    toAgentId: string,
    amount: number
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [fromAgentPDA] = await this.findAgentPDA(fromAgentId);
      const [toAgentPDA] = await this.findAgentPDA(toAgentId);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1
      const fromKeypair = await this.keyManager.getKeypair(fromAgentId);

      const tx = await program.methods
        .transferTokens(new anchor.BN(amount))
        .accounts({
          fromAgent: fromAgentPDA,
          toAgent: toAgentPDA,
          game: gamePDA,
          authority: fromKeypair.publicKey,
          // systemProgram: SystemProgram.programId,
        })
        .signers([fromKeypair])
        .rpc();

      logger.info(`Tokens transferred with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to transfer tokens:", error);
      throw error;
    }
  }

  /**
   * Burn tokens from agent's balance
   */
  async burnTokens(
    agentId: string,
    amount: number
  ): Promise<TransactionSignature> {
    try {
      const program = await this.getProgram();
      const [agentPDA] = await this.findAgentPDA(agentId);
      const [gamePDA] = await this.findGamePDA(1); // Assuming game ID 1
      const keypair = await this.keyManager.getKeypair(agentId);

      const tx = await program.methods
        .burnTokens(new anchor.BN(amount))
        .accounts({
          agent: agentPDA,
          game: gamePDA,
          authority: keypair.publicKey,
          // systemProgram: SystemProgram.programId,
        })
        .signers([keypair])
        .rpc();

      logger.info(`Tokens burned with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to burn tokens:", error);
      throw error;
    }
  }

  /**
   * Stop monitoring program events
   */
  async stopMonitoring(): Promise<void> {
    try {
      if (this.wsConnection) {
        await Promise.all(
          this.subscriptionIds.map((id) =>
            this.wsConnection!.removeAccountChangeListener(id)
          )
        );
        this.subscriptionIds = [];
        this.wsConnection = null;
      }
      logger.info("Stopped monitoring Solana program events");
    } catch (error) {
      logger.error("Failed to stop monitoring:", error);
      throw error;
    }
  }
}
