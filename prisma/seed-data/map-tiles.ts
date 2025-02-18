import { PrismaClient, TerrainType } from "@prisma/client";
import { mountains, rivers, plains } from "../../src/constants";

const prisma = new PrismaClient();

// Function to calculate distance from center
function calculateDistanceFromCenter(
  x: number,
  y: number,
  centerX: number,
  centerY: number
): number {
  return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
}

// Function to determine terrain type based on position and patterns
function determineTerrainType(
  x: number,
  y: number,
  mapDiameter: number
): TerrainType {
  const centerX = Math.floor(mapDiameter / 2);
  const centerY = Math.floor(mapDiameter / 2);
  const distanceFromCenter = calculateDistanceFromCenter(
    x,
    y,
    centerX,
    centerY
  );

  // Create mountain ranges in a circular pattern
  if (distanceFromCenter % 8 === 0 || (x + y) % 7 === 0) {
    return TerrainType.mountain;
  }

  // Create rivers in a meandering pattern
  if (Math.sin(x * 0.5) + Math.cos(y * 0.5) > 1.2) {
    return TerrainType.river;
  }

  // Default to plains
  return TerrainType.plain;
}

export async function seedMapTiles() {
  console.log("🌱 Seeding map tiles...");

  try {
    // Delete existing map tiles
    await prisma.mapTile.deleteMany({});

    const tiles: { x: number; y: number; terrainType: TerrainType }[] = [];

    // Add river tiles
    rivers.coordinates.forEach((coord) => {
      const [x, y] = coord.split(",").map(Number);
      tiles.push({
        x,
        y,
        terrainType: TerrainType.river,
      });
    });

    // Add mountain tiles
    mountains.coordinates.forEach((coord) => {
      const [x, y] = coord.split(",").map(Number);
      tiles.push({
        x,
        y,
        terrainType: TerrainType.mountain,
      });
    });

    // Add plain tiles
    plains.coordinates.forEach((coord) => {
      const [x, y] = coord.split(",").map(Number);
      tiles.push({
        x,
        y,
        terrainType: TerrainType.plain,
      });
    });

    // Batch insert all tiles
    const createdTiles = await prisma.mapTile.createMany({
      data: tiles,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${createdTiles.count} map tiles`);
    return createdTiles;
  } catch (error) {
    console.error("❌ Error seeding map tiles:", error);
    throw error;
  }
}

// Execute the seed function if this file is run directly
if (require.main === module) {
  seedMapTiles()
    .catch((error) => {
      console.error("Failed to seed map tiles:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
