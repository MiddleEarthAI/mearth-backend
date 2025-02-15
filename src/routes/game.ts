// import { Router, Response } from "express";
// import { AuthenticatedRequest } from "@/middleware/privy-auth";
// // import { requireAdmin, requireGameAccess } from "@/middleware/authorize";
// import { getGamePDA } from "@/utils/pda";
// import { getProgramWithWallet } from "@/utils/program";
// import { BN } from "@coral-xyz/anchor";

// import { prisma } from "@/config/prisma";
// import { checkDatabaseConnection } from "@/utils";

// const router: Router = Router();

// /**
//  * Initialize a new game
//  * Protected: Requires admin role
//  */
// router.post(
//   "/init"
//   // [privyAuth, requireAdmin],
//   // async (req: AuthenticatedRequest, res: Response) => {
//   //   try {
//   //     await checkDatabaseConnection();

//   //     const program = await getProgramWithWallet();
//   //     const prisma = new PrismaClient();
//   //     const gameManager = new GameManager(program, prisma);
//   //     const { agents, gameAccount } = await gameManager.createNewGame();

//   //     const twitter = new TwitterManager(agents);
//   //     const cache = new CacheManager();

//   //     const eventEmitter = new EventEmitter();
//   //     const actionManager = new ActionManager(
//   //       program,
//   //       gameAccount.gameId,
//   //       prisma
//   //     );
//   //     const engine = new DecisionEngine(prisma, eventEmitter, program);

//   //     const battleResolver = new BattleResolver(
//   //       {
//   //         gameOnchainId: gameAccount.gameId,
//   //         gameId: gameAccount.gameId,
//   //       },
//   //       program,
//   //       prisma
//   //     );

//   //     const orchestrator = new GameOrchestrator(
//   //       gameAccount.gameId,
//   //       agents[0].agent.gameId,
//   //       actionManager,
//   //       twitter,
//   //       cache,
//   //       calculator,
//   //       engine,
//   //       prisma,
//   //       eventEmitter,
//   //       battleResolver
//   //     );

//   //     try {
//   //       await orchestrator.start();
//   //       console.info("System started successfully");
//   //     } catch (error) {
//   //       console.error("Failed to start system", { error });
//   //       process.exit(1);
//   //     }

//   //     console.info(`✨ Game ${gameAccount.gameId} successfully initialized!`);
//   //     res.json({
//   //       success: true,
//   //       data: {
//   //         gameId: gameAccount.gameId,
//   //         gameAccount,
//   //         initializationTime: new Date().toISOString(),
//   //         initiatedBy: req.user?.id,
//   //       },
//   //     });
//   //   } catch (error) {
//   //     console.error(`💥 Failed to initialize game:`, error);
//   //     res.status(500).json({
//   //       success: false,
//   //       error: "Failed to initialize game",
//   //       details: (error as Error).message,
//   //     });
//   //   }
//   // }
// );

// /**
//  * Start a new agent
//  * Protected: Requires game access
//  */
// router.post(
//   "/start",
//   // [privyAuth, requireGameAccess],
//   async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       await checkDatabaseConnection();

//       const response = req.query;
//       const gameId = Number(response.gameId as string);
//       if (!gameId) {
//         console.warn("🚫 Missing parameters for starting agents");
//         return res.status(400).json({
//           success: false,
//           error: "Missing required parameters",
//           details: {
//             gameId: !gameId ? "Missing game ID" : undefined,
//           },
//         });
//       }

//       const agents = await prisma.agent.findMany({
//         where: {
//           onchainId: gameId,
//         },
//         include: {
//           mapTile: true,
//           profile: true,
//           joinedAlliances: true,
//         },
//       });

//       if (agents.length === 0) {
//         console.warn(`🚫 No agents found for game ${gameId}`);
//         return res.status(404).json({
//           success: false,
//           error: "No agents found",
//           gameId,
//         });
//       }

//       res.json({
//         success: true,
//         message: `Agents started for game ${gameId}`,
//         data: {
//           gameId,
//           startTime: new Date().toISOString(),
//           startedBy: req.user?.id,
//         },
//       });
//     } catch (error) {
//       console.error("💥 Failed to start agent:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to start agent",
//         details: (error as Error).message,
//       });
//     }
//   }
// );

// /**
//  * Get game state
//  * Protected: Requires game access
//  */
// router.get(
//   "/:gameId",
//   // [privyAuth, requireGameAccess],
//   async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       const { gameId } = req.params;
//       if (!gameId) {
//         console.warn("🚫 Missing gameId in state request");
//         return res.status(400).json({
//           success: false,
//           error: "Missing required parameter",
//           details: {
//             gameId: "Game ID is required",
//           },
//         });
//       }

//       console.info(`🔍 Fetching state for game ${gameId}`);
//       const program = await getProgramWithWallet();
//       const [gamePda] = getGamePDA(program.programId, new BN(gameId));
//       const game = await program.account.game.fetch(gamePda);

//       if (!game) {
//         console.warn(`⚠️ Game ${gameId} not found`);
//         return res.status(404).json({
//           success: false,
//           error: "Game not found",
//           details: {
//             gameId,
//             message: "No game exists with the provided ID",
//           },
//         });
//       }

//       console.info(`📊 Successfully retrieved state for game ${gameId}`);
//       res.json({
//         success: true,
//         data: {
//           gameId,
//           game,
//           retrievalTime: new Date().toISOString(),
//           requestedBy: req.user?.id,
//         },
//       });
//     } catch (error) {
//       console.error(
//         `💥 Failed to fetch state for game ${req.params.gameId}:`,
//         error
//       );
//       res.status(500).json({
//         success: false,
//         error: "Failed to fetch game state",
//         details: (error as Error).message,
//       });
//     }
//   }
// );

// export default router;
