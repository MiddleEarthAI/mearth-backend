// import { prisma } from "@/config/prisma";
// import { getGameService } from "@/services";
// import { logger } from "@/utils/logger";
// import { tool } from "ai";
// import { z } from "zod";

// export interface IgnoreValidationResult {
//   success: boolean;
//   message: string;
//   transactionId?: string;
// }

// /**
//  * Creates an ignore tool for an agent to ignore other agents
//  * Uses GameService for blockchain interactions and social mechanics
//  */
// export const ignoreTool = async (gameId: number, agentId: number) => {
//   const gameService = getGameService();
//   // Get agent's current state and social context
//   const agent = await prisma.agent.findUnique({
//     where: { id: agentId.toString() },
//     include: {
//       state: true,
//     },
//   });

//   if (!agent) throw new Error("Agent not found");

//   // Format recent interactions
//   const recentInteractions = agent.relationships
//     .map((r) => `- ${r.targetId}: ${r.type} (Trust: ${r.trust}/100)`)
//     .join("\n");

//   const contextualDescription = `🚫 Ignore System for ${agent.name}, ${
//     agent.race
//   } ${agent.class}

// Current Social Status:
// 🤝 Recent Interactions:
// ${recentInteractions || "No recent interactions"}

// Current Position: (${agent.x}, ${agent.y})
// Status: ${agent.status}
// Experience: ${agent.experience}

// Ignore Mechanics:
// • Temporarily blocks interactions
// • Prevents battle invitations
// • Limits alliance proposals
// • Affects reputation slightly
// • Has cooldown period
// • Maximum ignore limit

// Strategic Uses:
// • Avoid hostile agents
// • Prevent harassment
// • Focus on objectives
// • Manage resources
// • Territory control
// • Tactical retreat

// Considerations:
// • Reputation impact
// • Community perception
// • Alliance implications
// • Battle availability
// • Market access
// • Future relations

// Choose your boundaries wisely, ${agent.name}. Isolation has its price.`;

//   return tool({
//     description: contextualDescription,
//     parameters: z.object({
//       targetAgentId: z.number().describe("ID of the agent to ignore"),
//       duration: z
//         .number()
//         .min(1)
//         .max(72)
//         .describe("Duration in hours to ignore (1-72)")
//         .optional(),
//       conditions: z
//         .object({
//           minTrust: z
//             .number()
//             .min(-100)
//             .max(100)
//             .describe("Only ignore if trust is below this level")
//             .optional(),
//           maxRepImpact: z
//             .number()
//             .min(0)
//             .max(1)
//             .describe("Maximum acceptable reputation impact (0-1)")
//             .optional(),
//           allowAllies: z
//             .boolean()
//             .describe("Whether to allow ignoring allies")
//             .optional(),
//         })
//         .optional(),
//     }),
//     execute: async ({ targetAgentId, duration = 24, conditions }) => {
//       try {
//         // Check if target is an ally if conditions specify
//         if (conditions?.allowAllies === false) {
//           const relationship = await prisma.agentRelationship.findFirst({
//             where: {
//               OR: [
//                 {
//                   initiatorId: agentId.toString(),
//                   targetId: targetAgentId.toString(),
//                 },
//                 {
//                   initiatorId: targetAgentId.toString(),
//                   targetId: agentId.toString(),
//                 },
//               ],
//               type: "ALLIANCE",
//             },
//           });

//           if (relationship) {
//             return {
//               success: false,
//               message: "Cannot ignore allied agents",
//             };
//           }
//         }

//         // Check trust level if specified
//         if (typeof conditions?.minTrust === "number") {
//           const relationship = await prisma.agentRelationship.findFirst({
//             where: {
//               OR: [
//                 {
//                   initiatorId: agentId.toString(),
//                   targetId: targetAgentId.toString(),
//                 },
//                 {
//                   initiatorId: targetAgentId.toString(),
//                   targetId: agentId.toString(),
//                 },
//               ],
//             },
//           });

//           if (relationship && relationship.trust >= conditions.minTrust) {
//             return {
//               success: false,
//               message: "Trust level too high to ignore",
//             };
//           }
//         }

//         // Execute ignore action
//         const tx = await gameService.ignoreAgent(agentId, targetAgentId);

//         return {
//           success: true,
//           message: `Successfully ignored agent ${targetAgentId} for ${duration} hours`,
//           transactionId: tx,
//         };
//       } catch (error) {
//         logger.error("Ignore action error:", error);
//         return {
//           success: false,
//           message:
//             error instanceof Error ? error.message : "Ignore action failed",
//         };
//       }
//     },
//   });
// };
