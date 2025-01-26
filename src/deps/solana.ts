import {
	type Commitment,
	Connection,
	PublicKey,
	type TransactionSignature,
} from "@solana/web3.js";

import type { ISolana } from "@/types";
import { logger } from "@/utils/logger";

import type { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import type { MearthProgram, TerrainType } from "@/types";
import * as anchor from "@coral-xyz/anchor";

import { KeyManager } from "./keyManager";

export class SolanaConfig {
	rpcUrl: string;
	commitment: Commitment;
	mearthMintAddress: string;
	constructor(config?: SolanaConfig) {
		this.rpcUrl =
			config?.rpcUrl ??
			process.env.SOLANA_RPC_URL! ??
			"https://api.devnet.solana.com";
		this.commitment =
			config?.commitment ??
			(process.env.SOLANA_COMMITMENT! as Commitment) ??
			"confirmed";
		this.mearthMintAddress =
			config?.mearthMintAddress ?? process.env.MEARTH_MINT_ADDRESS!;
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
	private subscriptionIds: number[] = [];
	private keyManager: KeyManager;
	private program: MearthProgram | null = null;

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
			const provider = new anchor.AnchorProvider(
				this.connection,
				// Use a dummy wallet since we'll be signing with specific keypairs
				{
					publicKey: PublicKey.default,
					signTransaction: async (tx) => tx,
					signAllTransactions: async (txs) => txs,
				},
				{ commitment: this.solanaConfig?.commitment },
			);

			anchor.setProvider(provider);

			this.program = new anchor.Program<MiddleEarthAiProgram>(
				mearthIdl as MiddleEarthAiProgram,
			);
		}
		return this.program;
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
				},
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
		programId: PublicKey,
	): Promise<[PublicKey, number]> {
		return PublicKey.findProgramAddressSync(seeds, programId);
	}

	/**
	 * Find the PDA for an agent
	 */
	private async findAgentPDA(agentId: string): Promise<[PublicKey, number]> {
		const program = await this.getProgram();
		return this.findPDA(
			[Buffer.from("agent"), Buffer.from(agentId)],
			program.programId,
		);
	}

	/**
	 * Form an alliance between agents
	 */
	async processFormAlliance(
		agent1Id: string,
		agent2Id: string,
	): Promise<TransactionSignature> {
		try {
			const program = await this.getProgram();
			const [agent1PDA] = await this.findAgentPDA(agent1Id);
			const [agent2PDA] = await this.findAgentPDA(agent2Id);
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
	async processBreakAlliance(
		agent1Id: string,
		agent2Id: string,
	): Promise<TransactionSignature> {
		try {
			const program = await this.getProgram();
			const [agent1PDA] = await this.findAgentPDA(agent1Id);
			const [agent2PDA] = await this.findAgentPDA(agent2Id);
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
	 * Ignore an agent
	 */
	async processIgnoreAgent(
		agentId: string,
		targetAgentId: string,
	): Promise<TransactionSignature> {
		try {
			const program = await this.getProgram();
			const [agentPDA] = await this.findAgentPDA(agentId);
			const keypair = await this.keyManager.getKeypair(agentId);

			const tx = await program.methods
				.ignoreAgent(Number(targetAgentId))
				.accounts({
					agent: agentPDA,
				})
				.signers([keypair])
				.rpc();

			logger.info(`Agent ignored with transaction ${tx}`);
			return tx;
		} catch (error) {
			logger.error("Failed to ignore agent:", error);
			throw error;
		}
	}

	/**
	 * Update agent position
	 */
	async processMoveAgent(
		agentId: string,
		x: number,
		y: number,
		terrain: TerrainType,
	): Promise<TransactionSignature> {
		try {
			const program = await this.getProgram();
			const keypair = await this.keyManager.getKeypair(agentId);
			const [agentPDA] = await this.findAgentPDA(agentId);

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
	 * Stop monitoring program events
	 */
	async stopMonitoring(): Promise<void> {
		try {
			if (this.subscriptionIds.length > 0) {
				await Promise.all(
					this.subscriptionIds.map((id) =>
						this.connection.removeAccountChangeListener(id),
					),
				);
				this.subscriptionIds = [];
			}
			logger.info("Stopped monitoring Solana program events");
		} catch (error) {
			logger.error("Failed to stop monitoring:", error);
			throw error;
		}
	}
}
