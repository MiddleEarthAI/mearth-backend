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
	maxRetries = 3,
	minTimeout = 1000,
	maxTimeout = 10000,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries - 1) break;

			const factor = 2 ** attempt;
			const delay = Math.min(
				maxTimeout,
				Math.max(minTimeout, minTimeout * factor * (0.5 + Math.random())),
			);

			logger.warn(
				`Attempt ${attempt + 1} failed, retrying in ${delay}ms... Error: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Retry with linear backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param delay Delay between retries in ms (default: 1000)
 */
export async function retryWithLinearBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	delay = 1000,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries - 1) break;

			logger.warn(
				`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
				error,
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Retry with custom backoff strategy
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param backoffStrategy Function that takes attempt number and returns delay in ms
 */
export async function retryWithCustomBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number,
	backoffStrategy: (attempt: number) => number,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries - 1) break;

			const delay = backoffStrategy(attempt);

			logger.warn(
				`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
				error,
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}
