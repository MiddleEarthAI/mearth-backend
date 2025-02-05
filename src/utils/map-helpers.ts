import { MapTile, PrismaClient, TerrainType } from "@prisma/client";

/**
 * Direction enum for specifying which adjacent tile to get
 */
export enum Direction {
  NORTH = "NORTH",
  NORTHEAST = "NORTHEAST",
  EAST = "EAST",
  SOUTHEAST = "SOUTHEAST",
  SOUTH = "SOUTH",
  SOUTHWEST = "SOUTHWEST",
  WEST = "WEST",
  NORTHWEST = "NORTHWEST",
}

/**
 * Gets the coordinates of the adjacent tile in the specified direction
 */
function getAdjacentCoordinates(
  x: number,
  y: number,
  direction: Direction
): { x: number; y: number } {
  switch (direction) {
    case Direction.NORTH:
      return { x, y: y - 1 };
    case Direction.NORTHEAST:
      return { x: x + 1, y: y - 1 };
    case Direction.EAST:
      return { x: x + 1, y };
    case Direction.SOUTHEAST:
      return { x: x + 1, y: y + 1 };
    case Direction.SOUTH:
      return { x, y: y + 1 };
    case Direction.SOUTHWEST:
      return { x: x - 1, y: y + 1 };
    case Direction.WEST:
      return { x: x - 1, y };
    case Direction.NORTHWEST:
      return { x: x - 1, y: y - 1 };
  }
}

/**
 * Gets all adjacent tiles around a given tile
 * @param prisma - PrismaClient instance
 * @param tile - The center MapTile to find adjacents for
 * @returns Promise<MapTile[]> - Array of adjacent MapTiles
 */
export async function getAllAdjacentTiles(
  prisma: PrismaClient,
  tile: MapTile
): Promise<MapTile[]> {
  const adjacentCoords = Object.values(Direction).map((direction) =>
    getAdjacentCoordinates(tile.x, tile.y, direction)
  );

  return prisma.mapTile.findMany({
    where: {
      OR: adjacentCoords.map((coord) => ({
        x: coord.x,
        y: coord.y,
      })),
    },
    include: {
      agent: true, // Include the agent if you need to check tile occupancy
    },
  });
}

/**
 * Gets a specific adjacent tile in the given direction
 * @param prisma - PrismaClient instance
 * @param tile - The center MapTile
 * @param direction - The direction to check
 * @returns Promise<MapTile | null> - The adjacent MapTile or null if not found
 */
export async function getAdjacentTile(
  prisma: PrismaClient,
  tile: MapTile,
  direction: Direction
): Promise<MapTile | null> {
  const { x, y } = getAdjacentCoordinates(tile.x, tile.y, direction);

  return prisma.mapTile.findUnique({
    where: {
      x_y: {
        x,
        y,
      },
    },
    include: {
      agent: true,
    },
  });
}

/**
 * Checks if a tile is occupied by an agent
 * @param tile - The MapTile to check
 * @returns boolean - True if occupied, false otherwise
 */
export function isTileOccupied(tile: MapTile & { agent: any }): boolean {
  return tile.agent !== null;
}

/**
 * Gets all unoccupied adjacent tiles
 * @param prisma - PrismaClient instance
 * @param tile - The center MapTile
 * @returns Promise<MapTile[]> - Array of unoccupied adjacent MapTiles
 */
// export async function getUnoccupiedAdjacentTiles(
//   prisma: PrismaClient,
//   tile: MapTile
// ): Promise<MapTile[]> {
//   const adjacentTiles = await getAllAdjacentTiles(prisma, tile);
//   return adjacentTiles.filter((t) => !isTileOccupied(t));
// }

/**
 * Gets all adjacent tiles with a specific terrain type
 * @param prisma - PrismaClient instance
 * @param tile - The center MapTile
 * @param terrainType - The TerrainType to filter by
 * @returns Promise<MapTile[]> - Array of adjacent MapTiles with specified terrain
 */
export async function getAdjacentTilesWithTerrain(
  prisma: PrismaClient,
  tile: MapTile,
  terrainType: TerrainType
): Promise<MapTile[]> {
  const adjacentTiles = await getAllAdjacentTiles(prisma, tile);
  return adjacentTiles.filter((t) => t.terrainType === terrainType);
}

/**
 * Checks if two tiles are adjacent
 * @param tile1 - First MapTile
 * @param tile2 - Second MapTile
 * @returns boolean - True if tiles are adjacent, false otherwise
 */
export function areAdjacent(tile1: MapTile, tile2: MapTile): boolean {
  const xDiff = Math.abs(tile1.x - tile2.x);
  const yDiff = Math.abs(tile1.y - tile2.y);

  // Tiles are adjacent if they differ by at most 1 in both x and y coordinates
  return xDiff <= 1 && yDiff <= 1 && !(xDiff === 0 && yDiff === 0);
}
