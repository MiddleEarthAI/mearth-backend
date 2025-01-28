import { AgentConfig } from "@/Agent";
import { logger } from "./logger";

export function getAgentConfigById(id: number): AgentConfig {
  logger.info(`Getting agent config for id ${id}`);

  const config = {
    username: process.env[`${id}_USERNAME`] ?? "",
    password: process.env[`${id}_PASSWORD`] ?? "",
    email: process.env[`${id}_EMAIL`] ?? "",
    twitter2faSecret: process.env[`${id}_2FA_SECRET`] ?? "",
  };

  if (Object.values(config).some((value) => value === "")) {
    throw new Error(`Agent config for id ${id} is missing required fields`);
  }

  return config;
}
