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
    // Increase cache TTL to 24 hours since keypairs are sensitive
    this.cache = new NodeCache({
      stdTTL: 24 * 3600, // 24 hours
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Store actual keypair references
    });
    logger.info("KeyManager service initialized");
  }

  /**
   * Get a keypair for an agent, generating one if it doesn't exist
   */
  async getKeypair(agentId: string): Promise<Keypair> {
    try {
      // Check cache first
      const cached = this.cache.get<Keypair>(agentId);
      if (cached) {
        return cached;
      }

      // Check database
      const stored = await this.prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (stored) {
        // Decrypt and reconstruct keypair
        const decrypted = await this.decryptPrivateKey(
          stored.encryptedPrivateKey,
          Buffer.from(stored.iv),
          Buffer.from(stored.tag)
        );
        const keypair = Keypair.fromSecretKey(decrypted);

        // Cache it
        this.cache.set(agentId, keypair);
        return keypair;
      }

      // Generate new if not found
      return this.generateKeypair(agentId);
    } catch (error) {
      logger.error(`Failed to get keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a new keypair for an agent
   */
  private async generateKeypair(agentId: string): Promise<Keypair> {
    try {
      // Generate new keypair
      const keypair = Keypair.generate();
      const { encryptedPrivateKey, iv, tag } = await this.encryptPrivateKey(
        Buffer.from(keypair.secretKey)
      );

      // Store in database
      await this.prisma.agentKeypair.upsert({
        where: { agentId },
        update: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv,
          tag,
          updatedAt: new Date(),
        },
        create: {
          agentId,
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv,
          tag,
        },
      });

      // Cache the new keypair
      this.cache.set(agentId, keypair);
      logger.info(`Generated new keypair for agent ${agentId}`);

      return keypair;
    } catch (error) {
      logger.error(`Failed to generate keypair for agent ${agentId}:`, error);
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
      const { encryptedPrivateKey, iv, tag } = await this.encryptPrivateKey(
        Buffer.from(keypair.secretKey)
      );

      // Update in database
      await this.prisma.agentKeypair.update({
        where: { agentId },
        data: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv,
          tag,
          rotatedAt: new Date(),
          updatedAt: new Date(),
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
  ): Promise<{ encryptedPrivateKey: string; iv: Buffer; tag: Buffer }> {
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

    return { encryptedPrivateKey, iv, tag: authTag };
  }

  /**
   * Decrypt an encrypted private key
   */
  private async decryptPrivateKey(
    encryptedPrivateKey: string,
    iv: Buffer,
    tag: Buffer
  ): Promise<Buffer> {
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, "hex");
    const authTag = encryptedBuffer.subarray(16, 32);
    const encrypted = encryptedBuffer.subarray(32);

    const decipher = createDecipheriv(
      this.algorithm,
      Buffer.from(this.config.keypairEncryptionKey, "hex"),
      iv
    ) as DecipherGCM;

    decipher.setAuthTag(tag);
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
