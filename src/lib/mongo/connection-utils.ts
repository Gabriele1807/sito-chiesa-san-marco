/**
 * MongoDB Connection utilities with retry logic and optimization for Vercel serverless.
 */

import { MongoClient } from "mongodb";

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get optimized MongoDB client options for Vercel/serverless
 */
export function getOptimizedMongoOptions() {
  return {
    // Timeouts ottimizzati per Vercel cold start
    serverSelectionTimeoutMS: 60000, // 60 secondi (vs 30 default)
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,

    // Connection pool optimization for serverless
    maxPoolSize: 5, // Serverless ha limiti di connessioni
    minPoolSize: 1,
    maxIdleTimeMS: 60000,

    // Retry and resilience
    retryWrites: true,
    retryReads: true,

    // Keep-alive to avoid connection drops
    keepAlive: true,
    keepAliveInitialDelayMS: 30000,

    // Family: "ipv4" can help in some serverless environments
    // Uncomment if needed:
    // family: 4,
  };
}

/**
 * Connect to MongoDB with exponential backoff retry
 */
export async function connectWithRetry(
  uri: string,
  config: Partial<RetryConfig> = {}
): Promise<MongoClient> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const mongoOptions = getOptimizedMongoOptions();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      console.log(
        `[MongoDB] Connection attempt ${attempt}/${retryConfig.maxAttempts}...`
      );

      const client = new MongoClient(uri, mongoOptions);
      const startTime = Date.now();

      // Connect with a reasonable timeout.
      // If the timeout rejects first, attach a catch to client.connect()
      // so the later internal rejection does not become unhandled.
      const connectPromise = client.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout exceeded")),
          retryConfig.maxDelayMs * 1.5
        )
      );

      try {
        await Promise.race([connectPromise, timeoutPromise]);
      } catch (error) {
        connectPromise.catch(() => {
          /* suppress late connection rejection after timeout */
        });
        await client.close().catch(() => {
          /* ignore close errors */
        });
        throw error;
      }

      const connectionTime = Date.now() - startTime;
      console.log(
        `[MongoDB] ✓ Connected successfully in ${connectionTime}ms (attempt ${attempt})`
      );

      return client;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[MongoDB] ✗ Connection attempt ${attempt} failed: ${lastError.message}`
      );

      if (attempt < retryConfig.maxAttempts) {
        // Calculate exponential backoff delay
        const delayMs = Math.min(
          retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelayMs
        );

        console.log(
          `[MongoDB] Retrying in ${delayMs}ms (exponential backoff)...`
        );
        await sleep(delayMs);
      }
    }
  }

  // All attempts failed
  const finalError = new Error(
    `[MongoDB] Failed to connect after ${retryConfig.maxAttempts} attempts. ` +
    `Last error: ${lastError?.message || "Unknown error"}`
  );

  console.error(finalError.message);
  throw finalError;
}

/**
 * Health check: verify MongoDB connection is alive
 */
export async function healthCheckConnection(client: MongoClient): Promise<boolean> {
  try {
    // Use admin database for health check
    const adminDb = client.db("admin");
    const result = await adminDb.command({ ping: 1 });
    return result.ok === 1;
  } catch (error) {
    console.error(
      `[MongoDB] Health check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}
