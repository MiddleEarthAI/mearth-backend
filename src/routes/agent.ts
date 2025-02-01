import { Agent } from "@/agent/Agent";
import { prisma } from "@/config/prisma";
import { validateZod } from "@/middleware/validateZod";
import { registerAgentSchema } from "@/schemas/agent";
import { getGameService } from "@/services";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { Router } from "express";

const router = Router();

/**
 * Register a new agent
 * @route POST /agent/register
 * @param {number} gameId - The ID of the game to register in
 * @param {number} agentId - The unique identifier for the agent
 * @param {number} x - Initial x coordinate
 * @param {number} y - Initial y coordinate
 * @param {string} name - Agent name (max 32 characters)
 * @returns {Object} Registration details and transaction info
 */
router.post("/register", validateZod(registerAgentSchema), async (req, res) => {
  try {
    const { gameId, agentId, x, y, name, xHandle } = req.body;
    const gameService = getGameService();
    const tx = await gameService.registerAgent(
      gameId,
      agentId,
      x,
      y,
      name,
      xHandle
    );

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
      terrain
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

    const program = await getProgramWithWallet();

    const [gamePda] = getGamePDA(program.programId, new BN(gameId));

    const [agentPda] = getAgentPDA(program.programId, gamePda, new BN(agentId));

    const agent = await program.account.agent.fetch(agentPda);

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

export default router;
