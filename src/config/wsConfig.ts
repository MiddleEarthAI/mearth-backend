import { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";

export interface WsSecurityConfig {
  maxPayload: number;
  clientTracking: boolean;
  maxConnections: number;
  pingInterval: number;
  pingTimeout: number;
}

export const wsSecurityConfig: WsSecurityConfig = {
  maxPayload: 1024 * 16, // 16KB max message size
  clientTracking: true,
  maxConnections: 1000, // Adjust based on your needs
  pingInterval: 30000, // 30 seconds
  pingTimeout: 5000, // 5 seconds
};

export function createSecureWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    maxPayload: wsSecurityConfig.maxPayload,
    clientTracking: wsSecurityConfig.clientTracking,
    verifyClient: verifyClient,
  });

  // Track number of connections
  let connectionCount = 0;

  wss.on("connection", (ws, req) => {
    if (connectionCount >= wsSecurityConfig.maxConnections) {
      ws.close(1013, "Maximum connections reached");
      return;
    }
    connectionCount++;

    // Set up ping-pong
    const pingTimer = setInterval(() => {
      if (!(ws as any).isAlive) {
        clearInterval(pingTimer);
        ws.terminate();
        connectionCount--;
        return;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }, wsSecurityConfig.pingInterval);

    ws.on("pong", () => {
      (ws as any).isAlive = true;
    });

    ws.on("close", () => {
      clearInterval(pingTimer);
      connectionCount--;
    });
  });

  return wss;
}

function verifyClient(info: {
  origin: string;
  req: IncomingMessage;
  secure: boolean;
}) {
  // Verify origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "https://mearth.up.railway.app",
  ];
  if (!allowedOrigins.includes(info.origin)) {
    return false;
  }

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === "production" && !info.secure) {
    return false;
  }

  return true;
}
