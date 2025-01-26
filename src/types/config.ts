export interface DatabaseConfig {
	url: string;
	maxConnections: number;
	timeout: number;
}

export interface SolanaConfig {
	rpcUrl: string;
	commitment: string;
	jwtSecret: string;
	keypairEncryptionKey: string;
}

export interface TwitterConfig {
	SCOOTLES_TWITTER_USERNAME: string;
	SCOOTLES_TWITTER_PASSWORD: string;
	SCOOTLES_TWITTER_EMAIL: string;

	PURRLOCKPAWS_TWITTER_USERNAME: string;
	PURRLOCKPAWS_TWITTER_PASSWORD: string;
	PURRLOCKPAWS_TWITTER_EMAIL: string;

	SIR_GULLIHOP_TWITTER_USERNAME: string;
	SIR_GULLIHOP_TWITTER_PASSWORD: string;
	SIR_GULLIHOP_TWITTER_EMAIL: string;

	WANDERLEAF_TWITTER_USERNAME: string;
	WANDERLEAF_TWITTER_PASSWORD: string;
	WANDERLEAF_TWITTER_EMAIL: string;
}

export interface SecurityConfig {
	keypairEncryptionKey: string;
	jwtSecret: string;
}

export interface AppConfig {
	port: number;
	environment: string;
	logLevel: string;
}

export interface GameConfig {
	battleCooldownHours: number;
	allianceCooldownHours: number;
	maxTokenBurnPercentage: number;
	minTokenBurnPercentage: number;
}
