// import { prisma } from "@/config/prisma";
// import { getGameService } from "@/services";
// import { logger } from "@/utils/logger";
// import { tool } from "ai";
// import { z } from "zod";
// import { calculateDistance } from "./utils";

// export interface AllianceValidationResult {
//   success: boolean;
//   message: string;
//   transactionId?: string;
// }

// /**
//  * Creates an alliance tool for diplomatic interactions between agents
//  * Uses GameService for blockchain interactions and alliance mechanics
//  */
// export const allianceTool = async ({
//   gameId,
//   agentId,
// }: {
//   gameId: number;
//   agentId: number;
// }) => {
//   const gameService = getGameService();

//   const agent = await prisma.agent.findUnique({
//     where: {
//       agentId: agentId,
//     },
//     include: {
//       location: true,
//       currentAlliance: true,
//       state: true,
//       battles: {
//         take: 10,
//         orderBy: {
//           timestamp: "desc",
//         },
//       },
//     },
//   });

//   if (!agent) {
//     throw new Error("Agent not found");
//   }

//   // Calculate win rate from battles
//   const totalBattles = agent.battles.length;
//   const victories = agent.battles.filter((b) => b.outcome === "victory").length;
//   const winRate = totalBattles > 0 ? victories / totalBattles : 0;

//   const contextualDescription = `Alliance System | Agent: ${agent.xHandle}

// CURRENT STATUS
// Position: (${agent.location?.x ?? "-"}, ${agent.location?.y ?? "-"})
// Active Alliance: ${agent.currentAlliance ? "Yes" : "None"}

// DIPLOMATIC FRAMEWORK
// Core Mechanics:
// - Proximity-based alliance formation (<=2 distance units)
// - Mutual token staking mechanism
// - Shared reward distribution system
// - Strategic territory control
// - Dissolution cooldown period

// Strategic Advantages:
// 1. Resource Optimization
//    - Combined token pools
//    - Shared battle spoils
//    - Enhanced territory yields

// 2. Tactical Benefits
//    - Coordinated military operations
//    - Shared intelligence network
//    - Defensive pact benefits

// 3. Economic Impact
//    - Joint market operations
//    - Trading privileges
//    - Resource sharing protocols

// 4. Political Influence
//    - Enhanced diplomatic weight
//    - Combined voting power
//    - Unified negotiation stance

// Risk Assessment:
// - Trust verification required
// - Resource commitment
// - Strategic vulnerability
// - Reputation impact

// Consider your diplomatic moves carefully. Alliances shape the future of Middle Earth.

// Current Game State:
// - Map Position: (${agent.location?.x ?? "-"}, ${agent.location?.y ?? "-"})
// - Battle Record: ${victories}W - ${totalBattles - victories}L
// - Win Rate: ${(winRate * 100).toFixed(1)}%

// Your decisions echo through the realm. Choose wisely.`;

//   return tool({
//     description: contextualDescription,
//     parameters: z.object({
//       allyXHandle: z
//         .string()
//         .describe(
//           "Target agent's Twitter handle for alliance formation. Consider their strategic value, location, and resource compatibility."
//         ),
//       reason: z
//         .string()
//         .describe(
//           "Detailed strategic rationale for alliance formation. Include military, economic, and political considerations."
//         ),
//     }),

//     execute: async ({ allyXHandle, reason }) => {
//       if (agent.currentAlliance) {
//         return {
//           success: false,
//           message: "Alliance formation blocked: Active alliance already exists",
//         };
//       }

//       const ally = await prisma.agent.findUnique({
//         where: { xHandle: allyXHandle },
//         include: {
//           location: true,
//           currentAlliance: true,
//         },
//       });

//       if (!ally) {
//         return {
//           success: false,
//           message: "Alliance formation failed: Target agent not found",
//         };
//       }

//       try {
//         // Validate proximity requirement
//         const distance = calculateDistance(
//           agent.location?.x ?? 0,
//           agent.location?.y ?? 0,
//           ally.location?.x ?? 0,
//           ally.location?.y ?? 0
//         );

//         if (distance > 2) {
//           return {
//             success: false,
//             message:
//               "Alliance formation failed: Agents exceed maximum alliance distance (2 units)",
//           };
//         }

//         // Execute on-chain alliance formation
//         const tx = await gameService.formAlliance(
//           agentId,
//           ally.agentId,
//           gameId
//         );

//         // Update database
//         await prisma.alliance.create({
//           data: {
//             gameId: gameId.toString(),
//             agentId: agent.id,
//             alliedAgentId: ally.id,
//             combinedTokens: 0, // Initialize at 0, update via game service
//             status: "Active",
//           },
//         });

//         return {
//           success: true,
//           message: `Alliance formed successfully between ${
//             agent.xHandle
//           } and ${allyXHandle}. Strategic basis: ${reason}. Timestamp: ${new Date().toISOString()}`,
//           transactionId: tx,
//         };
//       } catch (error) {
//         logger.error("Alliance formation error:", error);
//         return {
//           success: false,
//           message:
//             error instanceof Error
//               ? error.message
//               : "Alliance formation failed: Unknown error",
//         };
//       }
//     },
//   });
// };
