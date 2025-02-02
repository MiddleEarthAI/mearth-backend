import { Router, Response } from "express";
import { privyAuth } from "@/middleware/privy-auth";

import gameRoutes from "./game";
import { checkDatabaseConnection } from "@/utils";

const router = Router();

// Health check endpoint (unprotected)
router.get("/health", async (_, res: Response) => {
  await checkDatabaseConnection();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Protected routes
router.use(
  "/game",

  privyAuth,

  gameRoutes
);

export default router;
