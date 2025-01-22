import WebSocket from "ws";
import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { retryWithExponentialBackoff } from "../utils/retry";

interface WebSocketRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown[];
}

interface WebSocketMessage {
  method?: string;
  params?: any;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private readonly eventEmitter: EventEmitter;
  private readonly url: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private subscriptions: Set<string> = new Set();

  constructor() {
    if (!process.env.HELIUS_API_KEY) {
      throw new Error("Missing HELIUS_API_KEY environment variable");
    }

    this.url = `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
    this.eventEmitter = new EventEmitter();
    this.setupEventEmitter();
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn("WebSocket is already connected");
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
      this.setupWebSocketHandlers();
      await this.waitForConnection();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      logger.info("WebSocket connected successfully");
    } catch (error) {
      logger.error("Failed to connect to WebSocket:", error);
      throw error;
    }
  }

  /**
   * Subscribe to program events
   */
  public async subscribeToProgramEvents(programId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("WebSocket is not connected");
    }

    const request: WebSocketRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "programSubscribe",
      params: [
        programId,
        {
          encoding: "jsonParsed",
          commitment: "confirmed",
        },
      ],
    } as const;

    try {
      await this.sendRequest(request);
      this.subscriptions.add(programId);
      logger.info(`Subscribed to program events: ${programId}`);
    } catch (error) {
      logger.error(
        `Failed to subscribe to program events: ${programId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Subscribe to signature/transaction events
   */
  public async subscribeToSignature(signature: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("WebSocket is not connected");
    }

    const request: WebSocketRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "signatureSubscribe",
      params: [
        signature,
        {
          commitment: "confirmed",
          enableReceivedNotification: true,
        },
      ],
    } as const;

    try {
      await this.sendRequest(request);
      this.subscriptions.add(signature);
      logger.info(`Subscribed to signature events: ${signature}`);
    } catch (error) {
      logger.error(`Failed to subscribe to signature: ${signature}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to account updates
   */
  public async subscribeToAccount(accountId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("WebSocket is not connected");
    }

    const request: WebSocketRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "accountSubscribe",
      params: [
        accountId,
        {
          encoding: "jsonParsed",
          commitment: "confirmed",
        },
      ],
    } as const;

    try {
      await this.sendRequest(request);
      this.subscriptions.add(accountId);
      logger.info(`Subscribed to account updates: ${accountId}`);
    } catch (error) {
      logger.error(`Failed to subscribe to account: ${accountId}`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.ws) return;

    try {
      this.ws.close();
      this.isConnected = false;
      this.subscriptions.clear();
      logger.info("WebSocket disconnected");
    } catch (error) {
      logger.error("Error disconnecting WebSocket:", error);
      throw error;
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on("open", () => {
      logger.info("WebSocket connection opened");
      this.eventEmitter.emit("connected");
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        logger.error("Error parsing WebSocket message:", error);
      }
    });

    this.ws.on("error", (error: Error) => {
      logger.error("WebSocket error:", error);
      this.eventEmitter.emit("error", error);
    });

    this.ws.on("close", () => {
      logger.info("WebSocket connection closed");
      this.isConnected = false;
      this.handleReconnect();
    });
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Max reconnection attempts reached");
      this.eventEmitter.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    logger.info(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    try {
      await this.connect();
      // Resubscribe to all previous subscriptions
      for (const subscription of this.subscriptions) {
        await this.subscribeToProgramEvents(subscription);
      }
    } catch (error) {
      logger.error("Reconnection attempt failed:", error);
      setTimeout(() => this.handleReconnect(), 5000 * this.reconnectAttempts);
    }
  }

  private setupEventEmitter(): void {
    this.eventEmitter.on("programUpdate", (data) => {
      logger.info("Program update received:", data);
    });

    this.eventEmitter.on("signatureUpdate", (data) => {
      logger.info("Signature update received:", data);
    });

    this.eventEmitter.on("accountUpdate", (data) => {
      logger.info("Account update received:", data);
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.method === "programNotification") {
      this.eventEmitter.emit("programUpdate", message.params);
    } else if (message.method === "signatureNotification") {
      this.eventEmitter.emit("signatureUpdate", message.params);
    } else if (message.method === "accountNotification") {
      this.eventEmitter.emit("accountUpdate", message.params);
    }
  }

  private async sendRequest(request: WebSocketRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("WebSocket is not initialized"));
        return;
      }

      this.ws.send(JSON.stringify(request), (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("WebSocket is not initialized"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, 10000);

      this.eventEmitter.once("connected", () => {
        clearTimeout(timeout);
        resolve();
      });

      this.eventEmitter.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Send ping every 30 seconds
  }

  public onProgramUpdate(callback: (data: any) => void): void {
    this.eventEmitter.on("programUpdate", callback);
  }

  public onSignatureUpdate(callback: (data: any) => void): void {
    this.eventEmitter.on("signatureUpdate", callback);
  }

  public onAccountUpdate(callback: (data: any) => void): void {
    this.eventEmitter.on("accountUpdate", callback);
  }
}
