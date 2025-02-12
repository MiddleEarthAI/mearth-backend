/**
 * @fileoverview LogManager service for handling game logs and real-time streaming
 */

import { Server } from "http";
import { createSecureWebSocketServer } from "../config/wsConfig";

import { PrismaClient, LogType, LogLevel } from "@prisma/client";

// Structure for game logs
interface GameLog {
  id: string;
  type: LogType;
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  agentId?: string;
  gameId?: string;
}

export class LogManager {
  private static instance: LogManager;
  private wss: any;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
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
    this.wss = createSecureWebSocketServer(server);

    // Handle authenticated connections
    this.wss.on("connection", async (ws: any) => {
      try {
        // Send recent public logs on connection
        const recentLogs = await this.getRecentPublicLogs();
        ws.send(JSON.stringify({ type: "initial_logs", logs: recentLogs }));

        // Handle incoming messages
        ws.on("message", async (message: string) => {
          try {
            const data = JSON.parse(message);
            // Handle message types as needed
            // Add validation and sanitization here
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Invalid message format",
              })
            );
          }
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.close(1011, "Internal Server Error");
      }
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

      // Broadcast to connected clients if it's a public log
      if (this.isPublicLog(log)) {
        const sanitizedLog = this.sanitizeLog(log);
        this.broadcast(sanitizedLog);
      }
    } catch (error) {
      console.error("Error logging message:", error);
    }
  }

  private broadcast(log: GameLog) {
    if (!this.wss) return;

    this.wss.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(JSON.stringify({ type: "log", data: log }));
      }
    });
  }

  /**
   * Get recent public logs from database
   */
  private async getRecentPublicLogs(limit = 100): Promise<GameLog[]> {
    try {
      const logs = await this.prisma.gameLog.findMany({
        where: {
          AND: [
            { type: { in: this.getPublicLogTypes() } },
            { level: { in: this.getPublicLogLevels() } },
          ],
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return logs.map((log) => ({
        id: log.id,
        type: log.type,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp.getTime(),
        data: this.sanitizeMetadata(log.data),
        agentId: undefined,
        gameId: undefined,
      }));
    } catch (error) {
      console.error("Error fetching recent logs:", error);
      return [];
    }
  }

  private getPublicLogTypes(): LogType[] {
    return [LogType.BATTLE, LogType.MOVEMENT, LogType.ALLIANCE];
  }

  private getPublicLogLevels(): LogLevel[] {
    return [LogLevel.INFO];
  }

  /**
   * Check if a log is safe for public consumption
   */
  private isPublicLog(log: GameLog): boolean {
    return (
      this.getPublicLogTypes().includes(log.type) &&
      this.getPublicLogLevels().includes(log.level)
    );
  }

  private sanitizeLog(log: GameLog): GameLog {
    const { id, type, level, message, timestamp } = log;
    const sanitizedData = this.sanitizeMetadata(log.data);

    return {
      id,
      type,
      level,
      message,
      timestamp,
      data: sanitizedData,
      agentId: undefined,
      gameId: undefined,
    };
  }

  private sanitizeMetadata(metadata: any): any {
    // Remove sensitive fields
    const sanitized = { ...metadata };
    const sensitiveFields = [
      "privateKey",
      "secret",
      "password",
      "token",
      "apiKey",
    ];

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }
}

export const logManager = LogManager.getInstance();
