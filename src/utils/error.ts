/**
 * Base Middle Earth Error Class
 * Core error class for the Middle Earth game application
 */
export class MearthError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details: Record<string, any> = {},
    public timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to a JSON structure suitable for API responses
   */
  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        status: this.status,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }
}

// HTTP Status Code Based Errors

export class ValidationError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 401, "AUTHENTICATION_ERROR", details);
  }
}

export class AuthorizationError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 403, "AUTHORIZATION_ERROR", details);
  }
}

export class ConflictError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 409, "CONFLICT_ERROR", details);
  }
}

export class RateLimitError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 429, "RATE_LIMIT_ERROR", details);
  }
}

// Infrastructure Errors
export class DatabaseError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

export class CacheError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 500, "CACHE_ERROR", details);
  }
}

export class ExternalServiceError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", details);
  }
}

export class BlockchainError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 502, "BLOCKCHAIN_ERROR", details);
  }
}

// Game Domain Errors

export class GameLogicError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "GAME_LOGIC_ERROR", details);
  }
}

export class BattleError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "BATTLE_ERROR", details);
  }
}

export class AllianceError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "ALLIANCE_ERROR", details);
  }
}

export class MovementError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "MOVEMENT_ERROR", details);
  }
}

// Agent Domain Errors

export class AgentError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "AGENT_ERROR", details);
  }
}

export class AgentActionError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "AGENT_ACTION_ERROR", details);
  }
}

export class AgentStateError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, "AGENT_STATE_ERROR", details);
  }
}

// Twitter Integration Errors

export class TwitterError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 502, "TWITTER_ERROR", details);
  }
}

export class TwitterRateLimitError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 429, "TWITTER_RATE_LIMIT_ERROR", details);
  }
}

export class TwitterAuthError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 401, "TWITTER_AUTH_ERROR", details);
  }
}

// System Operation Errors

export class RecoveryError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 500, "RECOVERY_ERROR", details);
  }
}

export class InitializationError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 500, "INITIALIZATION_ERROR", details);
  }
}

export class ShutdownError extends MearthError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 500, "SHUTDOWN_ERROR", details);
  }
}

// Example usage:
/*
try {
  // Game operation
  if (!agent.isAlive) {
    throw new AgentStateError('Agent is not alive', {
      agentId: agent.id,
      health: agent.health,
      lastAction: agent.lastAction
    });
  }

  // Twitter operation
  if (twitterRateLimit.exceeded) {
    throw new TwitterRateLimitError('Twitter rate limit exceeded', {
      reset: twitterRateLimit.reset,
      limit: twitterRateLimit.limit,
      remaining: twitterRateLimit.remaining
    });
  }

} catch (error) {
  if (error instanceof MearthError) {
    // Handle known error types
    logger.error(error.toJSON());
    // Send error response
    res.status(error.status).json(error.toJSON());
  } else {
    // Handle unknown errors
    const internalError = new MearthError(
      'An unexpected error occurred',
      500,
      'INTERNAL_ERROR',
      { originalError: error.message }
    );
    logger.error(internalError.toJSON());
    res.status(500).json(internalError.toJSON());
  }
}
*/
