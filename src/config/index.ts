import type { AppConfig, GameConfig } from "@/types/config";
import type { SecurityConfig } from "@/types/config";
import type { DatabaseConfig, SolanaConfig } from "@/types/config";
import type { TwitterConfig } from "@/types/config";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

// Load environment variables
dotenv.config();

export class Config {
	public readonly database: DatabaseConfig;
	public readonly solana: SolanaConfig;
	public readonly twitter: TwitterConfig;
	public readonly security: SecurityConfig;
	public readonly app: AppConfig;
	public readonly game: GameConfig;

	constructor() {
		// Validate required environment variables
		this.validateEnv([
			"DATABASE_URL",
			"SOLANA_RPC_URL",
			"KEYPAIR_ENCRYPTION_KEY",
			"JWT_SECRET",
			"AUTHORITY_WALLET",

			"ANTHROPIC_API_KEY",
		]);

		this.database = {
			url: process.env.DATABASE_URL || "",
			maxConnections: Number.parseInt(
				process.env.DATABASE_MAX_CONNECTIONS || "10",
			),
			timeout: Number.parseInt(process.env.DATABASE_TIMEOUT || "30000"),
		};

		this.solana = {
			rpcUrl: process.env.SOLANA_RPC_URL || "",
			commitment: process.env.SOLANA_COMMITMENT || "confirmed",
			jwtSecret: process.env.JWT_SECRET || "",
			keypairEncryptionKey: process.env.KEYPAIR_ENCRYPTION_KEY || "",
		};

		this.twitter = {
			SCOOTLES_TWITTER_USERNAME: process.env.SCOOTLES_TWITTER_USERNAME || "",
			SCOOTLES_TWITTER_PASSWORD: process.env.SCOOTLES_TWITTER_PASSWORD || "",
			SCOOTLES_TWITTER_EMAIL: process.env.SCOOTLES_TWITTER_EMAIL || "",

			PURRLOCKPAWS_TWITTER_USERNAME:
				process.env.PURRLOCKPAWS_TWITTER_USERNAME || "",
			PURRLOCKPAWS_TWITTER_PASSWORD:
				process.env.PURRLOCKPAWS_TWITTER_PASSWORD || "",
			PURRLOCKPAWS_TWITTER_EMAIL: process.env.PURRLOCKPAWS_TWITTER_EMAIL || "",

			SIR_GULLIHOP_TWITTER_USERNAME:
				process.env.SIR_GULLIHOP_TWITTER_USERNAME || "",
			SIR_GULLIHOP_TWITTER_PASSWORD:
				process.env.SIR_GULLIHOP_TWITTER_PASSWORD || "",
			SIR_GULLIHOP_TWITTER_EMAIL: process.env.SIR_GULLIHOP_TWITTER_EMAIL || "",

			WANDERLEAF_TWITTER_USERNAME:
				process.env.WANDERLEAF_TWITTER_USERNAME || "",
			WANDERLEAF_TWITTER_PASSWORD:
				process.env.WANDERLEAF_TWITTER_PASSWORD || "",
			WANDERLEAF_TWITTER_EMAIL: process.env.WANDERLEAF_TWITTER_EMAIL || "",
		};

		this.security = {
			keypairEncryptionKey: process.env.KEYPAIR_ENCRYPTION_KEY || "",
			jwtSecret: process.env.JWT_SECRET || "",
		};

		this.game = {
			battleCooldownHours: Number.parseInt(
				process.env.BATTLE_COOLDOWN_HOURS || "4",
			),
			allianceCooldownHours: Number.parseInt(
				process.env.ALLIANCE_COOLDOWN_HOURS || "24",
			),
			maxTokenBurnPercentage: Number.parseInt(
				process.env.MAX_TOKEN_BURN_PERCENTAGE || "50",
			),
			minTokenBurnPercentage: Number.parseInt(
				process.env.MIN_TOKEN_BURN_PERCENTAGE || "31",
			),
		};

		this.app = {
			port: Number.parseInt(process.env.PORT || "3000"),
			environment: process.env.NODE_ENV || "development",
			logLevel: process.env.LOG_LEVEL || "info",
		};
	}

	private validateEnv(required: string[]): void {
		const missing = required.filter((key) => !process.env[key]);
		if (missing.length > 0) {
			const error = `Missing required environment variables: ${missing.join(
				", ",
			)}`;
			logger.error(error);
			throw new Error(error);
		}
	}
}

// Export singleton instance
export const config = new Config();
