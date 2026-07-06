/**
 * Database operation wrapper with retry logic and error handling
 * for use in API routes to handle MongoDB connection failures gracefully
 */

import { MongoError } from "mongodb";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 500,
  backoffFactor: 2,
};

/**
 * Execute a database operation with automatic retry on connection errors
 *
 * @example
 * ```typescript
 * export async function GET(req: Request) {
 *   try {
 *     const result = await withDbRetry(
 *       () => db.collection("users").find({}).toArray(),
 *       { maxAttempts: 3 }
 *     );
 *     return NextResponse.json(result);
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: getErrorMessage(error) },
 *       { status: 500 }
 *     );
 *   }
 * }
 * ```
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        lastError instanceof MongoError ||
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("Server selection");

      if (!isRetryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        config.delayMs * Math.pow(config.backoffFactor, attempt - 1),
        10000 // Cap at 10s
      );

      console.warn(
        `[DB Retry] Attempt ${attempt} failed: ${lastError.message}. ` +
        `Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Database operation failed");
}

/**
 * Extract meaningful error message for client response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal MongoDB details to client
    if (error.message.includes("Server selection")) {
      return "Database connection unavailable. Please try again.";
    }
    if (error.message.includes("ECONNREFUSED")) {
      return "Cannot connect to database. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Determine if an error is a database connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error instanceof MongoError ||
    error.message.includes("Server selection") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ETIMEDOUT") ||
    error.message.includes("connect ECONNREFUSED") ||
    error.name === "MongoServerSelectionError"
  );
}

/**
 * Create a timeout wrapper for database operations
 * Ensures long-running queries don't exceed Vercel function limits
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
