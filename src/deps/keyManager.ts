import { Keypair } from "@solana/web3.js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import NodeCache from "node-cache";
import { IKeyManager } from "../types";
import { prisma } from "../config/prisma";
import { SecurityConfig } from "../types/config";
import { logger } from "../utils/logger";

// Custom error classes for more granular error handling
class KeyManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyManagementError";
  }
}

class EncryptionKeyMissingError extends KeyManagementError {
  constructor() {
    super("Encryption key is not configured");
  }
}

class KeypairNotFoundError extends KeyManagementError {
  constructor(agentId: string) {
    super(`No keypair found for agent ${agentId}`);
  }
}

class KeyManagerConfig {
  keypairEncryptionKey: string;
  saltPrefix: string;

  constructor(config?: SecurityConfig) {
    // Validate critical environment variables
    this.validateEnvironmentVariables();

    this.keypairEncryptionKey =
      config?.keypairEncryptionKey || process.env.KEYPAIR_ENCRYPTION_KEY!;

    // Add a salt prefix for key derivation
    this.saltPrefix = "solana-keypair-management-v1";
  }

  // Validate that critical environment variables are set
  private validateEnvironmentVariables(): void {
    const requiredVars = ["KEYPAIR_ENCRYPTION_KEY"];

    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        throw new EncryptionKeyMissingError();
      }
    }
  }

  // Derive a secure encryption key using scrypt
  deriveSecureKey(baseKey: string): Buffer {
    const salt = `${this.saltPrefix}-${baseKey.slice(0, 16)}`;
    return scryptSync(baseKey, salt, 32);
  }
}

export class KeyManager implements IKeyManager {
  private cache: NodeCache;
  private algorithm = "aes-256-gcm";
  private config: KeyManagerConfig;

  constructor(config?: SecurityConfig) {
    this.config = new KeyManagerConfig(config);

    // Enhanced cache configuration with more aggressive cleanup
    this.cache = new NodeCache({
      stdTTL: 24 * 3600, // 24 hours
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
      maxKeys: 1000, // Limit total number of cached keys
    });

    // Set up periodic cache cleanup
    this.setupCacheCleanup();

    logger.info("KeyManager service initialized with enhanced security");
  }

  // Periodic cache cleanup to prevent memory bloat
  private setupCacheCleanup(): void {
    setInterval(() => {
      try {
        this.cleanupCache();
      } catch (error) {
        logger.error("Cache cleanup failed", error);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  async getKeypair(agentId: string): Promise<Keypair> {
    try {
      // Check cache first
      const cached = this.cache.get<Keypair>(agentId);
      if (cached) return cached;

      // Check database
      const stored = await prisma.keypair.findUnique({
        where: { agentId },
      });

      if (stored) {
        const decrypted = await this.decryptPrivateKey(
          stored.encryptedPrivateKey,
          stored.iv as Buffer,
          stored.tag as Buffer
        );
        const keypair = Keypair.fromSecretKey(decrypted);

        // Cache it with event logging
        this.cacheKeypair(agentId, keypair);
        return keypair;
      }

      // Generate new if not found
      const { keypair } = await this.generateKeypair(agentId);
      return keypair;
    } catch (error) {
      this.handleKeyRetrievalError(agentId, error);
      throw error;
    }
  }

  // Enhanced error handling for key retrieval
  private handleKeyRetrievalError(agentId: string, error: unknown): void {
    if (error instanceof KeypairNotFoundError) {
      logger.warn(`Keypair retrieval failed for agent ${agentId}`, error);
    } else {
      logger.error(
        `Critical error retrieving keypair for agent ${agentId}`,
        error
      );
    }
  }

  // Cache keypair with additional logging
  private cacheKeypair(agentId: string, keypair: Keypair): void {
    try {
      this.cache.set(agentId, keypair);
      logger.info(`Keypair cached for agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to cache keypair for agent ${agentId}`, error);
    }
  }

  private async generateKeypair(agentId: string): Promise<{
    keypair: Keypair;
    iv: Buffer;
    tag: Buffer;
    encryptedPrivateKey: string;
  }> {
    try {
      const keypair = Keypair.generate();
      const privateKeyBuffer = keypair.secretKey;

      // Enhanced encryption with key derivation
      const { encryptedPrivateKey, iv, tag } = await this.encryptPrivateKey(
        Buffer.from(privateKeyBuffer)
      );

      // Transactional database update with logging
      await prisma.$transaction(async (tx) => {
        await tx.keypair.upsert({
          where: { agentId },
          update: {
            publicKey: keypair.publicKey.toBase58(),
            encryptedPrivateKey,
            iv: iv as Buffer,
            tag: tag as Buffer,
            rotatedAt: new Date(),
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
      });

      // Cache the new keypair
      this.cacheKeypair(agentId, keypair);

      logger.info(`Generated new keypair for agent ${agentId}`, {
        publicKey: keypair.publicKey.toBase58(),
      });

      return { keypair, iv, tag, encryptedPrivateKey };
    } catch (error) {
      logger.error(`Keypair generation failed for agent ${agentId}`, error);
      throw new KeyManagementError(`Failed to generate keypair: ${error}`);
    }
  }

  async rotateKeypair(agentId: string): Promise<void> {
    try {
      // Add a cooldown check to prevent rapid rotations
      const lastRotation = await this.getLastRotationTime(agentId);
      this.enforceRotationCooldown(lastRotation);

      const { keypair } = await this.generateKeypair(agentId);

      // Invalidate cache to force fresh retrieval
      this.cache.del(agentId);

      logger.info(`Keypair rotated successfully for agent ${agentId}`, {
        newPublicKey: keypair.publicKey.toBase58(),
      });
    } catch (error) {
      logger.error(`Keypair rotation failed for agent ${agentId}`, error);
      throw error;
    }
  }

  // Enforce a cooldown period between key rotations
  private enforceRotationCooldown(lastRotation?: Date): void {
    if (lastRotation) {
      const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
      const timeSinceLastRotation = Date.now() - lastRotation.getTime();

      if (timeSinceLastRotation < cooldownPeriod) {
        throw new KeyManagementError("Keypair rotation cooldown not elapsed");
      }
    }
  }

  // Retrieve last rotation time
  private async getLastRotationTime(
    agentId: string
  ): Promise<Date | undefined> {
    const keypair = await prisma.keypair.findUnique({
      where: { agentId },
      select: { rotatedAt: true },
    });
    return keypair?.rotatedAt as Date;
  }

  private async encryptPrivateKey(
    privateKey: Buffer
  ): Promise<{ encryptedPrivateKey: string; iv: Buffer; tag: Buffer }> {
    // Use key derivation for enhanced security
    const derivedKey = this.config.deriveSecureKey(
      this.config.keypairEncryptionKey
    );

    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, derivedKey, iv) as CipherGCM;

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

  private async decryptPrivateKey(
    encryptedPrivateKey: string,
    iv: Buffer,
    tag: Buffer
  ): Promise<Buffer> {
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, "hex");
    const authTag = encryptedBuffer.subarray(16, 32);
    const encrypted = encryptedBuffer.subarray(32);

    // Use key derivation for decryption
    const derivedKey = this.config.deriveSecureKey(
      this.config.keypairEncryptionKey
    );

    const decipher = createDecipheriv(
      this.algorithm,
      derivedKey,
      iv
    ) as DecipherGCM;

    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private cleanupCache(): void {
    const keys = this.cache.keys();
    let cleanedCount = 0;

    for (const key of keys) {
      if (!this.cache.get(key)) {
        this.cache.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  async getPublicKey(agentId: string): Promise<string> {
    try {
      const keypair = await prisma.keypair.findUnique({
        where: { agentId },
        select: { publicKey: true },
      });

      if (!keypair) {
        throw new KeypairNotFoundError(agentId);
      }

      return keypair.publicKey;
    } catch (error) {
      logger.error(`Failed to retrieve public key for ${agentId}`, error);
      throw error;
    }
  }

  async getEncryptedPrivateKey(
    agentId: string
  ): Promise<{ encryptedKey: string; iv: Buffer; tag: Buffer }> {
    try {
      const keypair = await prisma.keypair.findUnique({
        where: { agentId },
      });

      if (!keypair) {
        throw new KeypairNotFoundError(agentId);
      }

      return {
        encryptedKey: keypair.encryptedPrivateKey,
        iv: keypair.iv as Buffer,
        tag: keypair.tag as Buffer,
      };
    } catch (error) {
      logger.error(
        `Encrypted private key retrieval failed for ${agentId}`,
        error
      );
      throw error;
    }
  }
}
