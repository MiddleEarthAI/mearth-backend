import { seedAgentProfiles } from "./seed-data/agent-profiles";
import { seedMapTiles } from "./seed-data/map-tiles";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed map tiles
    await seedMapTiles();

    // Seed agent profiles
    await seedAgentProfiles();

    console.log("✅ Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("Failed to seed database:", error);
  // process.exit(1);
});
