/**
 * Token di verifica dell'indirizzo email. Collezione: "email_verification_tokens".
 *
 * Come per il reset password (password-reset-tokens.ts): si salva solo
 * l'hash SHA-256 del token, il consumo è atomico e una nuova richiesta
 * invalida le precedenti. Il token è legato all'indirizzo per cui è stato
 * emesso: se nel frattempo l'utente cambia email, il vecchio link non
 * verifica il nuovo indirizzo. Scadenza 48 ore; indice TTL per la pulizia.
 *
 * ⚠️ Solo lato server.
 */

import { randomBytes, createHash } from "node:crypto";
import { getDb } from "./client";

const COLLECTION = "email_verification_tokens";
export const EMAIL_VERIFICATION_HOURS = 48;
/** Intervallo minimo tra due invii allo stesso utente (anti-spam). */
export const EMAIL_VERIFICATION_RESEND_SECONDS = 60;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await Promise.all([
    c.createIndex({ tokenHash: 1 }, { unique: true }),
    c.createIndex({ userId: 1, createdAt: -1 }),
    c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  indexesEnsured = true;
}

export async function createEmailVerificationToken(
  userId: string,
  email: string
): Promise<{ rawToken: string; expiresAt: Date }> {
  await ensureIndexes();
  const c = await col();
  // Un solo link valido per volta.
  await c.deleteMany({ userId, usedAt: null });

  const rawToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000);
  await c.insertOne({
    userId,
    email,
    tokenHash: hashToken(rawToken),
    createdAt: now,
    expiresAt,
    usedAt: null,
  });
  return { rawToken, expiresAt };
}

/** Secondi da attendere prima di poter chiedere un nuovo invio (0 = subito). */
export async function secondsUntilNextVerificationEmail(
  userId: string,
  now = new Date()
): Promise<number> {
  await ensureIndexes();
  const c = await col();
  const last = await c.findOne(
    { userId },
    { sort: { createdAt: -1 }, projection: { createdAt: 1 } }
  );
  if (!last) return 0;
  const elapsed = (now.getTime() - (last.createdAt as Date).getTime()) / 1000;
  return Math.max(0, Math.ceil(EMAIL_VERIFICATION_RESEND_SECONDS - elapsed));
}

/** Valida e consuma il token in un'unica operazione atomica. */
export async function consumeEmailVerificationToken(
  rawToken: string
): Promise<{ userId: string; email: string } | null> {
  if (typeof rawToken !== "string" || !/^[a-f0-9]{64}$/.test(rawToken)) return null;
  const c = await col();
  const now = new Date();
  const doc = await c.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } }
  );
  if (!doc) return null;
  return { userId: doc.userId as string, email: doc.email as string };
}
