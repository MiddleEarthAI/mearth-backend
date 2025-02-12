import { PrismaClient, LogType, LogLevel } from "@prisma/client";

/**
 * Interface for log entry options
 */
interface LogOptions {
  type: LogType;
  level: LogLevel;
  message: string;
  data?: any;
  agentId?: string;
  gameId?: string;
}

/**
 * Interface for log query options
 */
interface LogQueryOptions {
  types?: LogType[];
  levels?: LogLevel[];
  agentId?: string;
  gameId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Logger utility for storing and retrieving game logs
 */
export class Logger {
  private static instance: Logger;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a message with specified type and level
   */
  public async log({
    type,
    level,
    message,
    data,
    agentId,
    gameId,
  }: LogOptions): Promise<void> {
    try {
      await this.prisma.gameLog.create({
        data: {
          type,
          level,
          message,
          data: data ? data : undefined,
          ...(agentId && { agent: { connect: { id: agentId } } }),
          ...(gameId && { game: { connect: { id: gameId } } }),
        },
      });
    } catch (error) {
      console.error("Failed to store log:", error);
      // Re-throw the error if you want to handle it upstream
      throw error;
    }
  }

  /**
   * Convenience method for logging info messages
   */
  public async info(
    message: string,
    type: LogType,
    data?: any,
    agentId?: string,
    gameId?: string
  ): Promise<void> {
    await this.log({
      type,
      level: "INFO",
      message,
      data,
      agentId,
      gameId,
    });
  }

  /**
   * Convenience method for logging warning messages
   */
  public async warn(
    message: string,
    type: LogType,
    data?: any,
    agentId?: string,
    gameId?: string
  ): Promise<void> {
    await this.log({
      type,
      level: "WARNING",
      message,
      data,
      agentId,
      gameId,
    });
  }

  /**
   * Convenience method for logging error messages
   */
  public async error(
    message: string,
    type: LogType,
    data?: any,
    agentId?: string,
    gameId?: string
  ): Promise<void> {
    await this.log({
      type,
      level: "ERROR",
      message,
      data,
      agentId,
      gameId,
    });
  }

  /**
   * Convenience method for logging debug messages
   */
  public async debug(
    message: string,
    type: LogType,
    data?: any,
    agentId?: string,
    gameId?: string
  ): Promise<void> {
    await this.log({
      type,
      level: "DEBUG",
      message,
      data,
      agentId,
      gameId,
    });
  }

  /**
   * Query logs with filters
   */
  public async queryLogs({
    types,
    levels,
    agentId,
    gameId,
    startTime,
    endTime,
    limit = 100,
    offset = 0,
  }: LogQueryOptions = {}) {
    try {
      const where: any = {};

      if (types?.length) where.type = { in: types };
      if (levels?.length) where.level = { in: levels };
      if (agentId) where.agentId = agentId;
      if (gameId) where.gameId = gameId;
      if (startTime || endTime) {
        where.timestamp = {
          ...(startTime && { gte: startTime }),
          ...(endTime && { lte: endTime }),
        };
      }

      const [logs, total] = await Promise.all([
        this.prisma.gameLog.findMany({
          where,
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: offset,
          include: {
            agent: {
              select: {
                onchainId: true,
                profile: {
                  select: {
                    name: true,
                    xHandle: true,
                  },
                },
              },
            },
            game: {
              select: {
                onchainId: true,
              },
            },
          },
        }),
        this.prisma.gameLog.count({ where }),
      ]);

      return {
        logs,
        total,
        hasMore: total > offset + logs.length,
      };
    } catch (error) {
      console.error("Failed to query logs:", error);
      throw error;
    }
  }

  /**
   * Get recent logs
   */
  public async getRecentLogs(limit = 100) {
    return this.queryLogs({ limit });
  }

  /**
   * Clean up old logs
   */
  public async cleanupOldLogs(daysToKeep = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { count } = await this.prisma.gameLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      return count;
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
