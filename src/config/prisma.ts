import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client instance
 * Used for database operations throughout the application
 * Follows singleton pattern to prevent multiple client instances
 */
declare global {
  var prismaClient: PrismaClient | undefined; // Renamed to avoid redeclaration
}

const prisma =
  global.prismaClient ||
  new PrismaClient({
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaClient = prisma;
}

export { prisma };
