/**
 * Retry a function with exponential backoff
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) break;

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt) * (0.5 + Math.random())
      );

      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
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
