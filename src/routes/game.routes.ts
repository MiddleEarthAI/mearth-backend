import { Router } from "express";
import { body } from "express-validator";
import { GameService } from "../services/game.service";
import { validateRequest } from "../middleware/validateRequest";
import { TerrainType } from "../types/game";

const router = Router();
const gameService = new GameService();

// Get all active agents
router.get("/agents", async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { isAlive: true },
    });
    res.json(agents);
  } catch (error) {
    next(error);
  }
});

// Move agent
router.post(
  "/move",
  [
    body("agentId").isUUID(),
    body("x").isFloat({ min: -60, max: 60 }),
    body("y").isFloat({ min: -60, max: 60 }),
    body("terrain").isIn(Object.values(TerrainType)),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { agentId, x, y, terrain } = req.body;
      await gameService.moveAgent(agentId, { x, y }, terrain as TerrainType);
      res.status(200).json({ message: "Movement successful" });
    } catch (error) {
      next(error);
    }
  }
);

// Initiate battle
router.post(
  "/battle",
  [body("initiatorId").isUUID(), body("defenderId").isUUID(), validateRequest],
  async (req, res, next) => {
    try {
      const { initiatorId, defenderId } = req.body;
      const outcome = await gameService.processBattle(initiatorId, defenderId);
      res.status(200).json({ outcome });
    } catch (error) {
      next(error);
    }
  }
);

// Form alliance
router.post(
  "/alliance",
  [body("agent1Id").isUUID(), body("agent2Id").isUUID(), validateRequest],
  async (req, res, next) => {
    try {
      const { agent1Id, agent2Id } = req.body;
      await gameService.formAlliance(agent1Id, agent2Id);
      res.status(200).json({ message: "Alliance formed successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Get agent stats
router.get("/agent/:id", async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        initiatedBattles: true,
        defendedBattles: true,
        movements: {
          take: 10,
          orderBy: { timestamp: "desc" },
        },
        alliancesAsAgent1: true,
        alliancesAsAgent2: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.json(agent);
  } catch (error) {
    next(error);
  }
});

export { router as gameRoutes };
