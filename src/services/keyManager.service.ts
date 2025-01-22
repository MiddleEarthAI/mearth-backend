import { Keypair } from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { logger } from "../utils/logger";
import NodeCache from "node-cache";

/**
 * Service for secure management of agent keypairs
 */
export class KeyManagerService {
  private readonly prisma: PrismaClient;
  private readonly cache: NodeCache;
  private readonly encryptionKey: Buffer;
  private readonly algorithm = "aes-256-gcm";

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

    // Get encryption key from environment or generate one
    const envKey = process.env.KEYPAIR_ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error("Missing KEYPAIR_ENCRYPTION_KEY environment variable");
    }
    this.encryptionKey = Buffer.from(envKey, "hex");
  }

  /**
   * Generate a new keypair for an agent
   */
  public async generateKeypair(agentId: string): Promise<Keypair> {
    try {
      // Generate new keypair
      const keypair = Keypair.generate();

      // Encrypt private key
      const encryptedPrivateKey = this.encryptData(
        Buffer.from(keypair.secretKey).toString("hex")
      );

      // Store encrypted private key
      await this.prisma.agentKeypair.create({
        data: {
          agentId,
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
        },
      });

      logger.info(`Generated new keypair for agent ${agentId}`);
      return keypair;
    } catch (error) {
      logger.error(`Failed to generate keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get an agent's keypair
   */
  public async getKeypair(agentId: string): Promise<Keypair> {
    // Check cache first
    const cachedKeypair = this.cache.get<Keypair>(agentId);
    if (cachedKeypair) {
      return cachedKeypair;
    }

    try {
      // Get encrypted keypair from database
      const storedKeypair = await this.prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (!storedKeypair) {
        throw new Error(`No keypair found for agent ${agentId}`);
      }

      // Decrypt private key
      const privateKeyHex = this.decryptData(storedKeypair.encryptedPrivateKey);
      const privateKey = Buffer.from(privateKeyHex, "hex");

      // Reconstruct keypair
      const keypair = Keypair.fromSecretKey(privateKey);

      // Verify public key matches
      if (keypair.publicKey.toBase58() !== storedKeypair.publicKey) {
        throw new Error("Keypair verification failed");
      }

      // Cache keypair
      this.cache.set(agentId, keypair);

      return keypair;
    } catch (error) {
      logger.error(`Failed to get keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate an agent's keypair
   */
  public async rotateKeypair(agentId: string): Promise<Keypair> {
    try {
      // Generate new keypair
      const newKeypair = await this.generateKeypair(agentId);

      // Update database
      const encryptedPrivateKey = this.encryptData(
        Buffer.from(newKeypair.secretKey).toString("hex")
      );

      await this.prisma.agentKeypair.update({
        where: { agentId },
        data: {
          publicKey: newKeypair.publicKey.toBase58(),
          encryptedPrivateKey,
          rotatedAt: new Date(),
        },
      });

      // Update cache
      this.cache.set(agentId, newKeypair);

      logger.info(`Rotated keypair for agent ${agentId}`);
      return newKeypair;
    } catch (error) {
      logger.error(`Failed to rotate keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encryptData(data: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    );

    let encryptedData = cipher.update(data, "utf8", "hex");
    encryptedData += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return `${iv.toString("hex")}:${encryptedData}:${authTag.toString("hex")}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decryptData(encryptedData: string): string {
    const [ivHex, data, authTagHex] = encryptedData.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    );
    decipher.setAuthTag(authTag);

    let decryptedData = decipher.update(data, "hex", "utf8");
    decryptedData += decipher.final("utf8");

    return decryptedData;
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    this.cache.prune();
  }
}
