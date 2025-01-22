import { Connection, PublicKey, Keypair, Commitment } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

import { SolanaConfig } from "../config";
import { IKeyManagerService, ISolanaService } from "../types/services";
import { logger } from "../utils/logger";

import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "../constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { MearthProgram } from "@/types/game";

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
  private program!: MearthProgram;
  private wsConnection: Connection | null = null;
  private subscriptionIds: number[] = [];

  constructor(
    private config: SolanaConfig,
    private keyManager: IKeyManagerService
  ) {
    this.connection = new Connection(config.rpcUrl);

    // const provider = new anchor.AnchorProvider(this.connection,  {
    //   commitment: this.config.commitment as Commitment,
    // });
    // anchor.setProvider(provider);
    this.program = new anchor.Program<MiddleEarthAiProgram>(
      mearthIdl as MiddleEarthAiProgram
    );
  }

  async initialize(): Promise<void> {
    try {
      // Initialize provider with authority keypair
      const authorityKeypair = await this.keyManager.getKeypair(
        this.config.authorityAgentId
      );
      const wallet = new anchor.Wallet(authorityKeypair);
      const provider = new anchor.AnchorProvider(this.connection, wallet, {
        commitment: this.config.commitment as Commitment,
      });

      anchor.setProvider(provider);

      this.program = new anchor.Program<MiddleEarthAiProgram>(
        mearthIdl as MiddleEarthAiProgram,
        provider
      );

      logger.info("Solana service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Solana service:", error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    try {
      // Create a new WebSocket connection
      this.wsConnection = new Connection(this.config.rpcUrl, {
        commitment: this.config.commitment as Commitment,
        wsEndpoint: this.config.rpcUrl.replace("http", "ws"),
      });

      // Subscribe to program account changes
      const programId = this.program.programId;

      const subscription = this.wsConnection.onProgramAccountChange(
        programId,
        (accountInfo, context) => {
          try {
            // const eventData = this.program.coder.accounts.decode(
            //   accountInfo.accountInfo.data
            // );
            // logger.info("Program account updated:", eventData);
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
    return PublicKey.findProgramAddressSync(seeds, programId);
  }

  private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
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
      this.program.programId
    );
  }

  private async findAlliancePDA(
    agent1Id: string,
    agent2Id: string
  ): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("alliance"), Buffer.from(agent1Id), Buffer.from(agent2Id)],
      this.program.programId
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
      const agentKeypair = await this.keyManager.getKeypair(agentId);
      const authorityKeypair = await this.keyManager.getKeypair(
        this.config.authorityAgentId
      );

      //   const tx = await this.program.methods
      //     .initializeAgent(name, agentType, initialTokens)
      //     .accounts({
      //       agent: agentPDA,
      //       authority: authorityKeypair.publicKey,
      //       agentKey: agentKeypair.publicKey,
      //       systemProgram: SystemProgram.programId,
      //     })
      //     .signers([authorityKeypair])
      //     .rpc();

      //   logger.info(`Agent ${agentId} initialized with transaction ${tx}`);
      //   return tx;
      return "test";
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
      const authorityKeypair = await this.keyManager.getKeypair(
        this.config.authorityAgentId
      );

      //   const tx = await this.program.methods
      //     .processBattle(tokensBurned)
      //     .accounts({
      //       battle: battlePDA,
      //       initiator: initiatorPDA,
      //       defender: defenderPDA,
      //       authority: authorityKeypair.publicKey,
      //     })
      //     .signers([authorityKeypair])
      //     .rpc();

      //   logger.info(`Battle processed with transaction ${tx}`);
      //   return tx;
      return "test";
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

      //   const tx = await this.program.methods
      //     .formAlliance()
      //     .accounts({
      //       //   alliance: alliancePDA,
      //       //   agent1: agent1PDA,
      //       //   agent2: agent2PDA,
      //       //   authority: this.authorityKeypair.publicKey,
      //     })
      //     .signers([this.authorityKeypair])
      //     .rpc();

      //   logger.info(`Alliance formed with transaction ${tx}`);
      //   return tx;
      return "test";
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

      //   const tx = await this.program.methods
      //     .updatePosition(x, y)
      //     .accounts({
      //       agent: agentPDA,
      //       authority: this.authorityKeypair.publicKey,
      //     })
      //     .signers([this.authorityKeypair])
      //     .rpc();

      //   logger.info(`Agent position updated with transaction ${tx}`);
      //   return tx;
      return "test";
    } catch (error) {
      logger.error("Failed to update agent position:", error);
      throw error;
    }
  }
}
