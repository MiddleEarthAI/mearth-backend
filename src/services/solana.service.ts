import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { logger } from "../utils/logger";
import { retryWithExponentialBackoff } from "../utils/retry";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Agent } from "../types/game";

/**
 * Service for interacting with the Solana program
 */
export class SolanaService {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program;
  private authorityKeypair: Keypair;

  // PDAs
  private static readonly GAME_SEED = "GAME";
  private static readonly AGENT_SEED = "AGENT";
  private static readonly BATTLE_SEED = "BATTLE";
  private static readonly ALLIANCE_SEED = "ALLIANCE";

  constructor() {
    if (
      !process.env.SOLANA_RPC_URL ||
      !process.env.PROGRAM_ID ||
      !process.env.AUTHORITY_KEYPAIR
    ) {
      throw new Error(
        "Missing required Solana configuration in environment variables"
      );
    }

    // Initialize Solana connection
    this.connection = new Connection(process.env.SOLANA_RPC_URL, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });

    // Load authority keypair
    this.authorityKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(process.env.AUTHORITY_KEYPAIR))
    );

    // Initialize provider
    const wallet = new NodeWallet(this.authorityKeypair);
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    // Initialize program
    this.program = new Program(
      require("../../target/idl/middle_earth_ai_program.json"),
      new PublicKey(process.env.PROGRAM_ID),
      this.provider
    );

    logger.info("Solana service initialized successfully");
  }

  /**
   * Initialize a new agent on-chain
   */
  public async initializeAgent(agent: Agent): Promise<string> {
    try {
      const [agentPDA] = await this.findAgentPDA(agent.id);
      const [gamePDA] = await this.findGamePDA();

      await retryWithExponentialBackoff(async () => {
        const tx = await this.program.methods
          .initializeAgent({
            id: agent.id,
            agentType: agent.type,
            name: agent.name,
            characteristics: {
              aggressiveness: new BN(agent.characteristics.aggressiveness),
              alliancePropensity: new BN(
                agent.characteristics.alliancePropensity
              ),
              influenceability: new BN(agent.characteristics.influenceability),
            },
            position: {
              x: new BN(agent.position.x),
              y: new BN(agent.position.y),
            },
          })
          .accounts({
            game: gamePDA,
            agent: agentPDA,
            authority: this.provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await this.connection.confirmTransaction(tx);
        logger.info(`Agent ${agent.id} initialized on-chain: ${tx}`);
        return tx;
      });

      return agentPDA.toBase58();
    } catch (error) {
      logger.error("Failed to initialize agent on-chain:", error);
      throw error;
    }
  }

  /**
   * Process a battle between agents
   */
  public async processBattle(
    initiatorId: string,
    defenderId: string,
    tokensBurned: number
  ): Promise<string> {
    try {
      const [battlePDA] = await this.findBattlePDA(initiatorId, defenderId);
      const [initiatorPDA] = await this.findAgentPDA(initiatorId);
      const [defenderPDA] = await this.findAgentPDA(defenderId);
      const [gamePDA] = await this.findGamePDA();

      const tx = await this.program.methods
        .processBattle({
          tokensBurned: new BN(tokensBurned * LAMPORTS_PER_SOL),
        })
        .accounts({
          game: gamePDA,
          battle: battlePDA,
          initiator: initiatorPDA,
          defender: defenderPDA,
          authority: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await this.connection.confirmTransaction(tx);
      logger.info(`Battle processed on-chain: ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to process battle on-chain:", error);
      throw error;
    }
  }

  /**
   * Form an alliance between agents
   */
  public async formAlliance(
    agent1Id: string,
    agent2Id: string
  ): Promise<string> {
    try {
      const [alliancePDA] = await this.findAlliancePDA(agent1Id, agent2Id);
      const [agent1PDA] = await this.findAgentPDA(agent1Id);
      const [agent2PDA] = await this.findAgentPDA(agent2Id);
      const [gamePDA] = await this.findGamePDA();

      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          game: gamePDA,
          alliance: alliancePDA,
          agent1: agent1PDA,
          agent2: agent2PDA,
          authority: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await this.connection.confirmTransaction(tx);
      logger.info(`Alliance formed on-chain: ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to form alliance on-chain:", error);
      throw error;
    }
  }

  /**
   * Update agent position
   */
  public async updateAgentPosition(
    agentId: string,
    x: number,
    y: number
  ): Promise<string> {
    try {
      const [agentPDA] = await this.findAgentPDA(agentId);
      const [gamePDA] = await this.findGamePDA();

      const tx = await this.program.methods
        .updatePosition({
          position: {
            x: new BN(x),
            y: new BN(y),
          },
        })
        .accounts({
          game: gamePDA,
          agent: agentPDA,
          authority: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await this.connection.confirmTransaction(tx);
      logger.info(`Agent ${agentId} position updated on-chain: ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to update agent position on-chain:", error);
      throw error;
    }
  }

  /**
   * Find Game PDA
   */
  private async findGamePDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SolanaService.GAME_SEED)],
      this.program.programId
    );
  }

  /**
   * Find Agent PDA
   */
  private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SolanaService.AGENT_SEED), Buffer.from(agentId)],
      this.program.programId
    );
  }

  /**
   * Find Battle PDA
   */
  private async findBattlePDA(
    initiatorId: string,
    defenderId: string
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(SolanaService.BATTLE_SEED),
        Buffer.from(initiatorId),
        Buffer.from(defenderId),
      ],
      this.program.programId
    );
  }

  /**
   * Find Alliance PDA
   */
  private async findAlliancePDA(
    agent1Id: string,
    agent2Id: string
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(SolanaService.ALLIANCE_SEED),
        Buffer.from(agent1Id),
        Buffer.from(agent2Id),
      ],
      this.program.programId
    );
  }

  /**
   * Subscribe to program events
   */
  public subscribeToEvents(): void {
    // Battle events
    this.program.addEventListener("BattleProcessed", (event) => {
      logger.info("Battle processed event:", event);
    });

    // Alliance events
    this.program.addEventListener("AllianceFormed", (event) => {
      logger.info("Alliance formed event:", event);
    });

    // Position update events
    this.program.addEventListener("PositionUpdated", (event) => {
      logger.info("Position updated event:", event);
    });

    logger.info("Subscribed to program events");
  }
}
