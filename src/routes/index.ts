import { Router } from "express";
import agentRoutes from "./agent";
import gameRoutes from "./game";
import tokenRoutes from "./token";

const router = Router();

// Health check endpoint
router.get("/health", (_, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount routes
router.use("/game", gameRoutes);
router.use("/agent", agentRoutes);
router.use("/token", tokenRoutes);

export default router;
