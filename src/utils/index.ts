import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { logger } from "@/utils/logger";
import { Program } from "@coral-xyz/anchor";
import type { AnchorProvider } from "@coral-xyz/anchor";

export function getAgentConfigById(id: number) {
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

/**
 * Get the Middle Earth program instance
 */
export async function getProgram(
  provider: AnchorProvider
): Promise<Program<MiddleEarthAiProgram>> {
  try {
    const program = new Program<MiddleEarthAiProgram>(
      mearthIdl as MiddleEarthAiProgram,
      provider
    );
    return program;
  } catch (error) {
    logger.error("Failed to get program:", error);
    throw error;
  }
}
