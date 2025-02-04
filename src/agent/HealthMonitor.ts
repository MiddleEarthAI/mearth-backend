import { PrismaClient } from "@prisma/client";
import { GameOrchestrator } from "./GameOrchestrator";
import { logger } from "@/utils/logger";
import CacheManager from "./CacheManager";

/**
 * HealthMonitor class responsible for monitoring system health
 * Performs periodic checks on critical system components
 * 🏥 Monitors: Database, Cache, Twitter API
 */
class HealthMonitor {
  private readonly checkInterval = 900000; // 15 minutes

  constructor(
    private orchestrator: GameOrchestrator,
    private prisma: PrismaClient,
    private cache: CacheManager
  ) {
    logger.info("🚀 Health Monitor initialized");
  }

  async startMonitoring(): Promise<void> {
    logger.info("🔄 Starting health monitoring service");
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkInterval);
  }

  private async performHealthCheck(): Promise<void> {
    logger.info("🔍 Starting health check cycle");
    try {
      await Promise.all([
        this.checkDatabase(),
        this.checkCache(),
        this.checkTwitterAPI(),
      ]);

      logger.info("✅ Health check completed successfully");
    } catch (error) {
      logger.error("❌ Health check failed", { error });
      await this.handleHealthCheckFailure(error as Error);
    }
  }

  private async checkDatabase(): Promise<void> {
    logger.info("💾 Checking database connection");
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      logger.info("✅ Database check passed");
    } catch (error) {
      logger.error("❌ Database check failed", { error });
      throw new Error("Database health check failed");
    }
  }

  private async checkCache(): Promise<void> {
    logger.info("📦 Checking cache service");
    try {
      await this.cache.getCachedInteraction("health-check");
      logger.info("✅ Cache check passed");
    } catch (error) {
      logger.error("❌ Cache check failed", { error });
      throw new Error("Cache health check failed");
    }
  }

  private async checkTwitterAPI(): Promise<void> {
    logger.info("🐦 Checking Twitter API connection");
    // TODO: Implement Twitter API health check
    logger.info("⚠️ Twitter API check not implemented");
  }

  private async handleHealthCheckFailure(error: Error): Promise<void> {
    logger.error("🚨 Handling health check failure", { error });
    // TODO: Implement failure handling (notifications, recovery attempts, etc.)
    logger.info("⚠️ Health check failure handling not implemented");
  }
}

export { HealthMonitor };
