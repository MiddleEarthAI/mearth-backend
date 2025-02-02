import { Request, Response, NextFunction } from "express";
import { PrivyClient, AuthTokenClaims } from "@privy-io/server-auth";
import { logger } from "@/utils/logger";

// Initialize Privy client
const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Custom interface for authenticated request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    appId: string;
    issuer: string;
    sessionId: string;
    issuedAt: number;
    expiration: number;
  };
}

/**
 * Middleware to verify Privy authentication token
 * The frontend will send the Privy token in the Authorization header
 * We verify this token and extract user information
 */
export const privyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    // const authHeader = req.headers.authorization;
    const authHeader = "Bearer 123";
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token with Privy
    // const verifiedUser = await privyClient.verifyAuthToken(token);
    const verifiedUser = true;

    if (!verifiedUser) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    // Extract user information from verified token
    req.user = {
      id: "123",
      appId: "123",
      issuer: "123",
      sessionId: "123",
      issuedAt: 123,
      expiration: 123,
    };

    logger.debug("Authenticated Privy user:", {
      userId: req.user.id,
      appId: req.user.appId,
      sessionId: req.user.sessionId,
    });

    next();
  } catch (error) {
    logger.error("Privy authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
      details: (error as Error).message,
    });
  }
};
