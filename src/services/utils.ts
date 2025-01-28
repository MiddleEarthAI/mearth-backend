import type { MiddleEarthAiProgram } from "@/constants/middle_earth_ai_program";
import { mearthIdl } from "@/constants/middle_earth_ai_program_idl";
import { logger } from "@/utils/logger";
import { Program } from "@coral-xyz/anchor";
import type { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

/**
 * Get the Middle Earth program instance
 */
export async function getProgram(
	provider: AnchorProvider,
): Promise<Program<MiddleEarthAiProgram>> {
	try {
		const program = new Program<MiddleEarthAiProgram>(
			mearthIdl as MiddleEarthAiProgram,
			provider,
		);
		return program;
	} catch (error) {
		logger.error("Failed to get program:", error);
		throw error;
	}
}

/**
 * Get program derived address
 */
export function findPDA(
	seeds: Buffer[],
	programId: PublicKey = new PublicKey(mearthIdl.address),
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(seeds, programId);
}
