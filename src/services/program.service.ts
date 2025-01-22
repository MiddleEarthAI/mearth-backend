import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "../types/program";
import idl from "../constants/middle_earth_ai_program.json";

export class ProgramService {
  private program: Program<MiddleEarthAiProgram>;
  private connection: Connection;
  private wallet: anchor.Wallet;

  constructor() {
    // Initialize connection and wallet
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || "http://localhost:8899",
      "confirmed"
    );
    this.wallet = new anchor.Wallet(Keypair.generate()); // For testing, in prod use proper key management

    // Initialize provider
    const provider = new anchor.AnchorProvider(this.connection, this.wallet, {
      commitment: "confirmed",
      skipPreflight: true,
    });

    anchor.setProvider(provider);

    // Initialize program
    this.program = new anchor.Program<MiddleEarthAiProgram>(
      idl as any,
      new PublicKey(process.env.PROGRAM_ID || "")
    );
  }

  /**
   * Initialize a new agent account on-chain
   */
  async initializeAgent(
    agentId: string,
    agentType: string,
    initialTokens: number
  ): Promise<string> {
    const [agentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
    );

    await this.program.methods
      .initializeAgent(agentType, new anchor.BN(initialTokens))
      .accounts({
        agent: agentPDA,
        authority: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return agentPDA.toBase58();
  }

  /**
   * Process a battle between two agents
   */
  async processBattle(
    initiatorId: string,
    defenderId: string,
    tokensBurned: number
  ): Promise<void> {
    const [initiatorPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(initiatorId)],
      this.program.programId
    );

    const [defenderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(defenderId)],
      this.program.programId
    );

    await this.program.methods
      .processBattle(new anchor.BN(tokensBurned))
      .accounts({
        initiator: initiatorPDA,
        defender: defenderPDA,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Stake tokens on an agent
   */
  async stakeTokens(
    agentId: string,
    userWallet: PublicKey,
    amount: number
  ): Promise<void> {
    const [agentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
    );

    await this.program.methods
      .stake(new anchor.BN(amount))
      .accounts({
        agent: agentPDA,
        user: userWallet,
        authority: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Get agent data from chain
   */
  async getAgentData(agentId: string): Promise<any> {
    const [agentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
    );

    return await this.program.account.agent.fetch(agentPDA);
  }

  /**
   * Update agent position on-chain
   */
  async updateAgentPosition(
    agentId: string,
    x: number,
    y: number
  ): Promise<void> {
    const [agentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
    );

    await this.program.methods
      .updatePosition(new anchor.BN(x), new anchor.BN(y))
      .accounts({
        agent: agentPDA,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Record alliance formation on-chain
   */
  async recordAlliance(agent1Id: string, agent2Id: string): Promise<void> {
    const [agent1PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agent1Id)],
      this.program.programId
    );

    const [agent2PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agent2Id)],
      this.program.programId
    );

    await this.program.methods
      .formAlliance()
      .accounts({
        agent1: agent1PDA,
        agent2: agent2PDA,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }
}
