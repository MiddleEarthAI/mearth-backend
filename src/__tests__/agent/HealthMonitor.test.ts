import { HealthMonitor } from "@/agent/HealthMonitor";
import { GameOrchestrator } from "@/agent/GameOrchestrator";
import { PrismaClient } from "@prisma/client";
import CacheManager from "@/agent/CacheManager";
import { jest } from "@jest/globals";

jest.useFakeTimers();

describe("HealthMonitor", () => {
  let healthMonitor: HealthMonitor;
  let mockOrchestrator: jest.Mocked<GameOrchestrator>;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    // Create mocks
    mockOrchestrator = {
      // Add any required orchestrator methods
    } as jest.Mocked<GameOrchestrator>;

    mockPrisma = {
      $queryRaw: jest.fn(),
    } as unknown as jest.Mocked<PrismaClient>;

    mockCache = {
      getCachedInteraction: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    healthMonitor = new HealthMonitor(mockOrchestrator, mockPrisma, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Health Check Cycle", () => {
    it("should start monitoring at specified interval", async () => {
      const performHealthCheckSpy = jest.spyOn(
        healthMonitor as any,
        "performHealthCheck"
      );

      await healthMonitor.startMonitoring();

      // Fast-forward time by 5 minutes
      jest.advanceTimersByTime(300000);

      expect(performHealthCheckSpy).toHaveBeenCalled();
    });

    it("should perform all health checks successfully", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockCache.getCachedInteraction.mockResolvedValue(null);

      await (healthMonitor as any).performHealthCheck();

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockCache.getCachedInteraction).toHaveBeenCalledWith(
        "health-check"
      );
    });
  });

  describe("Database Health Check", () => {
    it("should pass when database is responsive", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await expect(
        (healthMonitor as any).checkDatabase()
      ).resolves.not.toThrow();
    });

    it("should throw error when database check fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("DB Connection Error"));

      await expect((healthMonitor as any).checkDatabase()).rejects.toThrow(
        "Database health check failed"
      );
    });
  });

  describe("Cache Health Check", () => {
    it("should pass when cache is responsive", async () => {
      mockCache.getCachedInteraction.mockResolvedValue(null);

      await expect((healthMonitor as any).checkCache()).resolves.not.toThrow();
    });

    it("should throw error when cache check fails", async () => {
      mockCache.getCachedInteraction.mockRejectedValue(
        new Error("Cache Connection Error")
      );

      await expect((healthMonitor as any).checkCache()).rejects.toThrow(
        "Cache health check failed"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database failures appropriately", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("DB Connection Error"));
      mockCache.getCachedInteraction.mockResolvedValue(null);

      const handleFailureSpy = jest.spyOn(
        healthMonitor as any,
        "handleHealthCheckFailure"
      );

      await (healthMonitor as any).performHealthCheck();

      expect(handleFailureSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle cache failures appropriately", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockCache.getCachedInteraction.mockRejectedValue(
        new Error("Cache Connection Error")
      );

      const handleFailureSpy = jest.spyOn(
        healthMonitor as any,
        "handleHealthCheckFailure"
      );

      await (healthMonitor as any).performHealthCheck();

      expect(handleFailureSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should continue monitoring after failures", async () => {
      mockPrisma.$queryRaw
        .mockRejectedValueOnce(new Error("DB Connection Error"))
        .mockResolvedValueOnce([{ 1: 1 }]);

      const performHealthCheckSpy = jest.spyOn(
        healthMonitor as any,
        "performHealthCheck"
      );

      await healthMonitor.startMonitoring();

      // First check fails
      jest.advanceTimersByTime(300000);
      expect(performHealthCheckSpy).toHaveBeenCalledTimes(1);

      // Second check succeeds
      jest.advanceTimersByTime(300000);
      expect(performHealthCheckSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Monitoring Lifecycle", () => {
    it("should maintain monitoring interval", async () => {
      const performHealthCheckSpy = jest.spyOn(
        healthMonitor as any,
        "performHealthCheck"
      );

      await healthMonitor.startMonitoring();

      // Check multiple intervals
      for (let i = 1; i <= 3; i++) {
        jest.advanceTimersByTime(300000);
        expect(performHealthCheckSpy).toHaveBeenCalledTimes(i);
      }
    });

    it("should handle concurrent health checks", async () => {
      let checkCount = 0;
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const performHealthCheckSpy = jest.spyOn(
        healthMonitor as any,
        "performHealthCheck"
      );

      await healthMonitor.startMonitoring();

      // Trigger multiple checks in quick succession
      jest.advanceTimersByTime(300000);
      jest.advanceTimersByTime(300000);

      expect(performHealthCheckSpy).toHaveBeenCalledTimes(2);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });
});
