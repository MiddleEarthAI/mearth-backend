import { PrismaClient } from "@prisma/client";
import { mountains, plains, river } from "../src/constants";
import { TerrainType } from "@prisma/client";

const prisma = new PrismaClient();

async function createLocationBatch(
  coordinates: Set<string>,
  terrainType: TerrainType
) {
  const locationData = Array.from(coordinates).map((coord) => {
    const [x, y] = coord.split(",").map(Number);
    return { x, y, terrain: terrainType };
  });

  // Use createMany for better performance
  await prisma.location.createMany({
    data: locationData,
    skipDuplicates: true, // Skip if location already exists
  });
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Create locations in parallel for better performance
    await Promise.all([
      createLocationBatch(mountains.coordinates, TerrainType.MOUNTAINS),
      createLocationBatch(plains.coordinates, TerrainType.PLAINS),
      createLocationBatch(river.coordinates, TerrainType.RIVER),
    ]);

    console.log("✅ Seed completed successfully");
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
