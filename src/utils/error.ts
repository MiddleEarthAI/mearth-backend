// Error types for better error handling
export enum OrchestratorErrorType {
  INITIALIZATION = "INITIALIZATION_ERROR",
  AGENT_PROCESSING = "AGENT_PROCESSING_ERROR",
  TWEET_PROCESSING = "TWEET_PROCESSING_ERROR",
  INTERACTION_PROCESSING = "INTERACTION_PROCESSING_ERROR",
  CLEANUP = "CLEANUP_ERROR",
  ACTION_EXECUTION = "ACTION_EXECUTION_ERROR",
  CACHE = "CACHE_ERROR",
  RECOVERY = "RECOVERY_ERROR",
}

export class OrchestratorError extends Error {
  constructor(
    public type: OrchestratorErrorType,
    message: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "OrchestratorError";
  }
}
