import { Router, Response } from "express";
import { privyAuth, AuthenticatedRequest } from "@/middleware/privy-auth";
import { requireAdmin, requireGameAccess } from "@/middleware/authorize";
import { logger } from "@/utils/logger";
import { getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";
import { BN } from "@coral-xyz/anchor";

import { createNextGame } from "@/config/setup";
import { Agent } from "@/agent/Agent";
import { prisma } from "@/config/prisma";
import { checkDatabaseConnection } from "@/utils";

const router = Router();

/**
 * Initialize a new game
 * Protected: Requires admin role
 */
router.post(
  "/init",
  // [privyAuth, requireAdmin],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await checkDatabaseConnection();
      const { tx, gameAccount } = await createNextGame();

      logger.info(`✨ Game ${gameAccount.gameId} successfully initialized!`);
      res.json({
        success: true,
        transaction: tx,
        data: {
          gameId: gameAccount.gameId,
          gameAccount,
          initializationTime: new Date().toISOString(),
          initiatedBy: req.user?.id,
        },
      });
    } catch (error) {
      logger.error(`💥 Failed to initialize game:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to initialize game",
        details: (error as Error).message,
      });
    }
  }
);

/**
 * Start a new agent
 * Protected: Requires game access
 */
router.post(
  "/start",
  // [privyAuth, requireGameAccess],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await checkDatabaseConnection();

      const response = req.query;
      const gameId = Number(response.gameId as string);
      if (!gameId) {
        logger.warn("🚫 Missing parameters for starting agents");
        return res.status(400).json({
          success: false,
          error: "Missing required parameters",
          details: {
            gameId: !gameId ? "Missing game ID" : undefined,
          },
        });
      }

      const agents = await prisma.agent.findMany({
        where: {
          game: {
            gameId: gameId,
          },
        },
        include: {
          agentProfile: true,
          location: true,
          community: {
            include: {
              interactions: true,
            },
          },
          battles: true,
          currentAlliance: true,
          cooldowns: true,
          state: true,
        },
      });

      if (agents.length === 0) {
        logger.warn(`🚫 No agents found for game ${gameId}`);
        return res.status(404).json({
          success: false,
          error: "No agents found",
          gameId,
        });
      }
      for (const dbAgent of agents) {
        const agent = new Agent(dbAgent, Number(gameId));
        agent.start();
      }
      res.json({
        success: true,
        message: `Agents started for game ${gameId}`,
        data: {
          gameId,
          startTime: new Date().toISOString(),
          startedBy: req.user?.id,
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
  }
);

/**
 * Get game state
 * Protected: Requires game access
 */
router.get(
  "/:gameId",
  [privyAuth, requireGameAccess],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { gameId } = req.params;
      if (!gameId) {
        logger.warn("🚫 Missing gameId in state request");
        return res.status(400).json({
          success: false,
          error: "Missing required parameter",
          details: {
            gameId: "Game ID is required",
          },
        });
      }

      logger.info(`🔍 Fetching state for game ${gameId}`);
      const program = await getProgramWithWallet();
      const [gamePda] = getGamePDA(program.programId, new BN(gameId));
      const game = await program.account.game.fetch(gamePda);

      if (!game) {
        logger.warn(`⚠️ Game ${gameId} not found`);
        return res.status(404).json({
          success: false,
          error: "Game not found",
          details: {
            gameId,
            message: "No game exists with the provided ID",
          },
        });
      }

      logger.info(`📊 Successfully retrieved state for game ${gameId}`);
      res.json({
        success: true,
        data: {
          gameId,
          game,
          retrievalTime: new Date().toISOString(),
          requestedBy: req.user?.id,
        },
      });
    } catch (error) {
      logger.error(
        `💥 Failed to fetch state for game ${req.params.gameId}:`,
        error
      );
      res.status(500).json({
        success: false,
        error: "Failed to fetch game state",
        details: (error as Error).message,
      });
    }
  }
);

export default router;
