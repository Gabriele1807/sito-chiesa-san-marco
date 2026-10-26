/**
 * MongoDB client singleton for server-side usage.
 * Uses the official MongoDB Node.js driver with connection pooling.
 * Optimized for Vercel serverless with retry logic and extended timeouts.
 *
 * ⚠️ NON importare in codice client / "use client".
 */
import { MongoClient, Db } from "mongodb";
/**
 * Get database with health check and reconnection if needed
 */
export declare function getDb(): Promise<Db>;
/**
 * Get client instance (for administrative tasks)
 */
export declare function getMongoClient(): Promise<MongoClient>;
