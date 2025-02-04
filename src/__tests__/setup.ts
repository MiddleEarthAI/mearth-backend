import { jest } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { Connection, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { MearthProgram } from "@/types";

import { logger } from "@/utils/logger";
import * as dotenv from "dotenv";
import { getProgramWithWallet } from "@/utils/program";

dotenv.config();

// Use actual Prisma client
export const prisma = new PrismaClient();

// Get actual program instance
export let program: MearthProgram;

// Setup before all tests
beforeAll(async () => {
  program = await getProgramWithWallet();

  // Clean up database before tests
  await prisma.$transaction([
    prisma.coolDown.deleteMany(),
    prisma.battle.deleteMany(),
    prisma.alliance.deleteMany(),
    prisma.mapTile.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.game.deleteMany(),
  ]);
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Clean state between tests
afterEach(async () => {
  await prisma.$transaction([
    prisma.coolDown.deleteMany(),
    prisma.battle.deleteMany(),
    prisma.alliance.deleteMany(),
  ]);
});

// Global test timeout
jest.setTimeout(30000);
