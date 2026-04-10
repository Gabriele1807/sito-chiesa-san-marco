/**
 * Sessioni utenti normali su MongoDB.
 * Collezione: "user_sessions"
 *
 * Simile alla gestione sessioni admin su Supabase, ma per utenti normali.
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import crypto from "crypto";
const COLLECTION = "user_sessions";

// Durate sessione
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000; // 24 ore
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 giorni

export interface UserSession {
  _id?: string;
  userId: string;
  sessionToken: string;
  expiresAt: string; // ISO date
  ipAddress: string;
  userAgent: string;
  createdAt: string; // ISO date
}

// --------------- Indexes ---------------

let indexesEnsured = false;

async function col() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ sessionToken: 1 }, { unique: true });
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
  await c.createIndex({ userId: 1 });
  indexesEnsured = true;
}

// --------------- Create ---------------

export async function createUserSession(
  userId: string,
  req: Request,
  rememberMe = false
): Promise<{ token: string; expiresAt: Date }> {
  await ensureIndexes();
  const c = await col();
  const token = crypto.randomUUID();
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  await c.insertOne({
    userId,
    sessionToken: token,
    expiresAt: expiresAt.toISOString(),
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
  });

  return { token, expiresAt };
}

// --------------- Validate ---------------

export async function validateUserSession(
  token: string
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const c = await col();
  const doc = await c.findOne({ sessionToken: token });
  if (!doc) return null;

  if (new Date(doc.expiresAt as string) < new Date()) {
    await c.deleteOne({ sessionToken: token });
    return null;
  }

  return { userId: doc.userId as string };
}

// --------------- Delete ---------------

export async function deleteUserSession(token: string): Promise<void> {
  const c = await col();
  await c.deleteOne({ sessionToken: token });
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const c = await col();
  await c.deleteMany({ userId });
}

// --------------- Cleanup ---------------

export async function cleanExpiredUserSessions(): Promise<void> {
  const c = await col();
  await c.deleteMany({ expiresAt: { $lt: new Date().toISOString() } });
}
