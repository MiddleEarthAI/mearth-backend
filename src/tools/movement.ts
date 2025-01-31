import { prisma } from "@/config/prisma";
import {
  mountains,
  MOVE_COOLDOWN_MS,
  MOVE_UNITS_PER_HOUR,
  plains,
  rivers,
} from "@/constants";
import { getGameService, getGameStateService } from "@/services";
import { logger } from "@/utils/logger";
import { TerrainType } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";
import { calculateDistance } from "./utils";
import { getAgentsBasicInfoById } from "@/config/game-data";

export interface MoveValidationResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Creates a movement tool for an agent to navigate the Middle Earth map
 * Uses GameService for blockchain interactions and movement mechanics
 * Handles terrain effects, cooldowns, and updates both chain and DB state
 */
export const movementTool = async (gameId: number, agentId: number) => {
  const gameStateService = getGameStateService();
  const gameService = getGameService();

  const allAliveAgents = await gameStateService.getAllAliveAgents(gameId);
  const agent = allAliveAgents.find((a) => a.id === agentId);

  if (!agent) throw new Error("Agent not found onchain");

  const canMove = agent.lastMove.toNumber() + MOVE_COOLDOWN_MS < Date.now();

  // Get agent's current state with all relevant relations
  const dbAgent = await prisma.agent.findUnique({
    where: { agentId: agentId },
    include: {
      state: true,
      location: true,
      currentAlliance: true,
      cooldowns: {
        where: {
          type: "movement",
          endsAt: { gt: new Date() },
        },
      },
    },
  });

  if (!dbAgent) throw new Error("Agent not found in database");

  const nearbyInfo = allAliveAgents
    .map((nearby) => {
      const distance = calculateDistance(
        agent.x ?? 0,
        agent.y ?? 0,
        nearby.x ?? 0,
        nearby.y ?? 0
      );
      const isAlly = nearby.allianceWith === agent.allianceWith;
      const strength = nearby.tokenBalance ?? 0;
      const agentBasicInfo = getAgentsBasicInfoById[nearby.id];

      return `[AGENT] ${agentBasicInfo?.name} (@${agentBasicInfo?.xHandle})
        Location: (${nearby.x}, ${nearby.y})
        Distance: ${distance.toFixed(1)} units
        Status: ${nearby.isAlive ? "Active" : "Inactive"}
        Relation: ${isAlly ? "Allied" : "Neutral/Hostile"}
        Power: ${strength.toFixed(2)} MEARTH`;
    })
    .join("\n");

  const contextualDescription = `MOVEMENT SYSTEM | ${dbAgent.name} (@${
    dbAgent.xHandle
  })

AGENT STATUS
-----------
Position: (${agent.x ?? "?"}, ${agent.y ?? "?"})
Current Terrain: ${dbAgent.location?.terrainType ?? "Unknown"}
Health Status: ${dbAgent.state?.health ?? "?"}/100
Movement Status: ${
    dbAgent.location?.stuckTurnsRemaining ? "Restricted" : "Free"
  }
Alliance Status: ${dbAgent.currentAlliance ? "Active" : "Independent"}

TERRAIN ANALYSIS
---------------
[PLAINS]
* Standard movement rate
* No movement penalties
* Optimal for tactical positioning
* Recommended for resource gathering
* Valid coordinates: ${Array.from(plains.coordinates).join(", ")}

[MOUNTAINS]
* 50% movement reduction
* 5% health attrition per move
* Enhanced battle positioning
* High resource concentration
* Recommended for defensive positions
* Valid coordinates: ${Array.from(mountains.coordinates).join(", ")}

[RIVERS]
* 70% movement reduction
* 3% health attrition per move
* Strategic chokepoints
* Alliance-controlled crossings
* Recommended for strategic control
* Valid coordinates: ${Array.from(rivers.coordinates).join(", ")}

TACTICAL ENVIRONMENT
------------------
${nearbyInfo || "No detected entities in range"}

STRATEGIC CONSIDERATIONS
----------------------
1. Movement Dynamics
   - Terrain-based movement costs
   - Health preservation
   - Resource accessibility
   - Strategic positioning

2. Tactical Analysis
   - Alliance-controlled zones
   - Hostile presence
   - Resource-rich sectors
   - Defensive positions

3. Risk Assessment
   - Health management protocols
   - Threat evaluation matrix
   - Evacuation routes
   - Alliance support vectors

COMMAND GUIDANCE: Calculate optimal path based on strategic objectives and terrain constraints.`;

  return tool({
    description: contextualDescription,
    parameters: z.object({
      x: z
        .number()
        .positive()
        .describe("Target X coordinate within map boundaries"),
      y: z
        .number()
        .positive()
        .describe("Target Y coordinate within map boundaries"),
      terrain: z
        .nativeEnum(TerrainType)
        .describe("Destination terrain classification"),
    }),
    execute: async ({ x, y, terrain }) => {
      try {
        // 1. Validate basic movement conditions
        if (!canMove || dbAgent.cooldowns.length > 0) {
          return {
            success: false,
            message: "Movement cooldown active - standby required",
          };
        }

        if (!agent.isAlive) {
          return {
            success: false,
            message: "Unit inactive - movement prohibited",
          };
        }

        // 2. Validate movement distance
        const distance = calculateDistance(agent.x, agent.y, x, y);

        if (distance > MOVE_UNITS_PER_HOUR) {
          return {
            success: false,
            message: `Movement exceeds operational range of ${MOVE_UNITS_PER_HOUR} units`,
          };
        }

        // 3. Execute on-chain movement
        const terrainType = {
          [TerrainType.Plain]: { plain: {} },
          [TerrainType.Mountain]: { mountain: {} },
          [TerrainType.River]: { river: {} },
        }[terrain];

        const tx = await gameService.moveAgent(
          gameId,
          agentId,
          x,
          y,
          terrainType
        );

        // 4. Update database state
        const healthLoss = {
          [TerrainType.Plain]: 0,
          [TerrainType.Mountain]: 5,
          [TerrainType.River]: 3,
        }[terrain];

        await prisma.$transaction([
          prisma.location.update({
            where: { agentId: dbAgent.id },
            data: {
              x,
              y,
              terrainType: terrain,
              stuckTurnsRemaining: terrain === TerrainType.Plain ? 0 : 1,
            },
          }),
          prisma.agentState.update({
            where: { agentId: dbAgent.id },
            data: {
              health: Math.max(0, (dbAgent.state?.health ?? 100) - healthLoss),
              lastActionType: "move",
              lastActionTime: new Date(),
              lastActionDetails: `Relocated to (${x},${y}) - Terrain: ${terrain}`,
            },
          }),
          prisma.cooldown.create({
            data: {
              agentId: dbAgent.id,
              type: "movement",
              endsAt: new Date(Date.now() + MOVE_COOLDOWN_MS),
              targetAgentId: dbAgent.id,
            },
          }),
        ]);

        return {
          success: true,
          message: `Movement executed - New position: (${x},${y}) | Terrain: ${terrain} | Health impact: -${healthLoss}%`,
          transactionId: tx,
        };
      } catch (error) {
        logger.error("Movement operation failed:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Movement operation failed",
        };
      }
    },
  });
};
