import pRetry from "p-retry";
import { logger } from "./logger";

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param minTimeout Minimum timeout between retries in ms (default: 1000)
 * @param maxTimeout Maximum timeout between retries in ms (default: 10000)
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  minTimeout: number = 1000,
  maxTimeout: number = 10000
): Promise<T> {
  return pRetry(
    async (attempt) => {
      try {
        return await fn();
      } catch (error) {
        logger.warn(
          `Attempt ${attempt} failed, retrying... Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      }
    },
    {
      retries: maxRetries,
      minTimeout,
      maxTimeout,
      factor: 2,
      randomize: true,
      onFailedAttempt: (error) => {
        logger.error("Retry attempt failed:", {
          attemptNumber: error.attemptNumber,
          retriesLeft: error.retriesLeft,
          error: error.message,
        });
      },
    }
  );
}

/**
 * Retry with linear backoff
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) break;

      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Retry with custom backoff strategy
 */
export async function retryWithCustomBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  backoffStrategy: (attempt: number) => number
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) break;

      const delay = backoffStrategy(attempt);

      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}
