import { createDecipheriv } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../config/prisma";
import { KeyManager } from "../keyManager";
import { mockKeypairData, mockSecurityConfig } from "./test-types";

// Mock crypto operations
const mockCipher = {
  update: vi.fn(() => Buffer.from("mock-encrypted-data")),
  final: vi.fn(() => Buffer.from("mock-final")),
  getAuthTag: vi.fn(() => Buffer.from("1234567890123456")),
};

const mockDecipher = {
  setAuthTag: vi.fn(),
  update: vi.fn(() => Buffer.from("mock-secret-key")),
  final: vi.fn(() => Buffer.from([])),
};

vi.mock("crypto", () => ({
  createCipheriv: vi.fn(() => mockCipher),
  createDecipheriv: vi.fn(() => mockDecipher),
  randomBytes: vi.fn(() => Buffer.from("1234567890123456")),
  scryptSync: vi.fn(() => Buffer.from("mock-derived-key-32-bytes-long!!!")),
}));

// Mock the external dependencies
vi.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: vi.fn(() => ({
      publicKey: {
        toBase58: () => "mock-public-key",
      },
      secretKey: Buffer.from("mock-secret-key"),
    })),
    fromSecretKey: vi.fn(() => ({
      publicKey: {
        toBase58: () => "mock-public-key",
      },
      secretKey: Buffer.from("mock-secret-key"),
    })),
  },
}));

// Mock Prisma with proper transaction support
vi.mock("../../config/prisma", () => ({
  prisma: {
    agentKeypair: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      if (typeof callback === "function") {
        const result = await callback(prisma);
        return result || mockKeypairData;
      }
      return Promise.resolve(mockKeypairData);
    }),
  },
}));

describe("KeyManager", () => {
  let keyManager: KeyManager;

  beforeEach(() => {
    // Reset environment and create fresh instance
    process.env.KEYPAIR_ENCRYPTION_KEY =
      mockSecurityConfig.keypairEncryptionKey;
    keyManager = new KeyManager(mockSecurityConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.KEYPAIR_ENCRYPTION_KEY;
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize successfully with valid config", () => {
      expect(keyManager).toBeInstanceOf(KeyManager);
    });

    it("should throw error when encryption key is missing", () => {
      delete process.env.KEYPAIR_ENCRYPTION_KEY;
      expect(() => new KeyManager()).toThrow(
        "Encryption key is not configured"
      );
    });
  });

  describe("getKeypair", () => {
    const mockAgentId = "test-agent-id";

    it("should generate new keypair if none exists", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.agentKeypair.upsert).mockResolvedValueOnce(
        mockKeypairData
      );

      const result = await keyManager.getKeypair(mockAgentId);

      expect(result).toBeDefined();
      expect(result.publicKey.toBase58()).toBe("mock-public-key");
      expect(prisma.agentKeypair.findUnique).toHaveBeenCalledWith({
        where: { agentId: mockAgentId },
      });
    });

    it("should return existing keypair from database", async () => {
      const mockStoredKeypair = {
        ...mockKeypairData,
        encryptedPrivateKey: Buffer.concat([
          Buffer.from("mock-encrypted-data"),
          Buffer.from("mock-final"),
        ]).toString("hex"),
        iv: Buffer.from("1234567890123456"),
        tag: Buffer.from("1234567890123456"),
      };

      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce(
        mockStoredKeypair
      );

      const result = await keyManager.getKeypair(mockAgentId);

      expect(result).toBeDefined();
      expect(result.publicKey.toBase58()).toBe("mock-public-key");
      expect(prisma.agentKeypair.findUnique).toHaveBeenCalledWith({
        where: { agentId: mockAgentId },
      });
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(keyManager.getKeypair(mockAgentId)).rejects.toThrow();
    });
  });

  describe("rotateKeypair", () => {
    const mockAgentId = "test-agent-id";

    it("should successfully rotate keypair", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        rotatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      });

      vi.mocked(prisma.agentKeypair.upsert).mockResolvedValueOnce(
        mockKeypairData
      );

      await expect(
        keyManager.rotateKeypair(mockAgentId)
      ).resolves.not.toThrow();
    });

    it("should enforce cooldown period", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        rotatedAt: new Date(), // Just now
      });

      await expect(keyManager.rotateKeypair(mockAgentId)).rejects.toThrow(
        "Keypair rotation cooldown not elapsed"
      );
    });
  });

  describe("getPublicKey", () => {
    const mockAgentId = "test-agent-id";

    it("should return public key for existing agent", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        publicKey: "mock-public-key",
      });

      const result = await keyManager.getPublicKey(mockAgentId);
      expect(result).toBe("mock-public-key");
    });

    it("should throw error for non-existent agent", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce(null);

      await expect(keyManager.getPublicKey(mockAgentId)).rejects.toThrow(
        "No keypair found for agent"
      );
    });
  });

  describe("getEncryptedPrivateKey", () => {
    const mockAgentId = "test-agent-id";

    it("should return encrypted private key data", async () => {
      const testIv = Buffer.from("1234567890123456");
      const testTag = Buffer.from("1234567890123456");
      const testEncryptedData = Buffer.concat([
        Buffer.from("mock-encrypted-data"),
        Buffer.from("mock-final"),
      ]).toString("hex");

      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        encryptedPrivateKey: testEncryptedData,
        iv: testIv,
        tag: testTag,
      });

      const result = await keyManager.getEncryptedPrivateKey(mockAgentId);

      expect(result).toEqual({
        encryptedKey: testEncryptedData,
        iv: testIv,
        tag: testTag,
      });
    });

    it("should throw error for non-existent agent", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce(null);

      await expect(
        keyManager.getEncryptedPrivateKey(mockAgentId)
      ).rejects.toThrow("No keypair found for agent");
    });
  });
});
