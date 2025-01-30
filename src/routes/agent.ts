import { AgentManager } from "@/agent/AgentManager";
import {
	getGameService,
	getGameStateService,
	getTokenService,
} from "@/services";
import { logger } from "@/utils/logger";
import { Router } from "express";

const router = Router();

/**
 * Register a new agent
 */
router.post("/register", async (req, res) => {
	try {
		const { gameId, agentId, x, y, name } = req.body;

		if (!gameId || !agentId || x === undefined || y === undefined || !name) {
			logger.warn("🚫 Missing parameters for agent registration");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					gameId: !gameId ? "Missing game ID" : undefined,
					agentId: !agentId ? "Missing agent ID" : undefined,
					coordinates:
						x === undefined || y === undefined
							? "Missing coordinates"
							: undefined,
					name: !name ? "Missing name" : undefined,
				},
			});
		}

		const gameService = getGameService();
		const tx = await gameService.registerAgent(gameId, agentId, x, y, name);

		logger.info(`✨ Successfully registered agent ${name} (ID: ${agentId})`);
		res.json({
			success: true,
			transaction: tx,
			data: {
				gameId,
				agentId,
				position: { x, y },
				name,
				registrationTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to register agent:", error);
		res.status(500).json({
			success: false,
			error: "Failed to register agent",
			details: (error as Error).message,
		});
	}
});

/**
 * Start a new agent
 */
router.post("/start", async (req, res) => {
	try {
		const { gameId, agentId } = req.body as {
			gameId: string;
			agentId: string;
		};

		if (!agentId) {
			logger.warn("🚫 Missing parameters for agent start");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					gameId: !gameId ? "Missing game ID" : undefined,
					agentId: !agentId ? "Missing agent ID" : undefined,
				},
			});
		}

		const agentManager = AgentManager.getInstance();
		await agentManager.startAgent(
			Number.parseInt(gameId),
			Number.parseInt(agentId),
		);

		logger.info(`🚀 Agent ${agentId} successfully started`);
		res.json({
			success: true,
			message: `Agent ${agentId} started`,
			data: {
				agentId,
				startTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to start agent:", error);
		res.status(500).json({
			success: false,
			error: "Failed to start agent",
			details: (error as Error).message,
		});
	}
});

/**
 * Move an agent
 */
router.post("/:agentId/move", async (req, res) => {
	try {
		const { agentId } = req.params;
		const { x, y, terrain, gameId } = req.body;
		if (
			!agentId ||
			x === undefined ||
			y === undefined ||
			terrain === undefined ||
			!gameId
		) {
			logger.warn("🚫 Missing parameters for agent movement");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					agentId: !agentId ? "Missing agent ID" : undefined,
					coordinates:
						x === undefined || y === undefined
							? "Missing coordinates"
							: undefined,
					terrain: terrain === undefined ? "Missing terrain type" : undefined,
					gameId: !gameId ? "Missing game ID" : undefined,
				},
			});
		}

		const gameService = getGameService();
		const tx = await gameService.moveAgent(
			Number.parseInt(gameId),
			Number.parseInt(agentId),
			x,
			y,
			terrain,
		);

		logger.info(`🚶 Agent ${agentId} moved to position (${x}, ${y})`);
		res.json({
			success: true,
			transaction: tx,
			data: {
				agentId,
				newPosition: { x, y },
				terrain,
				moveTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to move agent:", error);
		res.status(500).json({
			success: false,
			error: "Failed to move agent",
			details: (error as Error).message,
		});
	}
});

/**
 * Stop an agent
 */
router.post("/:agentId/stop", async (req, res) => {
	try {
		const { agentId } = req.params;
		const agentManager = AgentManager.getInstance();
		await agentManager.stopAgent(Number.parseInt(agentId));

		logger.info(`🛑 Agent ${agentId} successfully stopped`);
		res.json({
			success: true,
			message: `Agent ${agentId} stopped`,
			data: {
				agentId,
				stopTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to stop agent:", error);
		res.status(500).json({
			success: false,
			error: "Failed to stop agent",
			details: (error as Error).message,
		});
	}
});

/**
 * Get agent details
 */
router.get("/:agentId", async (req, res) => {
	try {
		const { agentId } = req.params;
		const { gameId } = req.query;
		if (!agentId || !gameId) {
			logger.warn("🚫 Missing agent ID in request");
			return res.status(400).json({
				success: false,
				error: "agentId and gameId are required",
			});
		}

		const stateService = getGameStateService();
		const agent = await stateService.getAgent(
			Number.parseInt(agentId),
			Number.parseInt(gameId as string),
		);

		if (!agent) {
			logger.warn(`⚠️ Agent ${agentId} not found in game ${gameId}`);
			return res.status(404).json({
				success: false,
				error: "Agent not found",
				agentId,
			});
		}

		logger.info(`📋 Retrieved details for agent ${agentId} in game ${gameId}`);
		res.json({
			success: true,
			data: agent,
			retrievalTime: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("💥 Failed to fetch agent:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch agent",
			details: (error as Error).message,
		});
	}
});

/**
 * Stake tokens for an agent
 */
router.post("/:agentId/stake", async (req, res) => {
	try {
		const { agentId } = req.params;
		const { gameId, amount } = req.body;
		if (!agentId || !gameId || !amount) {
			logger.warn("🚫 Missing parameters for token staking");
			return res.status(400).json({
				success: false,
				error: "Missing required parameters",
				details: {
					agentId: !agentId ? "Missing agent ID" : undefined,
					amount: !amount ? "Missing stake amount" : undefined,
				},
			});
		}

		const tokenService = getTokenService();
		const tx = await tokenService.stakeTokens(
			Number.parseInt(agentId),
			Number.parseInt(gameId as string),
			amount,
		);

		logger.info(
			`💰 Successfully staked ${amount} tokens for agent ${agentId} in game ${gameId}`,
		);
		res.json({
			success: true,
			transaction: tx,
			data: {
				agentId,
				stakedAmount: amount,
				stakeTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to stake tokens:", error);
		res.status(500).json({
			success: false,
			error: "Failed to stake tokens",
			details: (error as Error).message,
		});
	}
});

/**
 * Get all active agents
 */
router.get("/active", async (_req, res) => {
	try {
		const agentManager = AgentManager.getInstance();
		const activeAgents = agentManager.getActiveAgents();

		res.json({
			success: true,
			data: {
				count: activeAgents.count,
				agents: activeAgents.agents,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("💥 Failed to get active agents:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get active agents",
			details: (error as Error).message,
		});
	}
});

export default router;
