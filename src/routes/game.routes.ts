import { Router } from "express";
import { body } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { validateRequest } from "@/middleware/validateRequest";

const router = Router();
const prisma = new PrismaClient();

// Game Status Endpoints
router.get("/status", async (req, res, next) => {
  try {
    const [agents, battles, alliances] = await Promise.all([
      prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          isAlive: true,
          tokenBalance: true,
          positionX: true,
          positionY: true,
          twitterHandle: true,
        },
      }),
      prisma.battle.count(),
      prisma.alliance.count({
        where: { dissolvedAt: null },
      }),
    ]);

    res.json({
      activeAgents: agents.filter((a: { isAlive: boolean }) => a.isAlive)
        .length,
      totalBattles: battles,
      activeAlliances: alliances,
      agents,
    });
  } catch (error) {
    next(error);
  }
});

// Token Management
router.post(
  "/stake",
  [
    body("agentId").isUUID(),
    body("amount").isFloat({ min: 0 }),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { agentId, amount } = req.body;

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (!agent.isAlive) {
        return res.status(400).json({ message: "Cannot stake on dead agent" });
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          tokenBalance: {
            increment: amount,
          },
        },
      });

      res.json({
        message: "Tokens staked successfully",
        newBalance: agent.tokenBalance + amount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Battle History
router.get("/battles", async (req, res, next) => {
  try {
    const battles = await prisma.battle.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
      include: {
        initiator: {
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
});

// Agent Details
router.get("/agent/:id/stats", async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        initiatedBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
        },
        defendedBattles: {
          take: 5,
          orderBy: { timestamp: "desc" },
        },
        movements: {
          take: 10,
          orderBy: { timestamp: "desc" },
        },
        alliancesAsAgent1: {
          where: { dissolvedAt: null },
        },.
        alliancesAsAgent2: {
          where: { dissolvedAt: null },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Calculate battle statistics
    const totalBattles =
      agent.initiatedBattles.length + agent.defendedBattles.length;
    const wins = [...agent.initiatedBattles, ...agent.defendedBattles].filter(
      (b) => b.outcome === "WIN"
    ).length;

    res.json({
      ...agent,
      statistics: {
        totalBattles,
        wins,
        winRate: totalBattles > 0 ? (wins / totalBattles) * 100 : 0,
        activeAlliances:
          agent.alliancesAsAgent1.length + agent.alliancesAsAgent2.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as gameRoutes };
