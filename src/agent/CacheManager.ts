import { Redis } from "ioredis";
import NodeCache from "node-cache";
import { logger } from "@/utils/logger";

/**
 * Redis Cache Manager
 * Handles caching interactions with configurable TTL and prefix
 * Uses Redis as the underlying cache store
 */
export default class CacheManager {
  private redis: Redis;
  private readonly PREFIX = "middleearth:";
  private cache: NodeCache;

  constructor() {
    console.log("🚀 Initializing Redis Cache Manager...");
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.error("❌ REDIS_URL environment variable is not set!");
      throw new Error("REDIS_URL is not set");
    }
    this.redis = new Redis(redisUrl);
    console.log("✅ Redis connection established successfully");

    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
    });
  }

  /**
   * Caches an interaction with 1 hour TTL
   * @param interaction The interaction object to cache
   */
  async cacheInteraction(interaction: any): Promise<void> {
    console.log(`💾 Caching interaction with ID: ${interaction.id}`);
    const key = `${this.PREFIX}interaction:${interaction.id}`;
    await this.redis.setex(key, 3600, JSON.stringify(interaction));
    console.log(`✅ Successfully cached interaction ${interaction.id}`);
  }

  /**
   * Retrieves a cached interaction by ID
   * @param id The interaction ID to lookup
   * @returns The cached interaction or null if not found
   */
  async getCachedInteraction(id: string): Promise<any | null> {
    console.log(`🔍 Looking up cached interaction with ID: ${id}`);
    const key = `${this.PREFIX}interaction:${id}`;
    const data = await this.redis.get(key);
    if (data) {
      console.log(`✨ Cache hit for interaction ${id}`);
      return JSON.parse(data);
    }
    console.log(`💨 Cache miss for interaction ${id}`);
    return null;
  }

  /**
   * Invalidates cache entries matching the given pattern
   * @param pattern The pattern to match cache keys against
   */
  async invalidateCache(pattern: string): Promise<void> {
    console.log(`🧹 Invalidating cache entries matching pattern: ${pattern}`);
    const keys = await this.redis.keys(`${this.PREFIX}${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache entries`);
    } else {
      console.log(`ℹ️ No cache entries found matching pattern`);
    }
  }

  /**
   * Resets the cache by clearing all entries
   * Used during recovery scenarios
   */
  async reset(): Promise<void> {
    try {
      this.cache.flushAll();
      logger.info("Successfully reset cache");
    } catch (error) {
      logger.error("Failed to reset cache", { error });
      throw error;
    }
  }

  /**
   * Closes the cache and cleans up resources
   * Used during graceful shutdown
   */
  async close(): Promise<void> {
    try {
      this.cache.close();
      logger.info("Successfully closed cache");
    } catch (error) {
      logger.error("Failed to close cache", { error });
      throw error;
    }
  }
}
