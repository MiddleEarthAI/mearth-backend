import { Keypair } from "@solana/web3.js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import NodeCache from "node-cache";
import { PrismaClient } from "@prisma/client";
import { IKeyManagerService } from "../types/services";

import { logger } from "../utils/logger";
import { SecurityConfig } from "@/config";

/**
 * Service for managing agent keypairs with secure storage and caching
 */
export class KeyManagerService implements IKeyManagerService {
  private cache: NodeCache;
  private algorithm = "aes-256-gcm";

  constructor(
    private readonly config: SecurityConfig,
    private readonly prisma: PrismaClient
  ) {
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
    logger.info("KeyManager service initialized");
  }

  /**
   * Generate a new keypair for an agent
   */
  async generateKeypair(agentId: string): Promise<Keypair> {
    try {
      // Check cache first
      const cached = this.cache.get<Keypair>(agentId);
      if (cached) {
        return cached;
      }

      // Generate new keypair
      const keypair = Keypair.generate();
      const { encryptedPrivateKey } = await this.encryptPrivateKey(
        Buffer.from(keypair.secretKey)
      );

      // Store in database
      await this.prisma.agentKeypair.upsert({
        where: { agentId },
        update: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          rotatedAt: new Date(),
        },
        create: {
          agentId,
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
        },
      });

      // Cache the keypair
      this.cache.set(agentId, keypair);

      logger.info(`Generated new keypair for agent ${agentId}`);
      return keypair;
    } catch (error) {
      logger.error(`Failed to generate keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get an existing keypair for an agent
   */
  async getKeypair(agentId: string): Promise<Keypair> {
    try {
      // Check cache first
      const cached = this.cache.get<Keypair>(agentId);
      if (cached) {
        return cached;
      }

      // Get from database
      const stored = await this.prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (!stored) {
        throw new Error(`No keypair found for agent ${agentId}`);
      }

      // Decrypt private key
      const privateKey = await this.decryptPrivateKey(
        stored.encryptedPrivateKey
      );
      const keypair = Keypair.fromSecretKey(privateKey);

      // Cache the keypair
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
  async rotateKeypair(agentId: string): Promise<Keypair> {
    try {
      // Generate new keypair
      const keypair = Keypair.generate();
      const { encryptedPrivateKey } = await this.encryptPrivateKey(
        Buffer.from(keypair.secretKey)
      );

      // Update in database
      await this.prisma.agentKeypair.update({
        where: { agentId },
        data: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          rotatedAt: new Date(),
        },
      });

      // Update cache
      this.cache.set(agentId, keypair);

      logger.info(`Rotated keypair for agent ${agentId}`);
      return keypair;
    } catch (error) {
      logger.error(`Failed to rotate keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt a private key
   */
  private async encryptPrivateKey(
    privateKey: Buffer
  ): Promise<{ encryptedPrivateKey: string; iv: Buffer }> {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      this.algorithm,
      Buffer.from(this.config.keypairEncryptionKey, "hex"),
      iv
    ) as CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(privateKey),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();
    const encryptedPrivateKey = Buffer.concat([
      iv,
      authTag,
      encrypted,
    ]).toString("hex");

    return { encryptedPrivateKey, iv };
  }

  /**
   * Decrypt an encrypted private key
   */
  private async decryptPrivateKey(
    encryptedPrivateKey: string
  ): Promise<Buffer> {
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, "hex");
    const iv = encryptedBuffer.subarray(0, 16);
    const authTag = encryptedBuffer.subarray(16, 32);
    const encrypted = encryptedBuffer.subarray(32);

    const decipher = createDecipheriv(
      this.algorithm,
      Buffer.from(this.config.keypairEncryptionKey, "hex"),
      iv
    ) as DecipherGCM;

    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const keys = this.cache.keys();
    for (const key of keys) {
      if (!this.cache.get(key)) {
        this.cache.del(key);
      }
    }
  }
}
