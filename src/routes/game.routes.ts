import { NextFunction, Router, Request, Response } from "express";
import { body } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { validateRequest } from "@/middleware/validateRequest";
import { gameActionRateLimiter } from "@/middleware/rateLimiter";

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint for Railway deployment
router.get("/health", (_, res) => {
  res.status(200).json({ status: "healthy" });
});

// Game Status Endpoints
router.get(
  "/status",
  gameActionRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [agents, battles, alliances] = await Promise.all([
        prisma.agent.findMany({
          select: {
            id: true,
            name: true,
            characterType: true,
            status: true,
            wallet: {
              select: {
                governanceTokens: true,
              },
            },
            currentLocation: {
              select: {
                x: true,
                y: true,
              },
            },
            twitterHandle: true,
          },
        }),
        prisma.battle.count(),
        prisma.alliance.count({
          where: { status: "ACTIVE" },
        }),
      ]);

      res.json({
        activeAgents: agents.filter((a) => a.status === "ACTIVE").length,
        totalBattles: battles,
        activeAlliances: alliances,
        agents,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Token Management
router.post(
  "/stake",
  [
    body("agentId").isUUID(),
    body("amount").isFloat({ min: 0 }),
    validateRequest,
    gameActionRateLimiter,
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { agentId, amount } = req.body;

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          wallet: true,
        },
      });

      if (!agent) {
        res.status(404).json({ message: "Agent not found" });
        return;
      }

      if (agent.status === "DEFEATED") {
        res.status(400).json({ message: "Cannot stake on defeated agent" });
        return;
      }

      await prisma.wallet.update({
        where: { id: agent.wallet.id },
        data: {
          governanceTokens: {
            increment: amount,
          },
        },
      });

      res.json({
        message: "Tokens staked successfully",
        newBalance: agent.wallet.governanceTokens + amount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Battle History
router.get(
  "/battles",
  gameActionRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const battles = await prisma.battle.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        include: {
          attacker: {
            select: { name: true, twitterHandle: true },
          },
          defender: {
            select: { name: true, twitterHandle: true },
          },
        },
      });

      res.json(battles);
    } catch (error) {
      next(error);
    }
  }
);

// Agent Details
router.get(
  "/agent/:id/stats",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: req.params.id },
        include: {
          AttackerBattles: {
            take: 5,
            orderBy: { timestamp: "desc" },
          },
          DefenderBattles: {
            take: 5,
            orderBy: { timestamp: "desc" },
          },
          movementHistory: {
            take: 10,
            orderBy: { timestamp: "desc" },
          },
          alliances: {
            where: { status: "ACTIVE" },
          },
        },
      });

      if (!agent) {
        res.status(404).json({ message: "Agent not found" });
        return;
      }

      // Calculate battle statistics
      const totalBattles =
        agent.AttackerBattles.length + agent.DefenderBattles.length;
      const wins = [...agent.AttackerBattles, ...agent.DefenderBattles].filter(
        (b) => b.outcome === "ATTACKER_WIN"
      ).length;

      res.json({
        ...agent,
        statistics: {
          totalBattles,
          wins,
          winRate: totalBattles > 0 ? (wins / totalBattles) * 100 : 0,
          activeAlliances: agent.alliances.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as gameRoutes };
