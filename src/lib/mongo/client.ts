/**
 * MongoDB client singleton for server-side usage.
 * Uses the official MongoDB Node.js driver with connection pooling.
 *
 * ⚠️ NON importare in codice client / "use client".
 */

import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "chiesa_san_marco";

if (!MONGODB_URI) {
  throw new Error(
    "Variabile d'ambiente MONGODB_URI mancante. " +
    "Configura MONGODB_URI in .env.local (es. mongodb+srv://...)"
  );
}

// Singleton pattern per evitare connessioni multiple in dev (HMR)
const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalForMongo._mongoClientPromise = client.connect();
    globalForMongo._mongoClient = client;
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export { clientPromise };

/**
 * Ritorna il database MongoDB configurato.
 */
export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(MONGODB_DB);
}
