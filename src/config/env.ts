import { cleanEnv, str, num, url } from "envalid";
import "dotenv/config";

export const env = cleanEnv(process.env, {
  PORT: num({ default: 3001 }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),

  // Privy Configuration
  PRIVY_APP_ID: str({
    desc: "Privy App ID from your Privy dashboard",
    example: "clx123abc",
  }),
  PRIVY_APP_SECRET: str({
    desc: "Privy App Secret from your Privy dashboard",
    example: "sk_privy_xxx",
  }),

  // Logging
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "debug"],
    default: "info",
  }),

  // Security
  CORS_ORIGIN: str({
    desc: "Allowed CORS origin",
    default: "*",
  }),

  // API Configuration
  API_PREFIX: str({ default: "/api" }),
});
