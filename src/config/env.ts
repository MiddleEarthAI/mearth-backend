import { cleanEnv, str, num, bool, url, port, makeValidator } from "envalid";
import { config as dotenvConfig } from "dotenv";

// Load .env file
dotenvConfig();

/**
 * Custom validator for BigInt values
 */
const bigint = makeValidator<bigint>((input: string) => {
  try {
    return BigInt(input);
  } catch (error) {
    throw new Error(`Invalid BigInt: ${input}`);
  }
});

/**
 * Custom validator for percentage values (0-100)
 */
const percentage = makeValidator<number>((input: string) => {
  const value = parseInt(input, 10);
  if (isNaN(value) || value < 0 || value > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }
  return value;
});

/**
 * Environment configuration with validation
 */
const env = cleanEnv(process.env, {
  // Server Configuration
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
    desc: "The application environment",
  }),
  PORT: port({
    default: 3001,
    desc: "Port number for the Express server",
  }),
  API_PREFIX: str({
    default: "/api",
    desc: "Prefix for all API routes",
  }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({
    default: 900, // 15 minutes in seconds
    desc: "Rate limit window in milliseconds (default: 15 minutes)",
  }),
  RATE_LIMIT_MAX_REQUESTS: num({
    default: 100,
    desc: "Maximum number of requests within the rate limit window",
  }),

  // Database Configuration
  DATABASE_URL: url({
    desc: "PostgreSQL database connection URL",
    example: "postgresql://postgres:postgres@localhost:5432/middle_earth_ai",
  }),

  // Redis Configuration
  REDIS_URL: url({
    desc: "Redis connection URL",
    example: "redis://:password@localhost:6379",
  }),
  REDIS_HOST: str({
    default: "localhost",
    desc: "Redis host address",
  }),
  REDIS_PORT: port({
    default: 6379,
    desc: "Redis port number",
  }),
  REDIS_PASSWORD: str({
    default: "redis",
    desc: "Redis authentication password",
  }),
  REDIS_DB: num({
    default: 0,
    desc: "Redis database number",
  }),
  SOLANA_RPC_URL: url({
    desc: "Solana RPC endpoint URL",
    // example: "https://api.devnet.solana.com",
  }),
  MIDDLE_EARTH_AI_AUTHORITY_PRIVATE_KEY: str({
    desc: "Private key for the game wallet",
  }),
  MEARTH_TOKEN_MINT: str({
    desc: "Token mint address for the Middle Earth game token",
  }),
  PP_TOKEN_ACCOUNT: str({
    desc: "Token account for agent 1 (purrlockpaws)",
  }),
  SC_TOKEN_ACCOUNT: str({
    desc: "Token account for agent 2 (scootles)",
  }),
  SG_TOKEN_ACCOUNT: str({
    desc: "Token account for agent 3 (sirgullihop)",
  }),
  WL_TOKEN_ACCOUNT: str({
    desc: "Token account for agent 4 (wanderleaf)",
  }),

  // Twitter API Configuration
  TWITTER_API_KEY: str({
    desc: "Twitter API key",
  }),
  TWITTER_API_SECRET: str({
    desc: "Twitter API secret",
  }),
  TWITTER_ACCESS_TOKEN_1: str({
    desc: "Twitter access token for agent 1",
  }),
  TWITTER_ACCESS_SECRET_1: str({
    desc: "Twitter access secret for agent 1",
  }),
  TWITTER_ACCESS_TOKEN_2: str({
    desc: "Twitter access token for agent 2",
  }),
  TWITTER_ACCESS_SECRET_2: str({
    desc: "Twitter access secret for agent 2",
  }),
  TWITTER_ACCESS_TOKEN_3: str({
    desc: "Twitter access token for agent 3",
  }),
  TWITTER_ACCESS_SECRET_3: str({
    desc: "Twitter access secret for agent 3",
  }),
  TWITTER_ACCESS_TOKEN_4: str({
    desc: "Twitter access token for agent 4",
  }),
  TWITTER_ACCESS_SECRET_4: str({
    desc: "Twitter access secret for agent 4",
  }),

  AGENT_ACTION_INTERVAL: num({
    desc: "Game state update interval in milliseconds",
  }),
  AGENT_INIT_GAP_DELAY: num({
    // default: 900000, // 15 minutes in milliseconds
    desc: "Delay between agent initializations in milliseconds",
  }),
  GAME_CLEANUP_INTERVAL: num({
    default: 900, // 15 minutes in seconds
    desc: "Game cleanup interval in milliseconds",
  }),

  MAX_RETRIES: num({
    default: 3,
    desc: "Maximum number of retry attempts for operations",
  }),

  // Game Mechanics Configuration
  TOKEN_BURN_MIN: percentage({
    default: 21,
    desc: "Minimum percentage of tokens to burn in battle (21-30%)",
  }),
  TOKEN_BURN_MAX: percentage({
    default: 30,
    desc: "Maximum percentage of tokens to burn in battle (21-30%)",
  }),
  DEATH_CHANCE: percentage({
    default: 10,
    desc: "Percentage chance of agent death in battle",
  }),
  BATTLE_COOLDOWN: num({
    default: 14400, // 4 hours in seconds
    desc: "Cooldown period after battle in seconds (default: 4 hours)",
  }),
  BATTLE_DURATION: num({
    default: 3600, // 1 hour in seconds
    desc: "Duration of a battle in seconds (default: 1 hour)",
  }),
  MOVE_COOLDOWN: num({
    default: 3600, // 1 hour in seconds
    desc: "Movement cooldown in seconds (default: 1 hour)",
  }),
  BATTLE_AFTER_ALLIANCE_COOLDOWN: num({
    default: 14400, // 4 hours in seconds
    desc: "Cooldown period for battles after alliance in seconds (default: 4 hours)",
  }),
  NEW_ALLIANCE_COOLDOWN: num({
    default: 86400, // 24 hours in seconds
    desc: "Cooldown period before forming new alliance in seconds (default: 24 hours)",
  }),
  IGNORE_COOLDOWN: num({
    default: 14400, // 4 hours in seconds
    desc: "Cooldown period after ignoring interaction in seconds (default: 4 hours)",
  }),

  // Game Constants (Non-configurable via env but exported for reference)
  MOVE_SPEED: num({
    default: 1,
    desc: "Fields per hour that an agent can move",
  }),

  MOUNTAIN_DELAY_TURNS: num({
    default: 2,
    desc: "Number of turns an agent is delayed when moving through mountains",
  }),
  RIVER_DELAY_TURNS: num({
    default: 1,
    desc: "Number of turns an agent is delayed when moving through rivers",
  }),
});

// Type definitions for environment variables
export type Env = typeof env;

// Export individual configurations for specific domains
export const serverConfig = {
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  isDev: env.isDev,
  isTest: env.isTest,
  isProd: env.isProduction,
};

export const dbConfig = {
  url: env.DATABASE_URL,
};

export const redisConfig = {
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
};

export const solanaConfig = {
  rpcUrl: env.SOLANA_RPC_URL,
  middleEarthAiAuthorityPrivateKey: env.MIDDLE_EARTH_AI_AUTHORITY_PRIVATE_KEY,
  tokenMint: env.MEARTH_TOKEN_MINT,
  ppTokenAccount: env.PP_TOKEN_ACCOUNT,
  scTokenAccount: env.SC_TOKEN_ACCOUNT,
  sgTokenAccount: env.SG_TOKEN_ACCOUNT,
  wlTokenAccount: env.WL_TOKEN_ACCOUNT,
};

export const twitterConfig = {
  apiKey: env.TWITTER_API_KEY,
  apiSecret: env.TWITTER_API_SECRET,
  agents: {
    1: {
      accessToken: env.TWITTER_ACCESS_TOKEN_1,
      accessSecret: env.TWITTER_ACCESS_SECRET_1,
    },
    2: {
      accessToken: env.TWITTER_ACCESS_TOKEN_2,
      accessSecret: env.TWITTER_ACCESS_SECRET_2,
    },
    3: {
      accessToken: env.TWITTER_ACCESS_TOKEN_3,
      accessSecret: env.TWITTER_ACCESS_SECRET_3,
    },
    4: {
      accessToken: env.TWITTER_ACCESS_TOKEN_4,
      accessSecret: env.TWITTER_ACCESS_SECRET_4,
    },
  },
};

export const gameConfig = {
  actionInterval: env.AGENT_ACTION_INTERVAL,
  agentInitGapDelay: env.AGENT_INIT_GAP_DELAY,
  cleanupInterval: env.GAME_CLEANUP_INTERVAL,
  maxRetries: env.MAX_RETRIES,
  mechanics: {
    battle: {
      duration: env.BATTLE_DURATION,
    },
    tokenBurn: {
      min: env.TOKEN_BURN_MIN,
      max: env.TOKEN_BURN_MAX,
    },
    deathChance: env.DEATH_CHANCE,
    cooldowns: {
      battle: env.BATTLE_COOLDOWN,
      movement: env.MOVE_COOLDOWN, // Base cooldown for movement
      battleAfterAlliance: env.BATTLE_AFTER_ALLIANCE_COOLDOWN,
      newAlliance: env.NEW_ALLIANCE_COOLDOWN,
      ignore: env.IGNORE_COOLDOWN,
    },
    movement: {
      speed: env.MOVE_SPEED,
      mountainDelayTurns: env.MOUNTAIN_DELAY_TURNS,
      riverDelayTurns: env.RIVER_DELAY_TURNS,
    },
  },
};
