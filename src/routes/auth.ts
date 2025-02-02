import { Router } from "express";
import { privyAuth, AuthenticatedRequest } from "@/middleware/privy-auth";
import { logger } from "@/utils/logger";

const router = Router();

/**
 * Protected route example using Privy authentication
 * Requires a valid Privy token in the Authorization header
 */
router.get("/me", privyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // The user object is attached by the privyAuth middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Return the authenticated user's information
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          issuedAt: user.issuedAt,
          expiration: user.expiration,
        },
      },
    });
  } catch (error) {
    logger.error("Error in /me route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
});

export default router;
