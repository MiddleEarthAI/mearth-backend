import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { KeyManager } from "../keyManager";
import { Keypair } from "@solana/web3.js";
import { prisma } from "../../config/prisma";
import { mockSecurityConfig, mockKeypairData } from "./test-types";

// Mock the external dependencies
vi.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: vi.fn(() => ({
      publicKey: {
        toBase58: () => "mock-public-key",
      },
      secretKey: Buffer.from("mock-secret-key"),
    })),
    fromSecretKey: vi.fn((secretKey) => ({
      publicKey: {
        toBase58: () => "mock-public-key",
      },
      secretKey,
    })),
  },
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    agentKeypair: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      $transaction: vi.fn(
        async (callback) =>
          await callback({ agentKeypair: { upsert: vi.fn() } })
      ),
    },
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

      const result = await keyManager.getKeypair(mockAgentId);

      expect(result).toBeDefined();
      expect(result.publicKey.toBase58()).toBe("mock-public-key");
      expect(prisma.agentKeypair.findUnique).toHaveBeenCalledWith({
        where: { agentId: mockAgentId },
      });
    });

    it("should return existing keypair from database", async () => {
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        agentId: mockAgentId,
      });

      const result = await keyManager.getKeypair(mockAgentId);

      expect(result).toBeDefined();
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
      vi.mocked(prisma.agentKeypair.findUnique).mockResolvedValueOnce({
        ...mockKeypairData,
        encryptedPrivateKey: "encrypted-data",
        iv: Buffer.from("mock-iv") as unknown as Uint8Array,
        tag: Buffer.from("mock-tag") as unknown as Uint8Array,
      });

      const result = await keyManager.getEncryptedPrivateKey(mockAgentId);

      expect(result).toEqual({
        encryptedKey: "encrypted-data",
        iv: Buffer.from("mock-iv"),
        tag: Buffer.from("mock-tag"),
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
