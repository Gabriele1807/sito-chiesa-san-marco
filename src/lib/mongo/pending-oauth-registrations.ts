/**
 * Registrazioni provvisorie tramite provider esterno, in attesa del quiz.
 * Collezione: "pending_oauth_registrations". Indice TTL su expiresAt (24h):
 * pulizia automatica delle registrazioni abbandonate — vedi design spec §2.2.
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import type { OAuthProvider } from "./oauth-identities";
import { ObjectId, type WithId, type Document } from "mongodb";

const COLLECTION = "pending_oauth_registrations";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface PendingOAuthRegistration {
  _id: string;
  provider: OAuthProvider;
  providerAccountId: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  nome?: string;
  cognome?: string;
  pictureUrl?: string;
  createdAt: string;
  expiresAt: Date;
}

function toPending(doc: WithId<Document>): PendingOAuthRegistration {
  const { _id, ...rest } = doc;
  return { ...(rest as Omit<PendingOAuthRegistration, "_id">), _id: _id.toString() };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

export async function ensurePendingOAuthIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexesEnsured = true;
}

export async function createPendingOAuthRegistration(data: {
  provider: OAuthProvider;
  providerAccountId: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  nome?: string;
  cognome?: string;
  pictureUrl?: string;
}): Promise<PendingOAuthRegistration> {
  await ensurePendingOAuthIndexes();
  const c = await col();
  const now = new Date();
  const doc = {
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    providerEmail: data.providerEmail,
    providerEmailVerified: data.providerEmailVerified,
    nome: data.nome,
    cognome: data.cognome,
    pictureUrl: data.pictureUrl,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS),
  };
  const result = await c.insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function findPendingOAuthRegistrationById(
  id: string
): Promise<PendingOAuthRegistration | null> {
  if (!ObjectId.isValid(id)) return null;
  const c = await col();
  const doc = await c.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toPending(doc);
}

export async function deletePendingOAuthRegistration(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const c = await col();
  await c.deleteOne({ _id: new ObjectId(id) });
}
