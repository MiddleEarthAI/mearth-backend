import { Connection, PublicKey, Commitment } from "@solana/web3.js";

import { ISolana } from "@/types";
import { logger } from "@/utils/logger";

import * as anchor from "@coral-xyz/anchor";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { MearthProgram } from "@/types";

import { KeyManager } from "./keyManager";
import { web3 } from "@coral-xyz/anchor";

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

/**
 * Service for interacting with the Solana program and managing real-time updates
 */
export class Solana implements ISolana {
  private connection: Connection;
  private wsConnection: Connection | null = null;
  private subscriptionIds: number[] = [];
  private keyManager: KeyManager;

  constructor(readonly solanaConfig?: SolanaConfig) {
    this.solanaConfig = new SolanaConfig(solanaConfig);

    this.keyManager = new KeyManager();
    this.connection = new Connection(this.solanaConfig.rpcUrl);
  }

  async getProgram(): Promise<MearthProgram> {
    return new anchor.Program<MiddleEarthAiProgram>(
      mearthIdl as MiddleEarthAiProgram
    );
  }

  async startMonitoring(): Promise<void> {
    const rpcUrl = this.solanaConfig?.rpcUrl;
    const commitment = this.solanaConfig?.commitment;
    if (!rpcUrl) {
      throw new Error("RPC URL is not set");
    }
    try {
      // Create a new WebSocket connection
      this.wsConnection = new Connection(rpcUrl, {
        commitment: commitment,
        wsEndpoint: rpcUrl.replace("http", "ws"),
      });

      // Subscribe to program account changes
      const programId = (await this.getProgram()).programId;

      const subscription = this.wsConnection.onProgramAccountChange(
        programId,
        (accountInfo, context) => {
          try {
            console.log(accountInfo);
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

  private async findPDA(
    seeds: Buffer[],
    programId: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(seeds, programId);
  }

  private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("agent"), Buffer.from(agentId)],
      (await this.getProgram()).programId
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
      (await this.getProgram()).programId
    );
  }

  private async findAlliancePDA(
    agent1Id: string,
    agent2Id: string
  ): Promise<[PublicKey, number]> {
    return this.findPDA(
      [Buffer.from("alliance"), Buffer.from(agent1Id), Buffer.from(agent2Id)],
      (await this.getProgram()).programId
    );
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
      // const authorityKeypair = await this.getKeypair(this.agentId);

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

  async getTokenBalance(agentId: string): Promise<number> {
    return 0;
  }

  async burnTokens(agentId: string, amount: number): Promise<string> {
    return "test";
  }

  async transferTokens(
    fromAgentId: string,
    toAgentId: string,
    amount: number
  ): Promise<string> {
    return "test";
  }

  async processAlliance(agentId1: string, agentId2: string): Promise<string> {
    return "test";
  }

  async processMovement(
    agentId: string,
    x: number,
    y: number
  ): Promise<string> {
    const keypair = await this.keyManager.getKeypair(agentId);

    const [agentPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      (await this.getProgram()).programId
    );

    const program = await this.getProgram();
    const tx = await program.methods
      .moveAgent(x, y)
      .accounts({
        agent: agentPDA,
        // authority: this.authorityKeypair.publicKey,
      })
      .signers([keypair])
      .rpc();
    return tx;
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
}
