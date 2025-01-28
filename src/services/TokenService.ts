import type { MearthProgram } from "@/types";
import { logger } from "@/utils/logger";
import { getGamePDA, getStakeInfoPDA } from "@/utils/pda";
import { getAgentPDA } from "@/utils/pda";
import { BN } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";

export interface StakeInfo {
  agent: PublicKey;
  staker: PublicKey;
  amount: BN;
  shares: BN;
  lastRewardTimestamp: BN;
  cooldownEndsAt: BN;
  isInitialized: boolean;
}

/**
 * Service for handling token operations
 */
export class TokenService {
  constructor(
    private readonly program: MearthProgram,
    private readonly connection: Connection,
    private readonly mintAddress = process.env.MEARTH_ADDRESS
  ) {
    if (!mintAddress) throw new Error("Mint address is required");
  }

  /**
   * Initialize stake for an agent
   */
  async initializeStake(
    agentId: number,
    gameId: number,
    amount: number
  ): Promise<string> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);
      const adminPubkey = this.program.provider.publicKey;
      if (!adminPubkey) throw "Pubkey require. (initializeStake)";
      const mintPubkey = new PublicKey(this.mintAddress as string);

      const stakerSource = await getAssociatedTokenAddress(
        mintPubkey, // mint
        adminPubkey // owner
      );
      const agentVault = await getAssociatedTokenAddress(
        mintPubkey, // mint
        agentPDA // owner
      );
      // const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      //   [Buffer.from("stake"), agentPDA.toBuffer(), adminPubkey?.toBuffer()],
      //   this.program.programId
      // );

      const tx = await this.program.methods
        .initializeStake(new BN(amount))
        .accounts({
          agent: agentPDA,
          stakerSource,
          agentVault,
        })
        .rpc();

      logger.info(
        `Initialized stake for agent ${agentId} with ${amount} tokens`
      );
      return tx;
    } catch (error) {
      logger.error("Failed to initialize stake:", error);
      throw error;
    }
  }

  /**
   * Stake tokens for an agent
   */
  async stakeTokens(
    agentId: number,
    gameId: number,
    amount: number
  ): Promise<string> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      const agentVaultTokenAccount = await getAccount(
        this.connection,
        agentPDA
      );

      const tx = await this.program.methods
        .stakeTokens(new BN(amount))
        .accounts({
          agent: agentPDA,
          // place holder
          stakerSource: agentVaultTokenAccount.address,
          agentVault: agentVaultTokenAccount.address,
        })
        .rpc();

      logger.info(`Staked ${amount} tokens for agent ${agentId}`);
      return tx;
    } catch (error) {
      logger.error("Failed to stake tokens:", error);
      throw error;
    }
  }

  /**
   * Unstake tokens for an agent
   */
  async unstakeTokens(agentId: number, amount: number): Promise<string> {
    try {
      const [agent] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), Buffer.from([agentId])],
        this.program.programId
      );

      const [agentAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_authority"), agent.toBuffer()],
        this.program.programId
      );

      const [stakeInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), agent.toBuffer(), agentAuthority.toBuffer()],
        this.program.programId
      );

      const [agentVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), agent.toBuffer()],
        this.program.programId
      );

      const [stakerDestination] = PublicKey.findProgramAddressSync(
        [Buffer.from("staker"), agent.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .unstakeTokens(amount)
        .accounts({
          agent,
          // game: this.program.programId,
          // stakeInfo,
          agentVault,
          // agentAuthority,
          stakerDestination,
          // authority: agentAuthority,
          // systemProgram: PublicKey.default,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      logger.info(`Unstaked ${amount} tokens for agent ${agentId}. Tx: ${tx}`);
      return tx;
    } catch (error) {
      logger.error(`Failed to unstake tokens: ${error}`);
      throw error;
    }
  }

  /**
   * Claim staking rewards for an agent
   */
  async claimStakingRewards(agentId: number): Promise<string> {
    try {
      const [agentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), new BN(agentId)],
        this.program.programId
      );

      const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), agentPDA.toBuffer(), agentPDA.toBuffer()],
        this.program.programId
      );

      const [rewardsAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("rewards_authority")],
        this.program.programId
      );

      const [rewardsVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("rewards_vault")],
        this.program.programId
      );

      const tx = await this.program.methods
        .claimStakingRewards()
        .accounts({
          agent: agentPDA,
          // stakeInfo: stakeInfoPDA,
          mint: agentPDA,
          rewardsVault,
          rewardsAuthority,
          stakerDestination: agentPDA,
          // authority: agentPDA,
          // systemProgram: SystemProgram.programId,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      logger.info(`Claimed staking rewards for agent ${agentId}`);
      return tx;
    } catch (error) {
      logger.error("Failed to claim staking rewards:", error);
      throw error;
    }
  }

  /**
   * Get stake info for an agent
   */
  async getStakeInfo(
    agentId: number,
    gameId: number
  ): Promise<StakeInfo | null> {
    try {
      const [gamePDA] = getGamePDA(this.program.programId, gameId);
      const [agentPDA] = getAgentPDA(this.program.programId, gamePDA, agentId);

      const [stakeInfoPDA] = getStakeInfoPDA(
        this.program.programId,
        agentPDA,
        agentPDA
      );

      const stakeAccount = await this.program.account.stakeInfo.fetch(
        stakeInfoPDA
      );
      return this.parseStakeInfo(stakeAccount);
    } catch (error) {
      logger.error("Failed to fetch stake info:", error);
      return null;
    }
  }

  /**
   * Get token balance for an account
   */
  async getTokenBalance(account: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAccount(this.connection, account);
      return Number(tokenAccount.amount);
    } catch (error) {
      logger.error("Failed to fetch token balance:", error);
      return 0;
    }
  }

  private parseStakeInfo(raw: any): StakeInfo {
    return {
      agent: raw.agent,
      staker: raw.staker,
      amount: raw.amount,
      shares: raw.shares,
      lastRewardTimestamp: raw.lastRewardTimestamp,
      cooldownEndsAt: raw.cooldownEndsAt,
      isInitialized: raw.isInitialized,
    };
  }
}
