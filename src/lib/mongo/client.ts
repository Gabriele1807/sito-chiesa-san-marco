/**
 * MongoDB client singleton for server-side usage.
 * Uses the official MongoDB Node.js driver with connection pooling.
 * Optimized for Vercel serverless with retry logic and extended timeouts.
 *
 * ⚠️ NON importare in codice client / "use client".
 */

import { MongoClient, Db } from "mongodb";
import { connectWithRetry, healthCheckConnection } from "./connection-utils";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "chiesa_san_marco";

if (!MONGODB_URI) {
  throw new Error(
    "Variabile d'ambiente MONGODB_URI mancante. " +
    "Configura MONGODB_URI in .env.local (es. mongodb+srv://...)"
  );
}

const MONGODB_URI_NON_NULL: string = MONGODB_URI;

// Singleton pattern per evitare connessioni multiple in dev (HMR) e in production
const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
  _lastHealthCheck?: number;
  _isHealthy?: boolean;
};

let clientPromise: Promise<MongoClient>;

/**
 * Initialize MongoDB connection with retry logic
 */
function createClientConnection(): Promise<MongoClient> {
  return connectWithRetry(MONGODB_URI_NON_NULL, {
    maxAttempts: 4,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffFactor: 2,
  });
}

function resetClientState() {
  globalForMongo._lastHealthCheck = undefined;
  globalForMongo._isHealthy = undefined;
  globalForMongo._mongoClient = undefined;
  globalForMongo._mongoClientPromise = undefined;
}

function initializeClientPromise(): Promise<MongoClient> {
  globalForMongo._mongoClientPromise = createClientConnection();
  globalForMongo._mongoClientPromise
    .then((client) => {
      globalForMongo._mongoClient = client;
    })
    .catch((err) => {
      console.error("[MongoDB] Connection promise failed:", err.message);
      resetClientState();
      throw err;
    });

  return globalForMongo._mongoClientPromise;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    console.log("[MongoDB] Initializing MongoDB connection promise...");
    return initializeClientPromise();
  }

  return globalForMongo._mongoClientPromise;
}

async function getClient(): Promise<MongoClient> {
  return getClientPromise();
}

if (process.env.NODE_ENV === "development") {
  // In development, reuse connection via global to avoid HMR reconnections
  if (!globalForMongo._mongoClientPromise) {
    console.log("[MongoDB] Development mode: initializing connection...");
    globalForMongo._mongoClientPromise = createClientConnection();
    globalForMongo._mongoClientPromise.then((c) => {
      globalForMongo._mongoClient = c;
    }).catch((err) => {
      console.error("[MongoDB] Development connection failed:", err.message);
      // Clear promise so next attempt will retry
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  clientPromise = globalForMongo._mongoClientPromise as Promise<MongoClient>;
} else {
  // In production (including Vercel), maintain singleton connection
  if (!globalForMongo._mongoClientPromise) {
    console.log("[MongoDB] Production mode: initializing connection...");
    clientPromise = initializeClientPromise();
  } else {
    clientPromise = globalForMongo._mongoClientPromise;
  }
}

export { clientPromise };

async function closeExistingClient(): Promise<void> {
  if (globalForMongo._mongoClient) {
    try {
      await globalForMongo._mongoClient.close();
    } catch (error) {
      console.warn("[MongoDB] Error closing stale client:", error instanceof Error ? error.message : String(error));
    }
  }

  resetClientState();
}

function isConnectionFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "MongoServerSelectionError" ||
    error.message.includes("Server selection") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ETIMEDOUT") ||
    error.message.includes("Connection timeout exceeded")
  );
}

/**
 * Get database with health check and reconnection if needed
 */
export async function getDb(): Promise<Db> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const client = await getClient();

      const now = Date.now();
      if (
        !globalForMongo._lastHealthCheck ||
        now - globalForMongo._lastHealthCheck > 30000
      ) {
        globalForMongo._lastHealthCheck = now;

        const isHealthy = await healthCheckConnection(client);
        globalForMongo._isHealthy = isHealthy;

        if (!isHealthy) {
          console.warn(
            "[MongoDB] Health check failed, but continuing with existing connection"
          );
        }
      }

      return client.db(MONGODB_DB);
    } catch (error) {
      const isConnectionError = isConnectionFailure(error);
      console.error("[MongoDB] getDb attempt", attempt, "failed:", error instanceof Error ? error.message : String(error));

      if (attempt === 2 || !isConnectionError) {
        throw error;
      }

      console.warn("[MongoDB] Retrying database connection after reset...");
      await closeExistingClient();
    }
  }

  throw new Error("[MongoDB] getDb failed after retries");
}

/**
 * Get client instance (for administrative tasks)
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
