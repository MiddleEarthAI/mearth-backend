import { Redis } from "ioredis";

// Redis cache manager
class CacheManager {
  private redis: Redis;
  private readonly PREFIX = "middleearth:";

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  async cacheInteraction(interaction: any): Promise<void> {
    const key = `${this.PREFIX}interaction:${interaction.id}`;
    await this.redis.setex(key, 3600, JSON.stringify(interaction));
  }

  async getCachedInteraction(id: string): Promise<any | null> {
    const key = `${this.PREFIX}interaction:${id}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.redis.keys(`${this.PREFIX}${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
export default CacheManager;
