import { registerAgent } from "@/instructionUtils/agent";
import { privyAuth, AuthenticatedRequest } from "@/middleware/privy-auth";
import { requireAgentOwnership } from "@/middleware/authorize";
import { registerAgentSchema } from "@/schemas/agent";
import { logger } from "@/utils/logger";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";
import { Router, Response } from "express";

const router = Router();

/**
 * Register a new agent
 * Protected: Requires game access
 * @route POST /agent/register
 * @param {number} gameId - The ID of the game to register in
 * @param {number} agentId - The unique identifier for the agent
 * @param {number} x - Initial x coordinate
 * @param {number} y - Initial y coordinate
 * @param {string} name - Agent name (max 32 characters)
 * @returns {Object} Registration details and transaction info
 */
router.post(
  "/register",
  // [privyAuth, requireGameAccess, validateZod(registerAgentSchema)],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { gameId, agentId, x, y, name } = req.body;
      const program = await getProgramWithWallet();

      const tx = await registerAgent(gameId, agentId, x, y, name);

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
          registeredBy: req.user?.id,
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
  }
);

/**
 * Get agent details
 * Protected: Requires agent ownership
 */
router.get(
  "/:agentId",
  [privyAuth, requireAgentOwnership],
  async (req: AuthenticatedRequest, res: Response) => {
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
      const [agentPda] = getAgentPDA(
        program.programId,
        gamePda,
        new BN(agentId)
      );
      const agent = await program.account.agent.fetch(agentPda);

      if (!agent) {
        logger.warn(`⚠️ Agent ${agentId} not found in game ${gameId}`);
        return res.status(404).json({
          success: false,
          error: "Agent not found",
          agentId,
        });
      }

      logger.info(
        `📋 Retrieved details for agent ${agentId} in game ${gameId}`
      );
      res.json({
        success: true,
        data: agent,
        retrievalTime: new Date().toISOString(),
        requestedBy: req.user?.id,
      });
    } catch (error) {
      logger.error("💥 Failed to fetch agent:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agent",
        details: (error as Error).message,
      });
    }
  }
);

export default router;
