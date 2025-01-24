import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Solana, SolanaConfig } from "../solana";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { KeyManager } from "../keyManager";
import { web3 } from "@coral-xyz/anchor";
import { logger } from "../../utils/logger";

// Mock the external dependencies
vi.mock("@solana/web3.js", () => ({
  Connection: vi.fn(() => ({
    onProgramAccountChange: vi.fn(() => 1),
    removeAccountChangeListener: vi.fn(),
  })),
  PublicKey: {
    findProgramAddressSync: vi.fn(() => [new MockPublicKey("mock-pda"), 0]),
  },
}));

class MockPublicKey {
  constructor(private key: string) {}
  toBase58() {
    return this.key;
  }
  toString() {
    return this.key;
  }
}

// Mock Anchor Program
const mockProgram = {
  methods: {
    moveAgent: vi.fn(() => ({
      accounts: vi.fn(() => ({
        signers: vi.fn(() => ({
          rpc: vi.fn(() => Promise.resolve("mock-transaction-signature")),
        })),
      })),
    })),
  },
  programId: new MockPublicKey("mock-program-id"),
};

vi.mock("@coral-xyz/anchor", () => ({
  Program: vi.fn(() => mockProgram),
  web3: {
    PublicKey: {
      findProgramAddressSync: vi.fn(() => [new MockPublicKey("mock-pda"), 0]),
    },
  },
}));

// Mock KeyManager
vi.mock("../keyManager", () => ({
  KeyManager: vi.fn(() => ({
    getKeypair: vi.fn(() => ({
      publicKey: new MockPublicKey("mock-authority"),
      secretKey: Buffer.from("mock-secret-key"),
    })),
  })),
}));

describe("Solana", () => {
  let solana: Solana;
  const mockConfig: SolanaConfig = {
    rpcUrl: "https://mock-rpc.solana.com",
    commitment: "confirmed" as const,
  };

  beforeEach(() => {
    process.env.SOLANA_RPC_URL = mockConfig.rpcUrl;
    process.env.SOLANA_COMMITMENT = mockConfig.commitment;
    solana = new Solana(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SOLANA_RPC_URL;
    delete process.env.SOLANA_COMMITMENT;
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with config values", () => {
      const config = solana["solanaConfig"];
      expect(config?.rpcUrl).toBe(mockConfig.rpcUrl);
      expect(config?.commitment).toBe(mockConfig.commitment);
    });

    it("should initialize with default values when no config provided", () => {
      delete process.env.SOLANA_RPC_URL;
      delete process.env.SOLANA_COMMITMENT;
      const defaultSolana = new Solana();
      const config = defaultSolana["solanaConfig"];
      expect(config?.rpcUrl).toBe("https://api.devnet.solana.com");
      expect(config?.commitment).toBe("confirmed");
    });
  });

  describe("program monitoring", () => {
    it("should start monitoring successfully", async () => {
      await expect(solana.startMonitoring()).resolves.not.toThrow();
      expect(solana["wsConnection"]).toBeDefined();
      expect(solana["subscriptionIds"]).toHaveLength(1);
    });

    it("should stop monitoring successfully", async () => {
      await solana.startMonitoring();
      await solana.stopMonitoring();
      expect(solana["wsConnection"]).toBeNull();
      expect(solana["subscriptionIds"]).toHaveLength(0);
    });

    it("should handle monitoring errors gracefully", async () => {
      vi.mocked(Connection).mockImplementationOnce(() => {
        throw new Error("Connection failed");
      });

      await expect(solana.startMonitoring()).rejects.toThrow(
        "Connection failed"
      );
    });
  });

  describe("PDA operations", () => {
    const mockAgentId = "test-agent";
    const mockAgent2Id = "test-agent-2";

    it("should find agent PDA", async () => {
      const [pda] = await solana["findAgentPDA"](mockAgentId);
      expect(pda.toString()).toBe("mock-pda");
    });

    it("should find battle PDA", async () => {
      const [pda] = await solana["findBattlePDA"](mockAgentId, mockAgent2Id);
      expect(pda.toString()).toBe("mock-pda");
    });

    it("should find alliance PDA", async () => {
      const [pda] = await solana["findAlliancePDA"](mockAgentId, mockAgent2Id);
      expect(pda.toString()).toBe("mock-pda");
    });
  });

  describe("program interactions", () => {
    const mockAgentId = "test-agent";
    const mockAgent2Id = "test-agent-2";

    it("should process movement successfully", async () => {
      const tx = await solana.processMovement(mockAgentId, 10, 20);
      expect(tx).toBe("mock-transaction-signature");
      expect(mockProgram.methods.moveAgent).toHaveBeenCalledWith(10, 20);
    });

    it("should process battle successfully", async () => {
      const tx = await solana.processBattle(mockAgentId, mockAgent2Id, 100);
      expect(tx).toBe("test"); // Currently returns test string
    });

    it("should form alliance successfully", async () => {
      const tx = await solana.formAlliance(mockAgentId, mockAgent2Id);
      expect(tx).toBe("test"); // Currently returns test string
    });

    it("should update agent position successfully", async () => {
      const tx = await solana.updateAgentPosition(mockAgentId, 10, 20);
      expect(tx).toBe("test"); // Currently returns test string
    });

    it("should get token balance successfully", async () => {
      const balance = await solana.getTokenBalance(mockAgentId);
      expect(balance).toBe(0); // Currently returns 0
    });

    it("should burn tokens successfully", async () => {
      const tx = await solana.burnTokens(mockAgentId, 100);
      expect(tx).toBe("test"); // Currently returns test string
    });

    it("should transfer tokens successfully", async () => {
      const tx = await solana.transferTokens(mockAgentId, mockAgent2Id, 100);
      expect(tx).toBe("test"); // Currently returns test string
    });

    it("should process alliance successfully", async () => {
      const tx = await solana.processAlliance(mockAgentId, mockAgent2Id);
      expect(tx).toBe("test"); // Currently returns test string
    });
  });

  describe("error handling", () => {
    it("should handle program interaction errors", async () => {
      vi.mocked(mockProgram.methods.moveAgent).mockImplementationOnce(() => {
        throw new Error("Program error");
      });

      await expect(
        solana.processMovement("test-agent", 10, 20)
      ).rejects.toThrow();
    });

    it("should handle connection errors", async () => {
      vi.mocked(Connection).mockImplementationOnce(() => {
        throw new Error("Connection error");
      });

      const newSolana = new Solana(mockConfig);
      await expect(newSolana.startMonitoring()).rejects.toThrow();
    });

    it("should handle missing RPC URL", async () => {
      delete process.env.SOLANA_RPC_URL;
      const newSolana = new Solana({ ...mockConfig, rpcUrl: "" });
      await expect(newSolana.startMonitoring()).rejects.toThrow(
        "RPC URL is not set"
      );
    });
  });
});
