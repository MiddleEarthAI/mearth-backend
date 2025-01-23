import { Keypair } from "@solana/web3.js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import NodeCache from "node-cache";
import { IKeyManager } from "../types";
import { prisma } from "../config/prisma";
import { SecurityConfig } from "../types/config";
import { logger } from "../utils/logger";

class KeyManagerConfig {
  keypairEncryptionKey: string;
  jwtSecret: string;

  constructor(config?: SecurityConfig) {
    this.keypairEncryptionKey =
      config?.keypairEncryptionKey ||
      process.env.SOLANA_KEYPAIR_ENCRYPTION_KEY!;
    this.jwtSecret = config?.jwtSecret || process.env.JWT_SECRET!;
  }
}

/**
 * Service for managing agent keypairs with secure storage and caching
 */
export class KeyManager implements IKeyManager {
  private cache: NodeCache;
  private algorithm = "aes-256-gcm";

  constructor(private readonly config?: SecurityConfig) {
    this.config = new KeyManagerConfig(config);
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
      const stored = await prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (stored) {
        // Decrypt and reconstruct keypair
        const decrypted = await this.decryptPrivateKey(
          stored.encryptedPrivateKey,
          stored.iv as Buffer,
          stored.tag as Buffer
        );
        const keypair = Keypair.fromSecretKey(decrypted);

        // Cache it
        this.cache.set(agentId, keypair);
        return keypair;
      }

      // Generate new if not found
      const { keypair } = await this.generateKeypair(agentId);
      return keypair;
    } catch (error) {
      logger.error(`Failed to get keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a new keypair for an agent
   */
  private async generateKeypair(agentId: string): Promise<{
    keypair: Keypair;
    iv: Buffer;
    tag: Buffer;
    encryptedPrivateKey: string;
  }> {
    try {
      // Generate new keypair
      const keypair = Keypair.generate();
      const privateKeyBuffer = keypair.secretKey;

      // Encrypt private key
      const { encryptedPrivateKey, iv, tag } = await this.encryptPrivateKey(
        Buffer.from(privateKeyBuffer)
      );

      // Store in database
      await prisma.agentKeypair.upsert({
        where: { agentId },
        update: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv: iv as Buffer,
          tag: tag as Buffer,
          updatedAt: new Date(),
        },
        create: {
          agentId,
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv: iv as Buffer,
          tag: tag as Buffer,
        },
      });

      // Cache the new keypair
      this.cache.set(agentId, keypair);
      logger.info(`Generated new keypair for agent ${agentId}`);

      return { keypair, iv, tag, encryptedPrivateKey };
    } catch (error) {
      logger.error(`Failed to generate keypair for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate an agent's keypair
   */
  async rotateKeypair(agentId: string): Promise<void> {
    try {
      const { keypair, iv, tag, encryptedPrivateKey } =
        await this.generateKeypair(agentId);

      await prisma.agentKeypair.update({
        where: { agentId },
        data: {
          publicKey: keypair.publicKey.toBase58(),
          encryptedPrivateKey,
          iv: iv as Buffer,
          tag: tag as Buffer,
          rotatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update cache
      this.cache.del(agentId);

      logger.info(`Rotated keypair for agent ${agentId}`);
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
    const key = this.config?.keypairEncryptionKey;
    if (!key) {
      throw new Error("Keypair encryption key is not set");
    }
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      this.algorithm,
      Buffer.from(key, "hex"),
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
    const key = this.config?.keypairEncryptionKey || "";
    if (!key) {
      throw new Error("Keypair encryption key is not set");
    }

    const decipher = createDecipheriv(
      this.algorithm,
      Buffer.from(key, "hex"),
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

  /**
   * Get an agent's public key
   */
  async getPublicKey(agentId: string): Promise<string> {
    try {
      const keypair = await prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (!keypair) {
        throw new Error(`No keypair found for agent ${agentId}`);
      }

      return keypair.publicKey;
    } catch (error) {
      logger.error(`Failed to get public key for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get an agent's encrypted private key
   */
  async getEncryptedPrivateKey(
    agentId: string
  ): Promise<{ encryptedKey: string; iv: Buffer; tag: Buffer }> {
    try {
      const keypair = await prisma.agentKeypair.findUnique({
        where: { agentId },
      });

      if (!keypair) {
        throw new Error(`No keypair found for agent ${agentId}`);
      }

      return {
        encryptedKey: keypair.encryptedPrivateKey,
        iv: keypair.iv as Buffer,
        tag: keypair.tag as Buffer,
      };
    } catch (error) {
      logger.error(
        `Failed to get encrypted private key for agent ${agentId}:`,
        error
      );
      throw error;
    }
  }
}
