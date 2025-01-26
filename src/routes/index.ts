import { Router } from "express";
import { gameRoutes } from "./game.routes";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Server is healthy",
		timestamp: new Date().toISOString(),
	});
});

// Game routes
router.use("/game", gameRoutes);

export { router as routes };
