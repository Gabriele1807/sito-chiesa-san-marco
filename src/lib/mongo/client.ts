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
  const promise = createClientConnection();
  globalForMongo._mongoClientPromise = promise;
  // Catena "di servizio": registra il client o azzera lo stato. Non rilancia
  // l'errore: il chiamante lo riceve già attendendo `promise`; rilanciarlo qui
  // creerebbe una seconda promise rifiutata che nessuno attende
  // (unhandledRejection, che su Node può terminare la funzione serverless).
  promise
    .then((client) => {
      globalForMongo._mongoClient = client;
    })
    .catch((err: Error) => {
      console.error("[MongoDB] Connection promise failed:", err.message);
      if (globalForMongo._mongoClientPromise === promise) resetClientState();
    });

  return promise;
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

// Connessione pigra: si apre alla prima richiesta che usa il database, non
// all'import del modulo (che avveniva anche durante `next build`, nella fase
// "Collecting page data"). La promise vive su globalThis, quindi resta
// condivisa tra hot reload in sviluppo e tra invocazioni della stessa istanza
// serverless in produzione.

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
  return getClient();
}
