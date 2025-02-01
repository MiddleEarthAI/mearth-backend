import { Router } from "express";
import { getGameService } from "@/services";

import { logger } from "@/utils/logger";
import { getGamePDA } from "@/utils/pda";
import { getProgramWithWallet } from "@/utils/program";

const router = Router();

/**
 * Initialize a new game
 */
router.post("/init", async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) {
      logger.warn("🚫 Missing gameId in initialization request");
      return res.status(400).json({
        success: false,
        error: "Missing required parameter",
        details: {
          gameId: "Game ID is required",
        },
      });
    }

    logger.info(`🎮 Initializing new game world - Game ID: ${gameId}`);
    const gameService = getGameService();
    const { tx, gameAccount } = await gameService.initializeGame(gameId);

    logger.info(`✨ Game ${gameId} successfully initialized!`);
    res.json({
      success: true,
      transaction: tx,
      data: {
        gameId,
        gameAccount,
        initializationTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`💥 Failed to initialize game ${req.body.gameId}:`, error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize game",
      details: (error as Error).message,
    });
  }
});

/**
 * Get game state
 */
router.get("/:gameId", async (req, res) => {
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
    const [gamePda] = getGamePDA(program.programId, Number.parseInt(gameId));
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
});

export default router;
