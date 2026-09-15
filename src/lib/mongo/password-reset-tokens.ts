/**
 * Token di reset password. Collezione: "password_reset_tokens".
 * Indice TTL su expiresAt: pulizia automatica — vedi design spec §4.
 * Il raw token non viene mai salvato, solo il suo hash SHA-256 (chiave di
 * lookup, non un segreto da verificare lentamente — a differenza della
 * password stessa, che usa bcrypt in src/lib/auth/password.ts).
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import { ObjectId } from "mongodb";
import { randomBytes, createHash } from "node:crypto";

const COLLECTION = "password_reset_tokens";

function expirationMinutes(): number {
  const raw = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES);
  if (!Number.isFinite(raw)) return 60;
  return Math.min(60, Math.max(5, raw));
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

export async function ensurePasswordResetTokenIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await c.createIndex({ userId: 1 });
  indexesEnsured = true;
}

export async function createPasswordResetToken(
  userId: string,
  meta?: { requestIp?: string; userAgent?: string }
): Promise<{ rawToken: string; expiresAt: Date }> {
  await ensurePasswordResetTokenIndexes();
  const c = await col();

  // Invalida eventuali token precedenti ancora attivi per lo stesso utente.
  await c.updateMany({ userId, usedAt: null }, { $set: { usedAt: new Date() } });

  const rawToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes() * 60 * 1000);

  await c.insertOne({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    usedAt: null,
    createdAt: now,
    requestIp: meta?.requestIp,
    userAgent: meta?.userAgent,
  });

  return { rawToken, expiresAt };
}

export async function findValidPasswordResetToken(
  rawToken: string
): Promise<{ _id: string; userId: string } | null> {
  const c = await col();
  const doc = await c.findOne({
    tokenHash: hashToken(rawToken),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!doc) return null;
  return { _id: doc._id.toString(), userId: doc.userId as string };
}

export async function markPasswordResetTokenUsed(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const c = await col();
  await c.updateOne({ _id: new ObjectId(id) }, { $set: { usedAt: new Date() } });
}
