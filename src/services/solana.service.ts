import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { IDL } from "../types/idl";
import { SolanaConfig } from "../config";
import {
  IKeyManagerService,
  IWebSocketService,
  ISolanaService,
} from "../types/services";
import { logger } from "../utils/logger";
import { retryWithExponentialBackoff } from "../utils/retry";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  Agent,
  ProgramBattleEvent,
  ProgramAllianceEvent,
  ProgramPositionEvent,
  MearthProgram,
} from "../types/game";
import { WebSocketService } from "./websocket.service";
import { KeyManagerService } from "./keyManager.service";
import mearthIdl from "../constants/middle_earth_ai_program.json";
import { BN } from "@coral-xyz/anchor";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";

type BattleEvent = {
  data: {
    initiator: PublicKey;
    defender: PublicKey;
    tokensBurned: anchor.BN;
    timestamp: anchor.BN;
  };
};

type AllianceEvent = {
  data: {
    agent1: PublicKey;
    agent2: PublicKey;
    timestamp: anchor.BN;
  };
};

type PositionEvent = {
  data: {
    agentId: PublicKey;
    x: anchor.BN;
    y: anchor.BN;
    timestamp: anchor.BN;
  };
};

/**
 * Service for interacting with the Solana program and managing real-time updates
 */
export class SolanaService implements ISolanaService {
  private connection: Connection;
  private program: Program;
  private authorityKeypair: Keypair;
  private wsConnection: Connection | null = null;
  private subscriptionIds: number[] = [];

  constructor(
    private config: SolanaConfig,
    private keyManager: IKeyManagerService
  ) {
    this.connection = new Connection(config.rpcUrl);
    this.authorityKeypair = Keypair.fromSecretKey(
      Buffer.from(config.authoritySecretKey, "hex")
    );

    const provider = new AnchorProvider(
      this.connection,
      {
        publicKey: this.authorityKeypair.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(
          tx: T
        ): Promise<T> => {
          if (tx instanceof Transaction) {
            tx.sign(this.authorityKeypair);
          }
          return tx;
        },
        signAllTransactions: async <
          T extends Transaction | VersionedTransaction,
        >(
          txs: T[]
        ): Promise<T[]> => {
          return txs.map((tx) => {
            if (tx instanceof Transaction) {
              tx.sign(this.authorityKeypair);
            }
            return tx;
          });
        },
      },
      { commitment: config.commitment }
    );

    this.program = new Program(IDL, new PublicKey(config.programId), provider);
  }

  async startMonitoring(): Promise<void> {
    try {
      // Create a new WebSocket connection
      this.wsConnection = new Connection(this.config.rpcUrl, {
        commitment: this.config.commitment,
        wsEndpoint: this.config.rpcUrl.replace("http", "ws"),
      });

      // Subscribe to program account changes
      const programId = new PublicKey(this.config.programId);
      const subscription = this.wsConnection.onProgramAccountChange(
        programId,
        (accountInfo, context) => {
          try {
            const eventData = this.program.coder.accounts.decode(
              accountInfo.accountInfo.data
            );
            logger.info("Program account updated:", eventData);
          } catch (error) {
            logger.error("Error decoding program account data:", error);
          }
        }
      );

      this.subscriptionIds.push(subscription);
      logger.info("Started monitoring Solana program events");
    } catch (error) {
      logger.error("Failed to start monitoring:", error);
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    try {
      // Unsubscribe from all subscriptions
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

  private async findPDA(
    seeds: Buffer[],
    programId: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(seeds, programId);
  }

  private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("agent"), Buffer.from(agentId)],
      new PublicKey(this.config.programId)
    );
  }

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
      new PublicKey(this.config.programId)
    );
  }

  private async findAlliancePDA(
    agent1Id: string,
    agent2Id: string
  ): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("alliance"), Buffer.from(agent1Id), Buffer.from(agent2Id)],
      new PublicKey(this.config.programId)
    );
  }

  async initializeAgent(
    agentId: string,
    name: string,
    agentType: string,
    initialTokens: number
  ): Promise<string> {
    try {
      const [agentPDA] = await this.findAgentPDA(agentId);
      const agentKeypair = await this.keyManager.generateKeypair(agentId);

      const tx = await this.program.methods
        .initializeAgent(name, agentType, initialTokens)
        .accounts({
          agent: agentPDA,
          authority: this.authorityKeypair.publicKey,
          agentKey: agentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.authorityKeypair])
        .rpc();

      logger.info(`Agent ${agentId} initialized with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error(`Failed to initialize agent ${agentId}:`, error);
      throw error;
    }
  }

  async processBattle(
    initiatorId: string,
    defenderId: string,
    tokensBurned: number
  ): Promise<string> {
    try {
      const [initiatorPDA] = await this.findAgentPDA(initiatorId);
      const [defenderPDA] = await this.findAgentPDA(defenderId);
      const [battlePDA] = await this.findBattlePDA(initiatorId, defenderId);

      const tx = await this.program.methods
        .processBattle(tokensBurned)
        .accounts({
          battle: battlePDA,
          initiator: initiatorPDA,
          defender: defenderPDA,
          authority: this.authorityKeypair.publicKey,
        })
        .signers([this.authorityKeypair])
        .rpc();

      logger.info(`Battle processed with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to process battle:", error);
      throw error;
    }
  }

  async formAlliance(agent1Id: string, agent2Id: string): Promise<string> {
    try {
      const [agent1PDA] = await this.findAgentPDA(agent1Id);
      const [agent2PDA] = await this.findAgentPDA(agent2Id);
      const [alliancePDA] = await this.findAlliancePDA(agent1Id, agent2Id);

      const tx = await this.program.methods
        .formAlliance()
        .accounts({
          alliance: alliancePDA,
          agent1: agent1PDA,
          agent2: agent2PDA,
          authority: this.authorityKeypair.publicKey,
        })
        .signers([this.authorityKeypair])
        .rpc();

      logger.info(`Alliance formed with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to form alliance:", error);
      throw error;
    }
  }

  async updateAgentPosition(
    agentId: string,
    x: number,
    y: number
  ): Promise<string> {
    try {
      const [agentPDA] = await this.findAgentPDA(agentId);

      const tx = await this.program.methods
        .updatePosition(x, y)
        .accounts({
          agent: agentPDA,
          authority: this.authorityKeypair.publicKey,
        })
        .signers([this.authorityKeypair])
        .rpc();

      logger.info(`Agent position updated with transaction ${tx}`);
      return tx;
    } catch (error) {
      logger.error("Failed to update agent position:", error);
      throw error;
    }
  }
}
