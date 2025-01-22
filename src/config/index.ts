import dotenv from "dotenv";
import { logger } from "../utils/logger";

// Load environment variables
dotenv.config();

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  timeout: number;
}

export interface SolanaConfig {
  rpcUrl: string;
  programId: string;
  authorityKeyPath: string;
  wsEndpoint: string;
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface SecurityConfig {
  keypairEncryptionKey: string;
  jwtSecret: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  logLevel: string;
  battleCooldownHours: number;
  allianceCooldownHours: number;
  maxTokenBurnPercentage: number;
  minTokenBurnPercentage: number;
}

export class Config {
  public readonly database: DatabaseConfig;
  public readonly solana: SolanaConfig;
  public readonly twitter: TwitterConfig;
  public readonly security: SecurityConfig;
  public readonly app: AppConfig;

  constructor() {
    // Validate required environment variables
    this.validateEnv([
      "DATABASE_URL",
      "SOLANA_RPC_URL",
      "PROGRAM_ID",
      "KEYPAIR_ENCRYPTION_KEY",
      "TWITTER_API_KEY",
      "TWITTER_API_SECRET",
    ]);

    this.database = {
      url: process.env.DATABASE_URL!,
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || "10"),
      timeout: parseInt(process.env.DATABASE_TIMEOUT || "30000"),
    };

    this.solana = {
      rpcUrl: process.env.SOLANA_RPC_URL!,
      programId: process.env.PROGRAM_ID!,
      authorityKeyPath:
        process.env.AUTHORITY_KEYPAIR_PATH || "./authority-keypair.json",
      wsEndpoint:
        process.env.SOLANA_WS_ENDPOINT || "wss://api.devnet.solana.com",
    };

    this.twitter = {
      apiKey: process.env.TWITTER_API_KEY!,
      apiSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    };

    this.security = {
      keypairEncryptionKey: process.env.KEYPAIR_ENCRYPTION_KEY!,
      jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    };

    this.app = {
      port: parseInt(process.env.PORT || "3000"),
      environment: process.env.NODE_ENV || "development",
      logLevel: process.env.LOG_LEVEL || "info",
      battleCooldownHours: parseInt(process.env.BATTLE_COOLDOWN_HOURS || "4"),
      allianceCooldownHours: parseInt(
        process.env.ALLIANCE_COOLDOWN_HOURS || "24"
      ),
      maxTokenBurnPercentage: parseInt(
        process.env.MAX_TOKEN_BURN_PERCENTAGE || "50"
      ),
      minTokenBurnPercentage: parseInt(
        process.env.MIN_TOKEN_BURN_PERCENTAGE || "31"
      ),
    };
  }

  private validateEnv(required: string[]): void {
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(", ")}`;
      logger.error(error);
      throw new Error(error);
    }
  }
}

// Export singleton instance
export const config = new Config();
