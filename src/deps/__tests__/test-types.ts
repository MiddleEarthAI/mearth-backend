import { SecurityConfig } from "../../types/config";

export const mockSecurityConfig: SecurityConfig = {
  keypairEncryptionKey: "test-encryption-key-32-chars-long!!",
  jwtSecret: "test-jwt-secret",
};

// Create test buffers with proper sizes for AES-256-GCM
const testIv = Buffer.from("1234567890123456"); // 16 bytes for IV
const testTag = Buffer.from("1234567890123456"); // 16 bytes for auth tag
const mockEncryptedData = Buffer.concat([
  Buffer.from("mock-encrypted-data"),
  Buffer.from("mock-final"),
]).toString("hex");

export const mockKeypairData = {
  id: "mock-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  agentId: "test-agent-id",
  publicKey: "mock-public-key",
  encryptedPrivateKey: mockEncryptedData,
  iv: testIv as unknown as Uint8Array,
  tag: testTag as unknown as Uint8Array,
  rotatedAt: new Date(),
};
