import { Router, Response } from "express";
import { privyAuth, AuthenticatedRequest } from "@/middleware/privy-auth";
import agentRoutes from "./agent";
import gameRoutes from "./game";

const router = Router();

// Health check endpoint (unprotected)
router.get("/health", (_, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Protected routes
router.use("/game", privyAuth, gameRoutes);
router.use("/agent", privyAuth, agentRoutes);

export default router;
