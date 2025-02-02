import { cleanEnv, str, num, url } from "envalid";
import { config } from "dotenv";

// config();

// export const env = cleanEnv(process.env, {
//   // Rate Limiting
//   RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 minutes
//   RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),

//   // Privy Configuration
//   PRIVY_APP_ID: str({
//     desc: "Privy App ID from your Privy dashboard",
//     example: "clx123abc",
//   }),
//   PRIVY_APP_SECRET: str({
//     desc: "Privy App Secret from your Privy dashboard",
//     example: "sk_privy_xxx",
//   }),

//   // Security
//   CORS_ORIGIN: str({
//     desc: "Allowed CORS origin",
//     default: "*",
//   }),

//   // API Configuration
//   API_PREFIX: str({ default: "/api" }),
// });
