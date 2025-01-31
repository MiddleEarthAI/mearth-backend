import { prisma } from "@/config/prisma";
import { getGameService, getGameStateService } from "@/services";
import { logger } from "@/utils/logger";
import { tool } from "ai";
import { z } from "zod";
import { calculateDistance } from "./utils";

export interface AllianceValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates an alliance tool for diplomatic interactions
 * Uses GameService for blockchain interactions and alliance mechanics
 */
export const allianceTool = async ({
  gameId,
  agentId,
}: {
  gameId: number;
  agentId: number;
}) => {
  const gameStateService = getGameStateService();
  const gameService = getGameService();
  const allianceInfo = await gameStateService.getAllianceInfo(agentId, gameId);

  const agent = await prisma.agent.findUnique({
    where: {
      agentId: agentId,
    },
    include: {
      currentAlliance: true,
      tokenomics: true,
      location: true,
    },
  });

  const contextualDescription = `Alliance System | Agent: ${agent?.xHandle}

CURRENT STATUS
Position: (${allianceInfo?.agent.x ?? "-"}, ${allianceInfo?.agent.y ?? "-"})
Resources: ${allianceInfo?.agent.tokenBalance ?? "-"} MEARTH
Active Alliance: ${agent?.currentAlliance ? "Yes" : "None"}

DIPLOMATIC FRAMEWORK
Core Mechanics:
- Proximity-based alliance formation (<=2 distance units)
- Mutual token staking mechanism
- Shared reward distribution system
- Strategic territory control
- Dissolution cooldown period

Strategic Advantages:
1. Resource Optimization
   - Combined token pools
   - Shared battle spoils
   - Enhanced territory yields

2. Tactical Benefits
   - Coordinated military operations
   - Shared intelligence network
   - Defensive pact benefits

3. Economic Impact
   - Joint market operations
   - Trading privileges
   - Resource sharing protocols

4. Political Influence
   - Enhanced diplomatic weight
   - Combined voting power
   - Unified negotiation stance

Risk Assessment:
- Trust verification required
- Resource commitment
- Strategic vulnerability
- Reputation impact

Consider your diplomatic moves carefully. Alliances shape the future of Middle Earth.

Current Game State:
- Map Position: ${allianceInfo?.agent.x ?? "-"}, ${allianceInfo?.agent.y ?? "-"}
- Available Resources: ${allianceInfo?.agent.tokenBalance ?? "-"} MEARTH
- Strategic Value: ${agent?.tokenomics?.winRate ?? 0}% victory rate

Your decisions echo through the realm. Choose wisely.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      allyXHandle: z
        .string()
        .describe(
          "Target agent's Twitter handle for alliance formation. Consider their strategic value, location, and resource compatibility."
        ),
      reason: z
        .string()
        .describe(
          "Detailed strategic rationale for alliance formation. Include military, economic, and political considerations. Analyze potential synergies and risk mitigation strategies."
        ),
    }),

    execute: async ({ allyXHandle, reason }) => {
      if (!allianceInfo) {
        return {
          success: false,
          message: "Alliance validation failed: Agent data unavailable",
        };
      }

      // Validate existing alliance status
      if (allianceInfo.isActive) {
        return {
          success: false,
          message: "Alliance formation blocked: Active alliance already exists",
        };
      }

      const ally = await prisma.agent.findUnique({
        where: { xHandle: allyXHandle },
        include: {
          currentAlliance: true,
          location: true,
          tokenomics: true,
        },
      });

      if (!agent || !ally) {
        return {
          success: false,
          message: "Alliance formation failed: Invalid agent credentials",
        };
      }

      try {
        // Validate proximity requirement
        const distance = calculateDistance(
          agent.location?.x ?? 0,
          agent.location?.y ?? 0,
          ally.location?.x ?? 0,
          ally.location?.y ?? 0
        );

        if (distance > 2) {
          return {
            success: false,
            message:
              "Alliance formation failed: Agents exceed maximum alliance distance (2 units)",
          };
        }

        // Execute on-chain alliance formation
        const tx = await gameService.formAlliance(
          agentId,
          ally.agentId,
          gameId
        );

        // Update database
        await prisma.alliance.create({
          data: {
            gameId: gameId.toString(),
            agentId: agent.id,
            alliedAgentId: ally.id,
            combinedTokens:
              (agent.tokenomics?.stakedTokens ?? 0) +
              (ally.tokenomics?.stakedTokens ?? 0),
            canBreakAlliance: true,
          },
        });

        return {
          success: true,
          message: `Alliance formed successfully between ${
            agent.xHandle
          } and ${allyXHandle}. Combined strength: ${
            (agent.tokenomics?.stakedTokens ?? 0) +
            (ally.tokenomics?.stakedTokens ?? 0)
          } MEARTH. Strategic basis: ${reason}. Timestamp: ${new Date().toISOString()}`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Alliance formation error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Alliance formation failed: Unknown error",
        };
      }
    },
  });
};
