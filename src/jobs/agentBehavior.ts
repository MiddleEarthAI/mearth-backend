import { PrismaClient } from "@prisma/client";
import { GameService } from "../services/game.service";
import { TwitterService } from "../services/twitter.service";
import { TerrainType, AgentType } from "../types/game";

const prisma = new PrismaClient();
const gameService = new GameService();
const twitterService = new TwitterService();

export class AgentBehaviorJob {
  private static readonly TICK_INTERVAL = 3600000; // 1 hour in milliseconds

  /**
   * Start the agent behavior processing
   */
  async start(): Promise<void> {
    setInterval(() => this.processTick(), AgentBehaviorJob.TICK_INTERVAL);
  }

  /**
   * Process one tick of agent behavior
   */
  private async processTick(): Promise<void> {
    const agents = await prisma.agent.findMany({
      where: { isAlive: true },
    });

    for (const agent of agents) {
      try {
        await this.processAgentBehavior(agent);
      } catch (error) {
        console.error(`Error processing agent ${agent.id}:`, error);
      }
    }
  }

  /**
   * Process individual agent behavior based on characteristics
   */
  private async processAgentBehavior(agent: any): Promise<void> {
    // Process community influence
    await gameService.processAgentInfluence(agent.id);

    // Determine action based on agent type and characteristics
    switch (agent.type) {
      case AgentType.SCOOTLES:
        await this.processScootlesBehavior(agent);
        break;
      case AgentType.PURRLOCK_PAWS:
        await this.processPurrlockBehavior(agent);
        break;
      case AgentType.SIR_GULLIHOP:
        await this.processGullihopBehavior(agent);
        break;
      case AgentType.WANDERLEAF:
        await this.processWanderleafBehavior(agent);
        break;
    }
  }

  /**
   * Process Scootles behavior - aggressive, seeks battles
   */
  private async processScootlesBehavior(agent: any): Promise<void> {
    const nearbyAgents = await this.findNearbyAgents(agent);

    if (nearbyAgents.length > 0) {
      // Prioritize battle over alliance
      const target = nearbyAgents[0];
      await gameService.processBattle(agent.id, target.id);
    } else {
      // Move towards nearest agent
      const nearestAgent = await this.findNearestAgent(agent);
      if (nearestAgent) {
        await this.moveTowards(agent, nearestAgent);
      }
    }
  }

  /**
   * Process Purrlock behavior - avoids others, fights when cornered
   */
  private async processPurrlockBehavior(agent: any): Promise<void> {
    const nearbyAgents = await this.findNearbyAgents(agent);

    if (nearbyAgents.length > 0) {
      // Fight when cornered
      await gameService.processBattle(agent.id, nearbyAgents[0].id);
    } else {
      // Move away from others
      await this.moveToSafeLocation(agent);
    }
  }

  /**
   * Process Sir Gullihop behavior - seeks alliances
   */
  private async processGullihopBehavior(agent: any): Promise<void> {
    const nearbyAgents = await this.findNearbyAgents(agent);

    if (nearbyAgents.length > 0 && !agent.allianceWith) {
      // Try to form alliance
      await gameService.formAlliance(agent.id, nearbyAgents[0].id);
    } else {
      // Wander randomly
      await this.moveRandomly(agent);
    }
  }

  /**
   * Process Wanderleaf behavior - influenced by community
   */
  private async processWanderleafBehavior(agent: any): Promise<void> {
    // Movement heavily influenced by community interactions
    const moveDirection = await this.getCommunityPreferredDirection(agent);
    await this.moveInDirection(agent, moveDirection);
  }

  /**
   * Helper methods for agent behavior
   */
  private async findNearbyAgents(agent: any) {
    return prisma.agent.findMany({
      where: {
        AND: [
          { id: { not: agent.id } },
          { isAlive: true },
          {
            OR: [
              {
                AND: [
                  { positionX: { gte: agent.positionX - 2 } },
                  { positionX: { lte: agent.positionX + 2 } },
                ],
              },
              {
                AND: [
                  { positionY: { gte: agent.positionY - 2 } },
                  { positionY: { lte: agent.positionY + 2 } },
                ],
              },
            ],
          },
        ],
      },
    });
  }

  private async findNearestAgent(agent: any) {
    const otherAgents = await prisma.agent.findMany({
      where: {
        AND: [{ id: { not: agent.id } }, { isAlive: true }],
      },
    });

    let nearest = null;
    let minDistance = Infinity;

    for (const other of otherAgents) {
      const distance = Math.sqrt(
        Math.pow(other.positionX - agent.positionX, 2) +
          Math.pow(other.positionY - agent.positionY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = other;
      }
    }

    return nearest;
  }

  private async moveToSafeLocation(agent: any): Promise<void> {
    const otherAgents = await prisma.agent.findMany({
      where: {
        AND: [{ id: { not: agent.id } }, { isAlive: true }],
      },
    });

    // Calculate average position of other agents
    const avgX =
      otherAgents.reduce(
        (sum: number, a: { positionX: number }) => sum + a.positionX,
        0
      ) / otherAgents.length;
    const avgY =
      otherAgents.reduce(
        (sum: number, a: { positionY: number }) => sum + a.positionY,
        0
      ) / otherAgents.length;

    // Move in opposite direction
    const dx = agent.positionX - avgX;
    const dy = agent.positionY - avgY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const newX = agent.positionX + dx / distance;
    const newY = agent.positionY + dy / distance;

    await gameService.moveAgent(
      agent.id,
      { x: newX, y: newY },
      this.determineTerrainType(newX, newY)
    );
  }

  private async moveInDirection(
    agent: any,
    direction: { x: number; y: number }
  ): Promise<void> {
    const magnitude = Math.sqrt(
      direction.x * direction.x + direction.y * direction.y
    );
    const newX = agent.positionX + direction.x / magnitude;
    const newY = agent.positionY + direction.y / magnitude;

    await gameService.moveAgent(
      agent.id,
      { x: newX, y: newY },
      this.determineTerrainType(newX, newY)
    );
  }

  private determineTerrainType(x: number, y: number): TerrainType {
    // Simplified terrain determination
    // In a real implementation, this would use a terrain map
    if (Math.abs(x) > 50 || Math.abs(y) > 50) {
      return TerrainType.MOUNTAIN;
    }
    if (Math.abs(x + y) < 10) {
      return TerrainType.RIVER;
    }
    return TerrainType.NORMAL;
  }

  private async moveRandomly(agent: any): Promise<void> {
    const angle = Math.random() * 2 * Math.PI;
    const newX = agent.positionX + Math.cos(angle);
    const newY = agent.positionY + Math.sin(angle);

    await gameService.moveAgent(
      agent.id,
      { x: newX, y: newY },
      this.determineTerrainType(newX, newY)
    );
  }

  private async getCommunityPreferredDirection(
    agent: any
  ): Promise<{ x: number; y: number }> {
    // This would analyze recent Twitter interactions to determine movement
    // For now, return random direction
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
    };
  }

  private async moveTowards(agent: any, target: any): Promise<void> {
    const dx = target.positionX - agent.positionX;
    const dy = target.positionY - agent.positionY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const newX = agent.positionX + dx / distance;
    const newY = agent.positionY + dy / distance;

    await gameService.moveAgent(
      agent.id,
      { x: newX, y: newY },
      this.determineTerrainType(newX, newY)
    );
  }
}
