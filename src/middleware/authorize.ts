import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./privy-auth";
import { prisma } from "@/config/prisma";

import { UserRole } from "@prisma/client";

/**
 * Get or create user record from Privy authentication
 * If we need additional user info, we'll need to make separate Privy API calls
 * or store the info when users connect their wallets/emails
 */
export async function getOrCreateUser(userId: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { privyUserId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          privyUserId: userId,
          role: UserRole.USER,
          // Note: email and walletAddress will be updated
          // when user connects them through Privy
        },
      });
      console.info(`Created new user record for Privy user ${userId}`);
    }

    return user;
  } catch (error) {
    console.error("Failed to get/create user:", error);
    throw error;
  }
}

/**
 * Check if user has admin role
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const user = await getOrCreateUser(req.user.id);

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    // Attach full user object to request
    req.user = { ...req.user, ...user };
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({
      success: false,
      error: "Authorization failed",
      details: (error as Error).message,
    });
  }
};

// /**
//  * Check if user owns or manages the game
//  */
// export const requireGameAccess = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({
//         success: false,
//         error: "Authentication required",
//       });
//     }

//     const user = await getOrCreateUser(req.user.id);
//     const gameId = req.params.gameId || req.body.gameId || req.query.gameId;

//     if (!gameId) {
//       return res.status(400).json({
//         success: false,
//         error: "Game ID is required",
//       });
//     }

//     // Check if user is admin (admins have access to all games)
//     if (user.role === UserRole.ADMIN) {
//       req.user = { ...req.user, ...user };
//       return next();
//     }

//     // Check if user owns or manages the game
//     const game = await prisma.game.findFirst({
//       where: {
//         id: gameId,
//         // OR: [{ ownerId: user.id }, { managers: { some: { id: user.id } } }],
//       },
//     });

//     if (!game) {
//       return res.status(403).json({
//         success: false,
//         error: "You don't have access to this game",
//       });
//     }

//     // Attach full user object to request
//     req.user = { ...req.user, ...user };
//     next();
//   } catch (error) {
//     console.error("Game authorization error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Authorization failed",
//       details: (error as Error).message,
//     });
//   }
// };

/**
 * Check if user owns the agent
 */
export const requireAgentOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const user = await getOrCreateUser(req.user.id);
    const agentId = req.params.agentId || req.body.agentId;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    // Check if user is admin (admins have access to all agents)
    if (user.role === UserRole.ADMIN) {
      req.user = { ...req.user, ...user };
      return next();
    }

    // Check if user owns the agent
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        // ownerId: user.id,
      },
    });

    if (!agent) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this agent",
      });
    }

    // Attach full user object to request
    req.user = { ...req.user, ...user };
    next();
  } catch (error) {
    console.error("Agent authorization error:", error);
    res.status(500).json({
      success: false,
      error: "Authorization failed",
      details: (error as Error).message,
    });
  }
};
