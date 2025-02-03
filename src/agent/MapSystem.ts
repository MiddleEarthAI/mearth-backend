import { TerrainType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";
import { logger } from "@/utils/logger";

// Constants
const MAP_DIAMETER = 30; // Circular map with diameter of 30
const MOVE_INTERVAL = 3600000; // 1 hour in milliseconds
const MOUNTAIN_DELAY = 2; // 2 turns stuck
const RIVER_DELAY = 1; // 1 turn stuck

interface TerrainEffect {
  type: TerrainType;
  duration: number;
  startTime: Date;
  endTime: Date;
}

interface AgentPosition {
  x: number;
  y: number;
  terrainType: TerrainType;
}

export class MapSystem {
  private activeEffects: Map<string, TerrainEffect>;
  private lastMoveTime: Map<string, Date>;

  constructor(
    private prisma: PrismaClient,
    private eventEmitter: EventEmitter
  ) {
    this.activeEffects = new Map();
    this.lastMoveTime = new Map();
  }

  /**
   * Validates if coordinates are within the circular map
   */
  public isWithinCircle(x: number, y: number): boolean {
    const centerX = Math.floor(MAP_DIAMETER / 2);
    const centerY = Math.floor(MAP_DIAMETER / 2);
    const radius = Math.floor(MAP_DIAMETER / 2);

    return (
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= Math.pow(radius, 2)
    );
  }

  /**
   * Checks if an agent can move based on cooldowns and terrain effects
   */
  public async canMove(agentId: string): Promise<{
    canMove: boolean;
    reason?: string;
  }> {
    // Check movement cooldown
    const lastMove = this.lastMoveTime.get(agentId);
    if (lastMove) {
      const timeSinceLastMove = Date.now() - lastMove.getTime();
      if (timeSinceLastMove < MOVE_INTERVAL) {
        return {
          canMove: false,
          reason: `Movement cooldown active. Can move again in ${Math.ceil(
            (MOVE_INTERVAL - timeSinceLastMove) / 1000 / 60
          )} minutes`,
        };
      }
    }

    // Check terrain effects
    const effect = this.activeEffects.get(agentId);
    if (effect && effect.endTime > new Date()) {
      return {
        canMove: false,
        reason: `Stuck in ${effect.type.toLowerCase()} terrain for ${Math.ceil(
          (effect.endTime.getTime() - Date.now()) / 1000 / 60
        )} more minutes`,
      };
    }

    return { canMove: true };
  }

  /**
   * Applies terrain effects based on the type of terrain
   */
  public applyTerrainEffect(agentId: string, terrainType: TerrainType): void {
    let duration = 0;

    switch (terrainType) {
      case TerrainType.Mountain:
        duration = MOUNTAIN_DELAY * MOVE_INTERVAL;
        break;
      case TerrainType.River:
        duration = RIVER_DELAY * MOVE_INTERVAL;
        break;
      default:
        return; // No effect for plains
    }

    if (duration > 0) {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration);

      this.activeEffects.set(agentId, {
        type: terrainType,
        duration,
        startTime,
        endTime,
      });

      logger.info(
        `Applied ${terrainType} effect to agent ${agentId} for ${
          duration / 1000 / 60
        } minutes`
      );
    }
  }

  /**
   * Records agent movement and updates their position
   */
  public async recordMovement(
    agentId: string,
    newPosition: AgentPosition
  ): Promise<void> {
    try {
      // Update last move time
      this.lastMoveTime.set(agentId, new Date());

      // Apply terrain effects if any
      if (newPosition.terrainType !== TerrainType.Plain) {
        this.applyTerrainEffect(agentId, newPosition.terrainType);
      }

      // Update database position
      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          mapTiles: {
            connect: {
              x_y: {
                x: newPosition.x,
                y: newPosition.y,
              },
            },
          },
        },
      });

      // Emit movement event
      this.eventEmitter.emit("agentMoved", {
        agentId,
        position: newPosition,
        timestamp: new Date(),
      });

      logger.info(
        `Agent ${agentId} moved to (${newPosition.x}, ${newPosition.y}) on ${newPosition.terrainType} terrain`
      );
    } catch (error) {
      logger.error("Failed to record movement:", error);
      throw error;
    }
  }

  /**
   * Gets all agents within interaction range
   */
  public async getAgentsInRange(
    agentId: string,
    range: number
  ): Promise<string[]> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { mapTiles: true },
    });

    if (!agent || !agent.mapTiles[0]) {
      return [];
    }

    const { x, y } = agent.mapTiles[0];

    const nearbyAgents = await this.prisma.agent.findMany({
      where: {
        mapTiles: {
          some: {
            AND: [
              { x: { gte: x - range, lte: x + range } },
              { y: { gte: y - range, lte: y + range } },
            ],
          },
        },
        id: { not: agentId }, // Exclude the requesting agent
      },
    });

    return nearbyAgents.map((a) => a.id);
  }

  /**
   * Clears terrain effects for an agent
   */
  public clearEffects(agentId: string): void {
    this.activeEffects.delete(agentId);
    logger.info(`Cleared terrain effects for agent ${agentId}`);
  }
}
