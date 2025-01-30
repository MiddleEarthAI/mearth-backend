import { getTokenService } from "@/services";
import { logger } from "@/utils/logger";
import { Router } from "express";

const router = Router();

/**
 * Get stake info for an agent
 * @route GET /:agentId/stake
 * @param {string} agentId - The ID of the agent
 * @returns {Object} Stake information including amount, rewards, and timestamp
 */
// router.get("/:agentId/stake", async (req, res) => {
//   try {
//     const { agentId } = req.params;
//     const { gameId } = req.query;
//     logger.info(`🔍 Fetching stake info for agent ${agentId}`);

//     if (!agentId) {
//       logger.warn("❌ Missing agentId in request");
//       return res.status(400).json({
//         success: false,
//         error: "agentId is required",
//         details: "Please provide a valid agent ID in the URL parameter",
//       });
//     }

//     const tokenService = getTokenService();
//     const stakeInfo = await tokenService.getStakeInfo(
//       Number.parseInt(agentId),
//       Number.parseInt(gameId as string)
//     );

//     if (!stakeInfo) {
//       logger.warn(`❓ No stake info found for agent ${agentId}`);
//       return res.status(404).json({
//         success: false,
//         error: "Stake info not found",
//         details: `No staking information exists for agent ID ${agentId}`,
//       });
//     }

//     logger.info(`✅ Successfully retrieved stake info for agent ${agentId}`);
//     res.json({
//       success: true,
//       data: {
//         ...stakeInfo,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   } catch (error) {
//     logger.error(
//       `💥 Failed to fetch stake info for agent ${req.params.agentId}:`,
//       error
//     );
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch stake info",
//       details:
//         (error as Error).message ||
//         "An unexpected error occurred while fetching stake information",
//     });
//   }
// });

/**
 * Stake tokens for an agent
 * @route POST /:agentId/stake
 * @param {string} agentId - The ID of the agent
 * @param {number} amount - Amount of tokens to stake
 * @returns {Object} Transaction details
 */
router.post("/:agentId/stake", async (req, res) => {
	try {
		const { agentId } = req.params;
		const { gameId, amount } = req.body;
		logger.info(`💰 Initiating stake of ${amount} tokens for agent ${agentId}`);

		if (!agentId || !amount) {
			logger.warn("❌ Missing required parameters for staking");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					agentId: agentId ? "✅ Provided" : "❌ Missing",
					amount: amount ? "✅ Provided" : "❌ Missing",
				},
			});
		}

		const tokenService = getTokenService();
		const tx = await tokenService.stakeTokens(
			Number.parseInt(agentId),
			Number.parseInt(gameId),
			amount,
		);
		logger.info(`✅ Successfully staked tokens for agent ${agentId}`);

		res.json({
			success: true,
			data: {
				transaction: tx,
				timestamp: new Date().toISOString(),
				details: {
					agentId,
					amount,
					operation: "stake",
				},
			},
		});
	} catch (error) {
		logger.error(
			`💥 Failed to stake tokens for agent ${req.params.agentId}:`,
			error,
		);
		res.status(500).json({
			success: false,
			error: "Failed to stake tokens",
			details:
				(error as Error).message ||
				"An unexpected error occurred while staking tokens",
		});
	}
});

/**
 * Unstake tokens for an agent
 * @route POST /:agentId/unstake
 * @param {string} agentId - The ID of the agent
 * @param {number} amount - Amount of tokens to unstake
 * @returns {Object} Transaction details
 */
router.post("/:agentId/unstake", async (req, res) => {
	try {
		const { agentId } = req.params;
		const { amount } = req.body;
		logger.info(
			`💸 Initiating unstake of ${amount} tokens for agent ${agentId}`,
		);

		if (!agentId || !amount) {
			logger.warn("❌ Missing required parameters for unstaking");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					agentId: agentId ? "✅ Provided" : "❌ Missing",
					amount: amount ? "✅ Provided" : "❌ Missing",
				},
			});
		}

		const tokenService = getTokenService();
		const tx = await tokenService.unstakeTokens(
			Number.parseInt(agentId),
			amount,
		);
		logger.info(`✅ Successfully unstaked tokens for agent ${agentId}`);

		res.json({
			success: true,
			data: {
				transaction: tx,
				timestamp: new Date().toISOString(),
				details: {
					agentId,
					amount,
					operation: "unstake",
				},
			},
		});
	} catch (error) {
		logger.error(
			`💥 Failed to unstake tokens for agent ${req.params.agentId}:`,
			error,
		);
		res.status(500).json({
			success: false,
			error: "Failed to unstake tokens",
			details:
				(error as Error).message ||
				"An unexpected error occurred while unstaking tokens",
		});
	}
});

/**
 * Claim staking rewards for an agent
 * @route POST /:agentId/claim-rewards
 * @param {string} agentId - The ID of the agent
 * @returns {Object} Transaction details
 */
router.post("/:agentId/claim-rewards", async (req, res) => {
	try {
		const { agentId } = req.params;
		logger.info(`🎁 Initiating reward claim for agent ${agentId}`);

		if (!agentId) {
			logger.warn("❌ Missing agentId for reward claim");
			return res.status(400).json({
				success: false,
				error: "agentId is required",
				details: "Please provide a valid agent ID in the URL parameter",
			});
		}

		const tokenService = getTokenService();
		const tx = await tokenService.claimStakingRewards(Number.parseInt(agentId));
		logger.info(`✅ Successfully claimed rewards for agent ${agentId}`);

		res.json({
			success: true,
			data: {
				transaction: tx,
				timestamp: new Date().toISOString(),
				details: {
					agentId,
					operation: "claim-rewards",
				},
			},
		});
	} catch (error) {
		logger.error(
			`💥 Failed to claim rewards for agent ${req.params.agentId}:`,
			error,
		);
		res.status(500).json({
			success: false,
			error: "Failed to claim rewards",
			details:
				(error as Error).message ||
				"An unexpected error occurred while claiming rewards",
		});
	}
});

export default router;
