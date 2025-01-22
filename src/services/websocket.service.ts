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
  private programUpdateCallback: ((data: any) => void) | null = null;
  private signatureUpdateCallback: ((data: any) => void) | null = null;
  private accountUpdateCallback: ((data: any) => void) | null = null;
  private readonly reconnectDelay = 1000; // Start with 1 second

  constructor(private readonly wsEndpoint: string) {
    if (!process.env.HELIUS_API_KEY) {
      throw new Error("Missing HELIUS_API_KEY environment variable");
    }

    this.url = `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
    this.eventEmitter = new EventEmitter();
    this.setupEventEmitter();
  }

  /**
   * Connect to WebSocket endpoint
   */
  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info("WebSocket already connected");
      return;
    }

    try {
      await this.establishConnection();
      this.setupEventHandlers();
      logger.info("WebSocket connected successfully");
    } catch (error) {
      logger.error("Failed to connect WebSocket:", error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      logger.info("WebSocket disconnected");
    }
  }

  /**
   * Subscribe to program events
   */
  public async subscribeToProgramEvents(programId: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const subscribeMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "programSubscribe",
      params: [
        programId,
        {
          encoding: "jsonParsed",
          commitment: "confirmed",
        },
      ],
    };

    await this.sendRequest(subscribeMessage);
    logger.info(`Subscribed to program events for ${programId}`);
  }

  /**
   * Set callback for program updates
   */
  public onProgramUpdate(callback: (data: any) => void): void {
    this.programUpdateCallback = callback;
  }

  /**
   * Set callback for signature updates
   */
  public onSignatureUpdate(callback: (data: any) => void): void {
    this.signatureUpdateCallback = callback;
  }

  /**
   * Set callback for account updates
   */
  public onAccountUpdate(callback: (data: any) => void): void {
    this.accountUpdateCallback = callback;
  }

  /**
   * Establish WebSocket connection with retry logic
   */
  private async establishConnection(): Promise<void> {
    await retryWithExponentialBackoff(
      () => {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(this.wsEndpoint);

          this.ws.once("open", () => {
            this.reconnectAttempts = 0;
            resolve();
          });

          this.ws.once("error", (error) => {
            reject(error);
          });
        });
      },
      {
        maxRetries: this.maxReconnectAttempts,
        minTimeout: this.reconnectDelay,
        maxTimeout:
          this.reconnectDelay * Math.pow(2, this.maxReconnectAttempts),
      }
    );
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error("Error parsing WebSocket message:", error);
      }
    });

    this.ws.on("close", () => {
      logger.warn("WebSocket connection closed");
      this.handleReconnect();
    });

    this.ws.on("error", (error) => {
      logger.error("WebSocket error:", error);
      this.handleReconnect();
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    if (
      message.method === "programNotification" &&
      this.programUpdateCallback
    ) {
      this.programUpdateCallback(message.params);
    } else if (
      message.method === "signatureNotification" &&
      this.signatureUpdateCallback
    ) {
      this.signatureUpdateCallback(message.params);
    } else if (
      message.method === "accountNotification" &&
      this.accountUpdateCallback
    ) {
      this.accountUpdateCallback(message.params);
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private async handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error("Reconnection attempt failed:", error);
      }
    }, delay);
  }

  /**
   * Send a request through WebSocket
   */
  private async sendRequest(request: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws!.send(JSON.stringify(request), (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
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
}
