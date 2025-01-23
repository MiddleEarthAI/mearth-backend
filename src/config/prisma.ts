import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client instance
 * Used for database operations throughout the application
 * Follows singleton pattern to prevent multiple client instances
 */
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };
