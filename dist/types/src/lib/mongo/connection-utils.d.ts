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
/**
 * Get optimized MongoDB client options for Vercel/serverless
 */
export declare function getOptimizedMongoOptions(): {
    serverSelectionTimeoutMS: number;
    connectTimeoutMS: number;
    socketTimeoutMS: number;
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTimeMS: number;
    retryWrites: boolean;
    retryReads: boolean;
};
/**
 * Connect to MongoDB with exponential backoff retry
 */
export declare function connectWithRetry(uri: string, config?: Partial<RetryConfig>): Promise<MongoClient>;
/**
 * Health check: verify MongoDB connection is alive
 */
export declare function healthCheckConnection(client: MongoClient): Promise<boolean>;
export {};
