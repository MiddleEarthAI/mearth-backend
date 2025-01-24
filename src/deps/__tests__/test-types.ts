import { SecurityConfig } from "../../types/config";

export const mockSecurityConfig: SecurityConfig = {
  keypairEncryptionKey: "test-encryption-key-32-chars-long!!",
  jwtSecret: "test-jwt-secret",
};

export const mockKeypairData = {
  id: "mock-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  agentId: "test-agent-id",
  publicKey: "mock-public-key",
  encryptedPrivateKey: "encrypted-data",
  iv: Buffer.from("mock-iv") as unknown as Uint8Array,
  tag: Buffer.from("mock-tag") as unknown as Uint8Array,
  rotatedAt: new Date(),
};
