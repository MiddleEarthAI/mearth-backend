export interface SolanaConfig {
  rpcUrl: string;
  programId: string;
  authoritySecretKey: string; // Hex-encoded secret key
  commitment: string;
}
