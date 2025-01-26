import { PrismaClient, TerrainType, CharacterType } from "@prisma/client";
import { mountains, plains, river } from "../src/constants";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Use Prisma's generated types
type AgentSeedData = {
  name: string;
  twitterHandle: string;
  characterType: CharacterType;
  bio: string[];
  lore: string[];
  knowledge: string[];
  status: "ACTIVE" | "DEFEATED";
  initialLocation: {
    x: number;
    y: number;
    terrain: TerrainType;
  };
  wallet: {
    governanceTokens: number;
  };
  traits: {
    traitName: string;
    traitValue: number;
  }[];
};

async function readAgentSeedData(): Promise<Record<string, AgentSeedData>> {
  const seedDir = path.join(__dirname, "seed-data");
  const files = fs
    .readdirSync(seedDir)
    .filter((file) => file.endsWith(".json"));

  const agentData: Record<string, AgentSeedData> = {};
  for (const file of files) {
    const content = fs.readFileSync(path.join(seedDir, file), "utf-8");
    const agentName = file.replace(".json", "");
    agentData[agentName] = JSON.parse(content);
  }

  return agentData;
}

async function createLocationBatch(
  coordinates: Set<string>,
  terrainType: TerrainType
) {
  const locationData = Array.from(coordinates).map((coord) => {
    const [x, y] = coord.split(",").map(Number);
    return { x, y, terrain: terrainType };
  });

  await prisma.location.createMany({
    data: locationData,
    skipDuplicates: true,
  });
}

async function createInitialAgents(agents: Record<string, AgentSeedData>) {
  for (const [_, agentData] of Object.entries(agents)) {
    try {
      // Create or find location
      const location = await prisma.location.findFirst({
        where: {
          x: agentData.initialLocation.x,
          y: agentData.initialLocation.y,
        },
      });

      if (!location) {
        throw new Error(
          `No valid location found for ${agentData.name} at position (${agentData.initialLocation.x}, ${agentData.initialLocation.y})`
        );
      }

      // Create wallet
      const wallet = await prisma.wallet.create({
        data: {
          governanceTokens: agentData.wallet.governanceTokens,
        },
      });

      // Create agent
      const agent = await prisma.agent.create({
        data: {
          name: agentData.name,
          twitterHandle: agentData.twitterHandle,
          characterType: agentData.characterType,
          bio: agentData.bio,
          lore: agentData.lore,
          knowledge: agentData.knowledge,
          status: agentData.status,
          walletId: wallet.id,
          locationId: location.id,
        },
      });

      // Create traits
      await prisma.agentTrait.createMany({
        data: agentData.traits.map((trait) => ({
          agentId: agent.id,
          traitName: trait.traitName,
          traitValue: trait.traitValue,
        })),
      });

      console.log(`✅ Created agent: ${agentData.name}`);
    } catch (error) {
      console.error(`❌ Failed to create agent ${agentData.name}:`, error);
      throw error;
    }
  }
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Create locations first
    console.log("Creating locations...");
    await Promise.all([
      createLocationBatch(mountains.coordinates, TerrainType.MOUNTAINS),
      createLocationBatch(plains.coordinates, TerrainType.PLAINS),
      createLocationBatch(river.coordinates, TerrainType.RIVER),
    ]);
    console.log("✅ Created all locations");

    // Create agents and related data
    console.log("Creating agents and related data...");
    const agents = await readAgentSeedData();
    await createInitialAgents(agents);

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
