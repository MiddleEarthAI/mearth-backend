/**
 * @fileoverview LogManager service for handling game logs and real-time streaming
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { Server } from "http";
import { PrismaClient, LogType, LogLevel } from "@prisma/client";
import { prisma } from "@/config/prisma";

// Structure for game logs
export interface GameLog {
  id: string;
  timestamp: number;
  type: LogType;
  level: LogLevel;
  message: string;
  data?: any;
  agentId?: string;
  agentHandle?: string;
  gameId?: string;
}

// Types that are safe to share publicly
const PUBLIC_LOG_TYPES: LogType[] = ["BATTLE", "MOVEMENT", "ALLIANCE"];

// Levels that are safe to share publicly
const PUBLIC_LOG_LEVELS: LogLevel[] = ["INFO"];

export class LogManager {
  private static instance: LogManager;
  private wss: WebSocket.Server | null = null;
  private eventEmitter: EventEmitter;
  private prisma: PrismaClient;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(0); // Allow unlimited listeners
    this.prisma = prisma;
  }

  /**
   * Get singleton instance of LogManager
   */
  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /**
   * Initialize WebSocket server for log streaming
   */
  public initialize(server: Server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", async (ws: WebSocket) => {
      console.log("🔌 New client connected to log stream");

      try {
        // Fetch recent public logs from database
        const recentLogs = await this.getRecentPublicLogs();

        // Send recent logs to new client
        ws.send(
          JSON.stringify({
            type: "FILTERED_LOGS",
            payload: {
              logs: recentLogs,
            },
          })
        );

        // Handle client messages (e.g., for filtering)
        ws.on("message", async (message: string) => {
          try {
            const data = JSON.parse(message);
            if (data.type === "FILTER") {
              // Ensure we only return public logs even with filters
              const filteredLogs = await this.filterPublicLogs(data.filters);
              ws.send(
                JSON.stringify({
                  type: "FILTERED_LOGS",
                  payload: {
                    logs: filteredLogs,
                  },
                })
              );
            }
          } catch (error) {
            console.error("Error processing client message:", error);
          }
        });

        // Clean up on client disconnect
        ws.on("close", () => {
          console.log("🔌 Client disconnected from log stream");
        });
      } catch (error) {
        console.error("Error sending initial logs:", error);
      }
    });

    // Subscribe to log events
    this.eventEmitter.on("newLog", (log: GameLog) => {
      this.broadcastPublicLog(log);
    });
  }

  /**
   * Create and emit a new log entry
   */
  public async log(
    type: LogType,
    level: LogLevel,
    message: string,
    data?: any,
    agentId?: string,
    gameId?: string
  ) {
    try {
      // Store in database
      const dbLog = await this.prisma.gameLog.create({
        data: {
          type,
          level,
          message,
          data: data ? data : undefined,
          ...(agentId && { agent: { connect: { id: agentId } } }),
          ...(gameId && { game: { connect: { id: gameId } } }),
        },
      });

      const log: GameLog = {
        id: dbLog.id,
        timestamp: dbLog.timestamp.getTime(),
        type: dbLog.type,
        level: dbLog.level,
        message: dbLog.message,
        data: dbLog.data,
        agentId: dbLog.agentId || undefined,
        gameId: dbLog.gameId || undefined,
      };

      // Emit the new log event
      this.eventEmitter.emit("newLog", log);

      // Also log to console for debugging
      this.consoleLog(log);
    } catch (error) {
      console.error("Failed to persist log:", error);
    }
  }

  /**
   * Broadcast public log to all connected clients
   */
  private broadcastPublicLog(log: GameLog) {
    if (!this.wss || !this.isPublicLog(log)) return;

    this.sanitizeLogForPublic(log).then((sanitizedLog) => {
      this.wss?.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "LOG",
              payload: sanitizedLog,
            })
          );
        }
      });
    });
  }

  /**
   * Get recent public logs from database
   */
  private async getRecentPublicLogs(limit: number = 100) {
    const logs = await this.prisma.gameLog.findMany({
      where: {
        type: { in: PUBLIC_LOG_TYPES },
        level: { in: PUBLIC_LOG_LEVELS },
      },
      include: {
        agent: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return Promise.all(
      logs.map((log) =>
        this.sanitizeLogForPublic({
          id: log.id,
          timestamp: log.timestamp.getTime(),
          type: log.type,
          level: log.level,
          message: log.message,
          data: log.data,
          agentId: log.agentId || undefined,
          agentHandle: log.agent?.profile.xHandle,
          gameId: log.gameId || undefined,
        })
      )
    );
  }

  /**
   * Filter logs based on criteria, ensuring only public logs are returned
   */
  private async filterPublicLogs(filters: {
    types?: LogType[];
    levels?: LogLevel[];
    agentHandle?: string;
    gameId?: string;
    startTime?: number;
    endTime?: number;
  }) {
    // Ensure we only query public log types and levels
    const safeTypes =
      filters.types?.filter((type) => PUBLIC_LOG_TYPES.includes(type)) ||
      PUBLIC_LOG_TYPES;
    const safeLevels =
      filters.levels?.filter((level) => PUBLIC_LOG_LEVELS.includes(level)) ||
      PUBLIC_LOG_LEVELS;

    try {
      const logs = await this.prisma.gameLog.findMany({
        where: {
          type: { in: safeTypes },
          level: { in: safeLevels },
          ...(filters.agentHandle && {
            agent: {
              profile: {
                xHandle: filters.agentHandle,
              },
            },
          }),
          ...(filters.gameId && { gameId: filters.gameId }),
          ...(filters.startTime && {
            timestamp: { gte: new Date(filters.startTime) },
          }),
          ...(filters.endTime && {
            timestamp: { lte: new Date(filters.endTime) },
          }),
        },
        include: {
          agent: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 1000, // Limit to last 1000 matching logs
      });

      return Promise.all(
        logs.map((log) =>
          this.sanitizeLogForPublic({
            id: log.id,
            timestamp: log.timestamp.getTime(),
            type: log.type,
            level: log.level,
            message: log.message,
            data: log.data,
            agentId: log.agentId || undefined,
            agentHandle: log.agent?.profile.xHandle,
            gameId: log.gameId || undefined,
          })
        )
      );
    } catch (error) {
      console.error("Failed to query logs from database:", error);
      return [];
    }
  }

  /**
   * Check if a log is safe for public consumption
   */
  private isPublicLog(log: GameLog): boolean {
    return (
      PUBLIC_LOG_TYPES.includes(log.type) &&
      PUBLIC_LOG_LEVELS.includes(log.level)
    );
  }

  /**
   * Sanitize log data for public consumption
   */
  private async sanitizeLogForPublic(log: GameLog): Promise<GameLog> {
    // Remove sensitive fields from data if present
    const sanitizedData = log.data ? this.sanitizeData(log.data) : undefined;

    // Replace agent ID with x handle in message if present
    let sanitizedMessage = log.message;
    if (log.agentId) {
      const agent = await this.prisma.agent.findUnique({
        where: { id: log.agentId },
        include: { profile: true },
      });
      if (agent?.profile.xHandle) {
        sanitizedMessage = sanitizedMessage.replace(
          new RegExp(log.agentId, "g"),
          `@${agent.profile.xHandle}`
        );
      }
    }

    return {
      ...log,
      message: sanitizedMessage,
      data: sanitizedData,
      agentId: undefined, // Remove agent ID from public logs
    };
  }

  /**
   * Sanitize data object by removing sensitive fields
   */
  private sanitizeData(data: any): any {
    if (!data) return undefined;

    // List of fields to remove from data
    const sensitiveFields = [
      "privateKey",
      "secret",
      "password",
      "token",
      "apiKey",
      "credentials",
      "walletPrivateKey",
      "error",
      "agentId", // Also remove agent IDs from data
      "id",
    ];

    if (typeof data === "object") {
      const sanitized = { ...data };
      sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }

    return data;
  }

  /**
   * Format and print log to console
   */
  private consoleLog(log: GameLog) {
    const timestamp = new Date(log.timestamp).toISOString();
    const prefix = `[${timestamp}][${log.type}][${log.level}]`;

    switch (log.level) {
      case "ERROR":
        console.error(`${prefix} ${log.message}`, log.data || "");
        break;
      case "WARNING":
        console.warn(`${prefix} ${log.message}`, log.data || "");
        break;
      case "DEBUG":
        console.debug(`${prefix} ${log.message}`, log.data || "");
        break;
      default:
        console.log(`${prefix} ${log.message}`, log.data || "");
    }
  }
}

export const logManager = LogManager.getInstance();
