# OAuth Providers (Google/Facebook) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add registration/login via Google and Facebook to the existing MongoDB-backed user auth system, keeping the mini quiz mandatory for new OAuth signups, and letting existing users link/unlink providers from their profile.

**Architecture:** Reuse `src/lib/auth/jwt.ts` (HMAC JWT), the `user_session` cookie, and `src/lib/mongo/*`. Add two new Mongo collections (`oauth_identities`, `pending_oauth_registrations`), a thin provider adapter layer built on `arctic`, six new API routes under `/api/auth/oauth/*`, and UI additions to `LoginModal`, `RegisterModal`, and `/profilo`. No new auth framework, no session model change.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB, `arctic` (new dependency), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-oauth-providers-design.md`

## Global Constraints

- Never trust the client for OAuth identity or quiz-completion state — every identity/linking decision is verified server-side from signed cookies or DB lookups (spec §3, §5).
- Never merge two accounts automatically on matching email — linking only ever happens via `(provider, providerAccountId)` (spec §2.1, §3.4).
- `unlink` must refuse to remove the last available auth method (spec §3.5).
- No secrets in the repo; new env vars only (spec §6).
- Existing `users` documents must keep working with no required migration (spec §2.3).
- UI must reuse existing semantic Tailwind tokens (`bg-surface`, `border-border`, `.eyebrow`, `font-display`) — no new hardcoded colors (spec §4).
- All new server code lives under `src/lib/oauth/` (shared logic) and `src/app/api/auth/oauth/**` (routes), following the existing `src/lib/mongo/*` / `src/lib/auth/*` split.

---

## Task 1: Install `arctic` and add OAuth env vars

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `PROJECT_CONTEXT.md` (§4.2 env var table — add the four new vars with the same note style as existing entries)

**Interfaces:**
- Produces: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` as documented env vars every later task can read via `process.env`.

- [ ] **Step 1: Install the dependency**

Run: `npm install arctic`

- [ ] **Step 2: Create `.env.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
MONGODB_URI=
MONGODB_DB=
NEXT_PUBLIC_SITE_URL=
YOUTUBE_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Login/registrazione tramite provider esterni (Google, Facebook)
# Callback da registrare sui portali provider:
#   ${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/google/callback
#   ${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/facebook/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

- [ ] **Step 3: Update `PROJECT_CONTEXT.md` §4.2**

Add the four variables to the env var code block (after `UPSTASH_REDIS_REST_TOKEN`) and a note below the existing bullet list:

```
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`
  alimentano il login/registrazione tramite provider esterni (`src/lib/oauth/*`,
  `src/app/api/auth/oauth/**`). Nessun fallback: se assenti, il rispettivo
  provider è disabilitato lato UI (vedi §7 nuova sezione autenticazione OAuth
  se presente, altrimenti PROJECT_CONTEXT.md non richiede aggiornamenti
  ulteriori per questo task).
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example PROJECT_CONTEXT.md
git commit -m "chore: add arctic dependency and OAuth env vars"
```

---

## Task 2: `oauth_identities` Mongo layer

**Files:**
- Create: `src/lib/mongo/oauth-identities.ts`
- Test: `src/lib/mongo/oauth-identities.test.ts`

**Interfaces:**
- Consumes: `getDb` from `src/lib/mongo/client.ts` (existing).
- Produces (for later tasks):
  ```ts
  export type OAuthProvider = "google" | "facebook";

  export interface OAuthIdentity {
    _id: string;
    provider: OAuthProvider;
    providerAccountId: string;
    userId: string;
    providerEmail?: string;
    providerEmailVerified?: boolean;
    linkedAt: string;
    lastLoginAt?: string;
  }

  export async function ensureOAuthIdentityIndexes(): Promise<void>;
  export async function findOAuthIdentity(provider: OAuthProvider, providerAccountId: string): Promise<OAuthIdentity | null>;
  export async function findOAuthIdentitiesByUserId(userId: string): Promise<OAuthIdentity[]>;
  export async function createOAuthIdentity(data: {
    provider: OAuthProvider;
    providerAccountId: string;
    userId: string;
    providerEmail?: string;
    providerEmailVerified?: boolean;
  }): Promise<OAuthIdentity>;
  export async function touchOAuthIdentityLogin(provider: OAuthProvider, providerAccountId: string): Promise<void>;
  export async function deleteOAuthIdentity(userId: string, provider: OAuthProvider): Promise<boolean>;
  export async function countOAuthIdentitiesByUserId(userId: string): Promise<number>;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/mongo/oauth-identities.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const findOne = vi.fn();
const find = vi.fn();
const deleteOne = vi.fn();
const createIndex = vi.fn();
const countDocuments = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({
      insertOne,
      findOne,
      find,
      deleteOne,
      createIndex,
      countDocuments,
    }),
  }),
}));

import {
  createOAuthIdentity,
  findOAuthIdentity,
  deleteOAuthIdentity,
  countOAuthIdentitiesByUserId,
} from "./oauth-identities";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("oauth-identities", () => {
  it("createOAuthIdentity inserts a document and returns it with a string _id", async () => {
    insertOne.mockResolvedValue({ insertedId: { toString: () => "id-1" } });

    const result = await createOAuthIdentity({
      provider: "google",
      providerAccountId: "g-123",
      userId: "user-1",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
    });

    expect(insertOne).toHaveBeenCalledTimes(1);
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.provider).toBe("google");
    expect(inserted.providerAccountId).toBe("g-123");
    expect(inserted.userId).toBe("user-1");
    expect(result._id).toBe("id-1");
  });

  it("findOAuthIdentity returns null when nothing matches", async () => {
    findOne.mockResolvedValue(null);
    const result = await findOAuthIdentity("google", "missing");
    expect(result).toBeNull();
    expect(findOne).toHaveBeenCalledWith({ provider: "google", providerAccountId: "missing" });
  });

  it("deleteOAuthIdentity scopes deletion to the given userId and provider", async () => {
    deleteOne.mockResolvedValue({ deletedCount: 1 });
    const result = await deleteOAuthIdentity("user-1", "facebook");
    expect(deleteOne).toHaveBeenCalledWith({ userId: "user-1", provider: "facebook" });
    expect(result).toBe(true);
  });

  it("countOAuthIdentitiesByUserId returns the count", async () => {
    countDocuments.mockResolvedValue(2);
    const result = await countOAuthIdentitiesByUserId("user-1");
    expect(countDocuments).toHaveBeenCalledWith({ userId: "user-1" });
    expect(result).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mongo/oauth-identities.test.ts`
Expected: FAIL — `./oauth-identities` module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/lib/mongo/oauth-identities.ts
/**
 * Identità esterne (Google, Facebook) collegate ad account utente.
 * Collezione: "oauth_identities"
 *
 * ⚠️ Solo lato server. Il collegamento nasce sempre da
 * (provider, providerAccountId), mai dall'email — vedi design spec §2.1.
 */

import { getDb } from "./client";
import { ObjectId, type WithId, type Document } from "mongodb";

const COLLECTION = "oauth_identities";

export type OAuthProvider = "google" | "facebook";

export interface OAuthIdentity {
  _id: string;
  provider: OAuthProvider;
  providerAccountId: string;
  userId: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  linkedAt: string;
  lastLoginAt?: string;
}

function toIdentity(doc: WithId<Document>): OAuthIdentity {
  const { _id, ...rest } = doc;
  return { ...(rest as Omit<OAuthIdentity, "_id">), _id: _id.toString() };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

export async function ensureOAuthIdentityIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
  await c.createIndex({ userId: 1 });
  indexesEnsured = true;
}

export async function findOAuthIdentity(
  provider: OAuthProvider,
  providerAccountId: string
): Promise<OAuthIdentity | null> {
  const c = await col();
  const doc = await c.findOne({ provider, providerAccountId });
  if (!doc) return null;
  return toIdentity(doc);
}

export async function findOAuthIdentitiesByUserId(userId: string): Promise<OAuthIdentity[]> {
  const c = await col();
  const docs = await c.find({ userId }).toArray();
  return docs.map(toIdentity);
}

export async function createOAuthIdentity(data: {
  provider: OAuthProvider;
  providerAccountId: string;
  userId: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
}): Promise<OAuthIdentity> {
  await ensureOAuthIdentityIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const doc = {
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    userId: data.userId,
    providerEmail: data.providerEmail,
    providerEmailVerified: data.providerEmailVerified,
    linkedAt: now,
  };
  const result = await c.insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function touchOAuthIdentityLogin(
  provider: OAuthProvider,
  providerAccountId: string
): Promise<void> {
  const c = await col();
  await c.updateOne(
    { provider, providerAccountId },
    { $set: { lastLoginAt: new Date().toISOString() } }
  );
}

export async function deleteOAuthIdentity(userId: string, provider: OAuthProvider): Promise<boolean> {
  const c = await col();
  const result = await c.deleteOne({ userId, provider });
  return result.deletedCount === 1;
}

export async function countOAuthIdentitiesByUserId(userId: string): Promise<number> {
  const c = await col();
  return c.countDocuments({ userId });
}

// Suppress unused-import lint if ObjectId isn't referenced beyond typing elsewhere.
void ObjectId;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/mongo/oauth-identities.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mongo/oauth-identities.ts src/lib/mongo/oauth-identities.test.ts
git commit -m "feat: add oauth_identities Mongo layer"
```

---

## Task 3: `pending_oauth_registrations` Mongo layer

**Files:**
- Create: `src/lib/mongo/pending-oauth-registrations.ts`
- Test: `src/lib/mongo/pending-oauth-registrations.test.ts`

**Interfaces:**
- Consumes: `getDb` (existing), `OAuthProvider` from Task 2.
- Produces:
  ```ts
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

  export async function ensurePendingOAuthIndexes(): Promise<void>;
  export async function createPendingOAuthRegistration(data: {
    provider: OAuthProvider;
    providerAccountId: string;
    providerEmail?: string;
    providerEmailVerified?: boolean;
    nome?: string;
    cognome?: string;
    pictureUrl?: string;
  }): Promise<PendingOAuthRegistration>;
  export async function findPendingOAuthRegistrationById(id: string): Promise<PendingOAuthRegistration | null>;
  export async function deletePendingOAuthRegistration(id: string): Promise<void>;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/mongo/pending-oauth-registrations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const findOne = vi.fn();
const deleteOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({ insertOne, findOne, deleteOne, createIndex }),
  }),
}));

vi.mock("mongodb", async () => {
  const actual = await vi.importActual<typeof import("mongodb")>("mongodb");
  return {
    ...actual,
    ObjectId: class {
      id: string;
      constructor(id?: string) {
        this.id = id ?? "generated";
      }
      static isValid(id: string) {
        return typeof id === "string" && id.length > 0;
      }
      toString() {
        return this.id;
      }
    },
  };
});

import {
  createPendingOAuthRegistration,
  findPendingOAuthRegistrationById,
  deletePendingOAuthRegistration,
} from "./pending-oauth-registrations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pending-oauth-registrations", () => {
  it("createPendingOAuthRegistration sets a 24h expiresAt and stores provider data", async () => {
    insertOne.mockResolvedValue({ insertedId: { toString: () => "pending-1" } });

    const before = Date.now();
    const result = await createPendingOAuthRegistration({
      provider: "google",
      providerAccountId: "g-1",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
      nome: "Mario",
      cognome: "Rossi",
    });
    const after = Date.now();

    expect(insertOne).toHaveBeenCalledTimes(1);
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.provider).toBe("google");
    expect(inserted.nome).toBe("Mario");
    const ttlMs = inserted.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
    expect(inserted.expiresAt.getTime()).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
    expect(result._id).toBe("pending-1");
  });

  it("findPendingOAuthRegistrationById returns null for an invalid id", async () => {
    const result = await findPendingOAuthRegistrationById("");
    expect(result).toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });

  it("findPendingOAuthRegistrationById looks up by _id when valid", async () => {
    findOne.mockResolvedValue({
      _id: { toString: () => "pending-1" },
      provider: "google",
      providerAccountId: "g-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: new Date(),
    });
    const result = await findPendingOAuthRegistrationById("pending-1");
    expect(result?._id).toBe("pending-1");
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("deletePendingOAuthRegistration deletes by id, ignoring invalid ids silently", async () => {
    await deletePendingOAuthRegistration("");
    expect(deleteOne).not.toHaveBeenCalled();

    await deletePendingOAuthRegistration("pending-1");
    expect(deleteOne).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mongo/pending-oauth-registrations.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/lib/mongo/pending-oauth-registrations.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/mongo/pending-oauth-registrations.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mongo/pending-oauth-registrations.ts src/lib/mongo/pending-oauth-registrations.test.ts
git commit -m "feat: add pending_oauth_registrations Mongo layer with TTL"
```

---

## Task 4: Extend `users.ts` with `hasPassword` and OAuth user creation

**Files:**
- Modify: `src/types/index.ts` (`UserProfile` — add `hasPassword?: boolean`)
- Modify: `src/lib/mongo/users.ts` (extend `createUser`, add `createOAuthUser`, add `setHasPassword`)
- Test: `src/lib/mongo/users.test.ts` (new file — no existing test for this module)

**Interfaces:**
- Consumes: `hashPassword` from `src/lib/auth/password.ts` (existing).
- Produces:
  ```ts
  export async function createUser(data: {
    email: string; username: string; passwordHash: string; nome: string; cognome: string;
    role: UserProfile["role"]; ageGroup: UserProfile["ageGroup"]; chiesa?: string; adminRequest?: boolean;
    hasPassword?: boolean; // default true, unchanged behavior for existing callers
  }): Promise<UserPublic>;

  export async function createOAuthUser(data: {
    email: string; username: string; nome: string; cognome: string;
    role: UserProfile["role"]; ageGroup: UserProfile["ageGroup"]; chiesa?: string;
  }): Promise<UserPublic>; // hasPassword:false, passwordHash = bcrypt hash of a random token

  export async function setHasPassword(id: string, value: boolean): Promise<void>;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/mongo/users.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const updateOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({ insertOne, updateOne, createIndex }),
  }),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async (pwd: string) => `hashed:${pwd}`),
}));

import { createUser, createOAuthUser, setHasPassword } from "./users";
import { hashPassword } from "@/lib/auth/password";

beforeEach(() => {
  vi.clearAllMocks();
  insertOne.mockResolvedValue({ insertedId: { toString: () => "user-1" } });
});

describe("users.ts — hasPassword handling", () => {
  it("createUser defaults hasPassword to true when not provided", async () => {
    await createUser({
      email: "a@b.com",
      username: "abuser",
      passwordHash: "already-hashed",
      nome: "A",
      cognome: "B",
      role: "credente",
      ageGroup: "19-29",
    });
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.hasPassword).toBe(true);
  });

  it("createOAuthUser creates a user with hasPassword:false and an unusable password hash", async () => {
    const result = await createOAuthUser({
      email: "oauth@b.com",
      username: "oauthuser",
      nome: "O",
      cognome: "U",
      role: "credente",
      ageGroup: "19-29",
    });

    expect(hashPassword).toHaveBeenCalledTimes(1);
    const [randomToken] = (hashPassword as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(typeof randomToken).toBe("string");
    expect(randomToken.length).toBeGreaterThanOrEqual(32);

    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.hasPassword).toBe(false);
    expect(inserted.passwordHash).toBe(`hashed:${randomToken}`);
    expect(result._id).toBe("user-1");
  });

  it("setHasPassword updates the flag for the given user id", async () => {
    await setHasPassword("user-1", true);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { hasPassword: true, updatedAt: expect.any(String) } }
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mongo/users.test.ts`
Expected: FAIL — `createOAuthUser`/`setHasPassword` not exported.

- [ ] **Step 3: Implement**

In `src/types/index.ts`, inside `UserProfile` (after `passwordHash: string;`):

```ts
  /** false per account creati solo via provider esterno (nessuna password reale impostata) */
  hasPassword?: boolean;
```

In `src/lib/mongo/users.ts`, modify `createUser` and add the two new exports (place after the existing `createUser` function):

```ts
export async function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
  nome: string;
  cognome: string;
  role: UserProfile["role"];
  ageGroup: UserProfile["ageGroup"];
  chiesa?: string;
  adminRequest?: boolean;
  hasPassword?: boolean;
}): Promise<UserPublic> {
  await ensureIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const doc: Omit<UserProfile, "_id"> = {
    email: data.email,
    username: data.username,
    passwordHash: data.passwordHash,
    nome: data.nome,
    cognome: data.cognome,
    role: data.role,
    ageGroup: data.ageGroup,
    chiesa: data.chiesa,
    attivo: true,
    emailVerificata: false,
    hasPassword: data.hasPassword ?? true,
    adminRequest: data.adminRequest ? "pending" : "none",
    adminRequestDate: data.adminRequest ? now : undefined,
    superAdminRequest: "none",
    createdAt: now,
    updatedAt: now,
  };
  const result = await c.insertOne(doc);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...pub } = doc;
  return { ...pub, _id: result.insertedId.toString() } as UserPublic;
}

/**
 * Crea un utente registrato solo tramite provider esterno. Nessuna password
 * reale è utilizzabile: passwordHash è l'hash di un token casuale che nessuna
 * password inserita da un utente potrà mai produrre.
 */
export async function createOAuthUser(data: {
  email: string;
  username: string;
  nome: string;
  cognome: string;
  role: UserProfile["role"];
  ageGroup: UserProfile["ageGroup"];
  chiesa?: string;
}): Promise<UserPublic> {
  const { hashPassword } = await import("@/lib/auth/password");
  const randomToken =
    globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID();
  const passwordHash = await hashPassword(randomToken);
  return createUser({
    ...data,
    passwordHash,
    hasPassword: false,
  });
}

export async function setHasPassword(id: string, value: boolean): Promise<void> {
  const c = await col();
  if (!ObjectId.isValid(id)) return;
  await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { hasPassword: value, updatedAt: new Date().toISOString() } }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/mongo/users.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `npx vitest run`
Expected: all existing tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/mongo/users.ts src/lib/mongo/users.test.ts
git commit -m "feat: add hasPassword field and OAuth user creation to users.ts"
```

---

## Task 5: OAuth flow cookies (`oauth_flow`, `oauth_pending`)

**Files:**
- Create: `src/lib/oauth/flow-cookie.ts`
- Test: `src/lib/oauth/flow-cookie.test.ts`

**Interfaces:**
- Consumes: `signJwt`, `verifyJwt` from `src/lib/auth/jwt.ts` (existing).
- Produces:
  ```ts
  export type OAuthIntent = "login" | "register" | "link";

  export interface OAuthFlowPayload {
    state: string;
    provider: "google" | "facebook";
    intent: OAuthIntent;
    returnTo: string;
    codeVerifier?: string;
    linkedSessionHash?: string; // present only when intent === "link"
  }

  export async function signOAuthFlowCookie(payload: OAuthFlowPayload): Promise<string>;
  export async function verifyOAuthFlowCookie(token: string): Promise<OAuthFlowPayload | null>;

  export async function signOAuthPendingCookie(pendingId: string): Promise<string>;
  export async function verifyOAuthPendingCookie(token: string): Promise<{ pendingId: string } | null>;

  export function hashSessionToken(token: string): Promise<string>; // SHA-256 hex, for linkedSessionHash
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/oauth/flow-cookie.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import {
  signOAuthFlowCookie,
  verifyOAuthFlowCookie,
  signOAuthPendingCookie,
  verifyOAuthPendingCookie,
  hashSessionToken,
} from "./flow-cookie";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
});

describe("oauth flow cookie", () => {
  it("round-trips a login-intent payload", async () => {
    const token = await signOAuthFlowCookie({
      state: "abc123",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    const payload = await verifyOAuthFlowCookie(token);
    expect(payload?.state).toBe("abc123");
    expect(payload?.provider).toBe("google");
    expect(payload?.intent).toBe("login");
  });

  it("round-trips a link-intent payload with a session hash", async () => {
    const hash = await hashSessionToken("some-session-jwt");
    const token = await signOAuthFlowCookie({
      state: "xyz",
      provider: "facebook",
      intent: "link",
      returnTo: "/profilo",
      linkedSessionHash: hash,
    });
    const payload = await verifyOAuthFlowCookie(token);
    expect(payload?.intent).toBe("link");
    expect(payload?.linkedSessionHash).toBe(hash);
  });

  it("rejects a tampered flow cookie", async () => {
    const token = await signOAuthFlowCookie({
      state: "abc",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifyOAuthFlowCookie(tampered)).toBeNull();
  });

  it("round-trips a pending cookie", async () => {
    const token = await signOAuthPendingCookie("pending-1");
    const payload = await verifyOAuthPendingCookie(token);
    expect(payload?.pendingId).toBe("pending-1");
  });

  it("hashSessionToken is deterministic for the same input", async () => {
    const a = await hashSessionToken("same-token");
    const b = await hashSessionToken("same-token");
    expect(a).toBe(b);
    expect(a).not.toBe("same-token");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/oauth/flow-cookie.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/lib/oauth/flow-cookie.ts
/**
 * Cookie firmati per il flusso OAuth: `oauth_flow` (state/PKCE, 10 minuti,
 * cancellato dopo un solo uso) e `oauth_pending` (identità in attesa del
 * quiz, 30 minuti). Riusa signJwt/verifyJwt — nessun secondo sistema di
 * firma. Vedi design spec §3.1, §3.3.
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

export type OAuthIntent = "login" | "register" | "link";

export interface OAuthFlowPayload {
  state: string;
  provider: "google" | "facebook";
  intent: OAuthIntent;
  returnTo: string;
  codeVerifier?: string;
  linkedSessionHash?: string;
}

const FLOW_TTL_SECONDS = 10 * 60;
const PENDING_TTL_SECONDS = 30 * 60;

export async function signOAuthFlowCookie(payload: OAuthFlowPayload): Promise<string> {
  return signJwt(
    { sub: "oauth_flow", sessionType: "oauth_flow", ...payload },
    FLOW_TTL_SECONDS
  );
}

export async function verifyOAuthFlowCookie(token: string): Promise<OAuthFlowPayload | null> {
  const payload = await verifyJwt<OAuthFlowPayload & { sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "oauth_flow") return null;
  const { state, provider, intent, returnTo, codeVerifier, linkedSessionHash } = payload;
  if (!state || !provider || !intent || !returnTo) return null;
  return { state, provider, intent, returnTo, codeVerifier, linkedSessionHash };
}

export async function signOAuthPendingCookie(pendingId: string): Promise<string> {
  return signJwt(
    { sub: pendingId, sessionType: "oauth_pending" },
    PENDING_TTL_SECONDS
  );
}

export async function verifyOAuthPendingCookie(
  token: string
): Promise<{ pendingId: string } | null> {
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "oauth_pending" || !payload.sub) return null;
  return { pendingId: payload.sub };
}

export async function hashSessionToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/oauth/flow-cookie.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/oauth/flow-cookie.ts src/lib/oauth/flow-cookie.test.ts
git commit -m "feat: add signed OAuth flow/pending cookies"
```

---

## Task 6: Provider adapters (Google, Facebook) via `arctic`

**Files:**
- Create: `src/lib/oauth/providers.ts`
- Test: `src/lib/oauth/providers.test.ts`

**Interfaces:**
- Consumes: `arctic` (`Google`, `Facebook`, `generateState`, `generateCodeVerifier`, `decodeIdToken` — from Task 1's dependency).
- Produces:
  ```ts
  export interface OAuthProfile {
    providerAccountId: string;
    email?: string;
    emailVerified?: boolean;
    givenName?: string;
    familyName?: string;
    pictureUrl?: string;
  }

  export interface ProviderAdapter {
    createAuthorizationURL(state: string, codeVerifier?: string): URL;
    usesPkce: boolean;
    validateCallback(code: string, codeVerifier?: string): Promise<OAuthProfile>;
  }

  export function getProviderAdapter(provider: "google" | "facebook"): ProviderAdapter | null; // null if env vars missing
  export const SUPPORTED_PROVIDERS: readonly ["google", "facebook"];
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/oauth/providers.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getProviderAdapter, SUPPORTED_PROVIDERS } from "./providers";

describe("provider adapters", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("exposes exactly google and facebook as supported providers", () => {
    expect(SUPPORTED_PROVIDERS).toEqual(["google", "facebook"]);
  });

  it("returns null for google when env vars are missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(getProviderAdapter("google")).toBeNull();
  });

  it("returns an adapter for google when env vars are present", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    const adapter = getProviderAdapter("google");
    expect(adapter).not.toBeNull();
    expect(adapter?.usesPkce).toBe(true);
    const url = adapter!.createAuthorizationURL("state-value", "verifier-value");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("returns an adapter for facebook when env vars are present, without PKCE", () => {
    process.env.FACEBOOK_CLIENT_ID = "fb-id";
    process.env.FACEBOOK_CLIENT_SECRET = "fb-secret";
    const adapter = getProviderAdapter("facebook");
    expect(adapter).not.toBeNull();
    expect(adapter?.usesPkce).toBe(false);
    const url = adapter!.createAuthorizationURL("state-value");
    expect(url.searchParams.get("state")).toBe("state-value");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/oauth/providers.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/lib/oauth/providers.ts
/**
 * Adapter per i provider OAuth supportati, costruiti su `arctic`. Apple non
 * è nella whitelist attiva finché non implementato — vedi design spec §8.
 */

import { Google, Facebook, decodeIdToken } from "arctic";

export const SUPPORTED_PROVIDERS = ["google", "facebook"] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface OAuthProfile {
  providerAccountId: string;
  email?: string;
  emailVerified?: boolean;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
}

export interface ProviderAdapter {
  usesPkce: boolean;
  createAuthorizationURL(state: string, codeVerifier?: string): URL;
  validateCallback(code: string, codeVerifier?: string): Promise<OAuthProfile>;
}

function callbackUrl(provider: SupportedProvider): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/auth/oauth/${provider}/callback`;
}

function buildGoogleAdapter(): ProviderAdapter | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const google = new Google(clientId, clientSecret, callbackUrl("google"));

  return {
    usesPkce: true,
    createAuthorizationURL(state, codeVerifier) {
      return google.createAuthorizationURL(state, codeVerifier ?? "", [
        "openid",
        "email",
        "profile",
      ]);
    },
    async validateCallback(code, codeVerifier) {
      const tokens = await google.validateAuthorizationCode(code, codeVerifier ?? "");
      const claims = decodeIdToken(tokens.idToken()) as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      return {
        providerAccountId: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified,
        givenName: claims.given_name,
        familyName: claims.family_name,
        pictureUrl: claims.picture,
      };
    },
  };
}

function buildFacebookAdapter(): ProviderAdapter | null {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const facebook = new Facebook(clientId, clientSecret, callbackUrl("facebook"));

  return {
    usesPkce: false,
    createAuthorizationURL(state) {
      return facebook.createAuthorizationURL(state, ["email", "public_profile"]);
    },
    async validateCallback(code) {
      const tokens = await facebook.validateAuthorizationCode(code);
      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${encodeURIComponent(
          tokens.accessToken()
        )}`
      );
      if (!res.ok) {
        throw new Error("Impossibile recuperare il profilo Facebook");
      }
      const data = (await res.json()) as {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        picture?: { data?: { url?: string } };
      };
      return {
        providerAccountId: data.id,
        email: data.email,
        // Facebook restituisce solo email verificate tramite Graph API.
        emailVerified: Boolean(data.email),
        givenName: data.first_name,
        familyName: data.last_name,
        pictureUrl: data.picture?.data?.url,
      };
    },
  };
}

export function getProviderAdapter(provider: SupportedProvider): ProviderAdapter | null {
  if (provider === "google") return buildGoogleAdapter();
  if (provider === "facebook") return buildFacebookAdapter();
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/oauth/providers.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/oauth/providers.ts src/lib/oauth/providers.test.ts
git commit -m "feat: add Google/Facebook provider adapters via arctic"
```

---

## Task 7: `GET /api/auth/oauth/[provider]/start`

**Files:**
- Create: `src/app/api/auth/oauth/[provider]/start/route.ts`
- Test: `src/app/api/auth/oauth/[provider]/start/route.test.ts`

**Interfaces:**
- Consumes: `getProviderAdapter`, `SUPPORTED_PROVIDERS` (Task 6); `signOAuthFlowCookie`, `hashSessionToken` (Task 5); `getClientIp`, `isIpRateLimited`, `recordIpRequest` (existing `rate-limit.ts`); `validateUserSession` (existing `sessions.ts`, for `intent=link`).
- Produces: sets cookie `oauth_flow`; redirects (302) to the provider's authorization URL, or to `/?oauthError=<code>` on failure. Reads `?intent=login|register|link&returnTo=<path>` (default `intent=login`, `returnTo=/`).

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/auth/oauth/[provider]/start/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn().mockResolvedValue(false),
  recordIpRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/oauth/providers", () => ({
  getProviderAdapter: vi.fn(),
  SUPPORTED_PROVIDERS: ["google", "facebook"],
}));

vi.mock("@/lib/mongo/sessions", () => ({
  validateUserSession: vi.fn(),
}));

import { GET } from "./route";
import { getProviderAdapter } from "@/lib/oauth/providers";
import { validateUserSession } from "@/lib/mongo/sessions";

beforeEach(() => {
  vi.clearAllMocks();
});

function req(url: string, cookie = "") {
  return new Request(url, { headers: cookie ? { cookie } : {} });
}

describe("GET /api/auth/oauth/[provider]/start", () => {
  it("returns 404 for an unsupported provider", async () => {
    const res = await GET(req("https://example.org/api/auth/oauth/apple/start"), {
      params: Promise.resolve({ provider: "apple" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 503 when the provider adapter is unavailable (missing env vars)", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const res = await GET(req("https://example.org/api/auth/oauth/google/start"), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(res.status).toBe(503);
  });

  it("returns 401 for intent=link without a valid session", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: () => new URL("https://accounts.google.com/authorize"),
    });
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(
      req("https://example.org/api/auth/oauth/google/start?intent=link"),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(401);
  });

  it("redirects to the provider authorization URL and sets the oauth_flow cookie for intent=login", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    const res = await GET(req("https://example.org/api/auth/oauth/google/start"), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("accounts.google.com");
    expect(res.headers.get("set-cookie")).toContain("oauth_flow=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "src/app/api/auth/oauth/[provider]/start/route.test.ts"`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/app/api/auth/oauth/[provider]/start/route.ts
import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier } from "arctic";
import { getProviderAdapter, SUPPORTED_PROVIDERS, type SupportedProvider } from "@/lib/oauth/providers";
import { signOAuthFlowCookie, hashSessionToken, type OAuthIntent } from "@/lib/oauth/flow-cookie";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { validateUserSession } from "@/lib/mongo/sessions";

function isSupportedProvider(value: string): value is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ success: false, error: "Provider non supportato" }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Troppe richieste" }, { status: 429 });
  }
  await recordIpRequest(ip);

  const adapter = getProviderAdapter(provider);
  if (!adapter) {
    return NextResponse.json(
      { success: false, error: "Provider non configurato" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const intentParam = url.searchParams.get("intent");
  const intent: OAuthIntent =
    intentParam === "link" || intentParam === "register" ? intentParam : "login";
  const returnTo = url.searchParams.get("returnTo") || (intent === "link" ? "/profilo" : "/");

  let linkedSessionHash: string | undefined;
  if (intent === "link") {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
    const sessionToken = match?.[1];
    const session = sessionToken ? await validateUserSession(decodeURIComponent(sessionToken)) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
    }
    linkedSessionHash = await hashSessionToken(sessionToken!);
  }

  const state = generateState();
  const codeVerifier = adapter.usesPkce ? generateCodeVerifier() : undefined;
  const authUrl = adapter.createAuthorizationURL(state, codeVerifier);

  const flowCookie = await signOAuthFlowCookie({
    state,
    provider,
    intent,
    returnTo,
    codeVerifier,
    linkedSessionHash,
  });

  const response = NextResponse.redirect(authUrl, { status: 307 });
  response.cookies.set("oauth_flow", flowCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "src/app/api/auth/oauth/[provider]/start/route.test.ts"`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/auth/oauth/[provider]/start/route.ts" "src/app/api/auth/oauth/[provider]/start/route.test.ts"
git commit -m "feat: add OAuth start route"
```

---

## Task 8: `GET /api/auth/oauth/[provider]/callback`

**Files:**
- Create: `src/app/api/auth/oauth/[provider]/callback/route.ts`
- Test: `src/app/api/auth/oauth/[provider]/callback/route.test.ts`

**Interfaces:**
- Consumes: `verifyOAuthFlowCookie`, `hashSessionToken`, `signOAuthPendingCookie` (Task 5); `getProviderAdapter` (Task 6); `findOAuthIdentity`, `createOAuthIdentity`, `touchOAuthIdentityLogin` (Task 2); `createPendingOAuthRegistration` (Task 3); `findUserById`, `findUserByIdFull`, `updateUserLastAccess` (existing `users.ts`); `createUserSession` (existing `sessions.ts`).
- Produces: sets `user_session` cookie on successful login/link, or `oauth_pending` cookie + redirect to `/?completeRegistration=1` on new-identity register/login, or redirects to `${returnTo}?oauthError=<code>` on any failure. Clears `oauth_flow` cookie always.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/auth/oauth/[provider]/callback/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/oauth/flow-cookie", () => ({
  verifyOAuthFlowCookie: vi.fn(),
  hashSessionToken: vi.fn(async (v: string) => `hash:${v}`),
  signOAuthPendingCookie: vi.fn(async (id: string) => `pending-token:${id}`),
}));
vi.mock("@/lib/oauth/providers", () => ({
  getProviderAdapter: vi.fn(),
  SUPPORTED_PROVIDERS: ["google", "facebook"],
}));
vi.mock("@/lib/mongo/oauth-identities", () => ({
  findOAuthIdentity: vi.fn(),
  createOAuthIdentity: vi.fn(),
  touchOAuthIdentityLogin: vi.fn(),
}));
vi.mock("@/lib/mongo/pending-oauth-registrations", () => ({
  createPendingOAuthRegistration: vi.fn(async () => ({ _id: "pending-1" })),
}));
vi.mock("@/lib/mongo/users", () => ({
  findUserById: vi.fn(),
  updateUserLastAccess: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({
  createUserSession: vi.fn(async () => ({ token: "session-token", expiresAt: new Date(Date.now() + 1000) })),
}));

import { GET } from "./route";
import { verifyOAuthFlowCookie } from "@/lib/oauth/flow-cookie";
import { getProviderAdapter } from "@/lib/oauth/providers";
import { findOAuthIdentity, createOAuthIdentity } from "@/lib/mongo/oauth-identities";
import { createPendingOAuthRegistration } from "@/lib/mongo/pending-oauth-registrations";
import { findUserById } from "@/lib/mongo/users";

beforeEach(() => vi.clearAllMocks());

function req(url: string, cookie = "oauth_flow=flow-token") {
  return new Request(url, { headers: { cookie } });
}

describe("GET /api/auth/oauth/[provider]/callback", () => {
  it("redirects with oauthError when the state cookie is missing or invalid", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(req("https://example.org/api/auth/oauth/google/callback?state=x&code=y"), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("oauthError=");
  });

  it("redirects with oauthError when the query state does not match the cookie state", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue({
      state: "expected-state",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    const res = await GET(
      req("https://example.org/api/auth/oauth/google/callback?state=wrong-state&code=y"),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("oauthError=");
  });

  it("logs in directly when the identity is already linked (intent=login)", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue({
      state: "s",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      validateCallback: vi.fn(async () => ({ providerAccountId: "g-1", email: "a@b.com" })),
    });
    (findOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "id-1",
      provider: "google",
      providerAccountId: "g-1",
      userId: "user-1",
      linkedAt: "now",
    });
    (findUserById as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", attivo: true });

    const res = await GET(req("https://example.org/api/auth/oauth/google/callback?state=s&code=c"), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).not.toContain("oauthError");
    expect(res.headers.get("set-cookie")).toContain("user_session=");
  });

  it("creates a pending registration and redirects to completeRegistration when the identity is new (intent=register)", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue({
      state: "s",
      provider: "google",
      intent: "register",
      returnTo: "/",
    });
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      validateCallback: vi.fn(async () => ({
        providerAccountId: "g-new",
        email: "new@b.com",
        emailVerified: true,
        givenName: "Mario",
        familyName: "Rossi",
      })),
    });
    (findOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(req("https://example.org/api/auth/oauth/google/callback?state=s&code=c"), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(createPendingOAuthRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google", providerAccountId: "g-new", nome: "Mario" })
    );
    expect(createOAuthIdentity).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("completeRegistration=1");
    expect(res.headers.get("set-cookie")).toContain("oauth_pending=");
  });

  it("links the identity to the current session's user for intent=link without creating a new user", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue({
      state: "s",
      provider: "google",
      intent: "link",
      returnTo: "/profilo",
      linkedSessionHash: "hash:session-token",
    });
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      validateCallback: vi.fn(async () => ({ providerAccountId: "g-link", email: "l@b.com" })),
    });
    (findOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(
      req(
        "https://example.org/api/auth/oauth/google/callback?state=s&code=c",
        "oauth_flow=flow-token; user_session=session-token"
      ),
      { params: Promise.resolve({ provider: "google" }) }
    );

    expect(createOAuthIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google", providerAccountId: "g-link" })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/profilo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "src/app/api/auth/oauth/[provider]/callback/route.test.ts"`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/app/api/auth/oauth/[provider]/callback/route.ts
import { NextResponse } from "next/server";
import { getProviderAdapter, SUPPORTED_PROVIDERS, type SupportedProvider } from "@/lib/oauth/providers";
import { verifyOAuthFlowCookie, hashSessionToken, signOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import {
  findOAuthIdentity,
  createOAuthIdentity,
  touchOAuthIdentityLogin,
} from "@/lib/mongo/oauth-identities";
import { createPendingOAuthRegistration } from "@/lib/mongo/pending-oauth-registrations";
import { findUserById, updateUserLastAccess } from "@/lib/mongo/users";
import { createUserSession } from "@/lib/mongo/sessions";

function isSupportedProvider(value: string): value is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

function errorRedirect(base: string, returnTo: string, code: string) {
  const url = new URL(returnTo, base);
  url.searchParams.set("oauthError", code);
  const res = NextResponse.redirect(url, { status: 307 });
  res.cookies.delete("oauth_flow");
  return res;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (!isSupportedProvider(provider)) {
    return errorRedirect(siteBase, "/", "unsupported_provider");
  }

  const url = new URL(request.url);
  const queryState = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const flowMatch = cookieHeader.match(/(?:^|;\s*)oauth_flow=([^;]+)/);
  const flowToken = flowMatch?.[1] ? decodeURIComponent(flowMatch[1]) : "";
  const flow = flowToken ? await verifyOAuthFlowCookie(flowToken) : null;

  if (!flow || flow.provider !== provider) {
    return errorRedirect(siteBase, "/", "invalid_state");
  }
  if (!queryState || queryState !== flow.state) {
    return errorRedirect(siteBase, flow.returnTo, "invalid_state");
  }
  if (!code) {
    // L'utente ha annullato o il provider non ha restituito un code.
    return errorRedirect(siteBase, flow.returnTo, "access_denied");
  }

  const adapter = getProviderAdapter(provider);
  if (!adapter) {
    return errorRedirect(siteBase, flow.returnTo, "provider_unavailable");
  }

  let profile;
  try {
    profile = await adapter.validateCallback(code, flow.codeVerifier);
  } catch {
    return errorRedirect(siteBase, flow.returnTo, "provider_error");
  }

  const existing = await findOAuthIdentity(provider, profile.providerAccountId);

  // --- intent = link ---
  if (flow.intent === "link") {
    const sessionMatch = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
    const sessionToken = sessionMatch?.[1] ? decodeURIComponent(sessionMatch[1]) : "";
    const currentHash = sessionToken ? await hashSessionToken(sessionToken) : "";
    if (!sessionToken || currentHash !== flow.linkedSessionHash) {
      return errorRedirect(siteBase, "/profilo", "session_expired");
    }
    if (existing) {
      const sameUser = existing.userId === (await resolveUserIdFromSession(sessionToken));
      return errorRedirect(siteBase, "/profilo", sameUser ? "already_linked" : "identity_taken");
    }
    const userId = await resolveUserIdFromSession(sessionToken);
    if (!userId) {
      return errorRedirect(siteBase, "/profilo", "session_expired");
    }
    await createOAuthIdentity({
      provider,
      providerAccountId: profile.providerAccountId,
      userId,
      providerEmail: profile.email,
      providerEmailVerified: profile.emailVerified,
    });
    return successRedirect(siteBase, "/profilo", { linked: provider });
  }

  // --- intent = login | register, identity already linked ---
  if (existing) {
    const user = await findUserById(existing.userId);
    if (!user || !user.attivo) {
      return errorRedirect(siteBase, flow.returnTo, "account_disabled");
    }
    await touchOAuthIdentityLogin(provider, profile.providerAccountId);
    await updateUserLastAccess(existing.userId);
    const { token, expiresAt } = await createUserSession(existing.userId, request, false);
    const res = successRedirect(siteBase, flow.returnTo, {});
    res.cookies.set("user_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return res;
  }

  // --- intent = login | register, brand-new identity: provisional registration ---
  const pending = await createPendingOAuthRegistration({
    provider,
    providerAccountId: profile.providerAccountId,
    providerEmail: profile.email,
    providerEmailVerified: profile.emailVerified,
    nome: profile.givenName,
    cognome: profile.familyName,
    pictureUrl: profile.pictureUrl,
  });
  const pendingCookie = await signOAuthPendingCookie(pending._id);
  const res = successRedirect(siteBase, "/", { completeRegistration: "1" });
  res.cookies.set("oauth_pending", pendingCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return res;
}

function successRedirect(base: string, returnTo: string, params: Record<string, string>) {
  const url = new URL(returnTo, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = NextResponse.redirect(url, { status: 307 });
  res.cookies.delete("oauth_flow");
  return res;
}

async function resolveUserIdFromSession(sessionToken: string): Promise<string | null> {
  const { validateUserSession } = await import("@/lib/mongo/sessions");
  const session = await validateUserSession(sessionToken);
  return session?.userId ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "src/app/api/auth/oauth/[provider]/callback/route.test.ts"`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/auth/oauth/[provider]/callback/route.ts" "src/app/api/auth/oauth/[provider]/callback/route.test.ts"
git commit -m "feat: add OAuth callback route (login, register, link)"
```

---

## Task 9: `GET /api/auth/oauth/pending` and `POST /api/auth/oauth/complete-registration`

**Files:**
- Create: `src/app/api/auth/oauth/pending/route.ts`
- Create: `src/app/api/auth/oauth/complete-registration/route.ts`
- Test: `src/app/api/auth/oauth/pending/route.test.ts`
- Test: `src/app/api/auth/oauth/complete-registration/route.test.ts`

**Interfaces:**
- Consumes: `verifyOAuthPendingCookie` (Task 5); `findPendingOAuthRegistrationById`, `deletePendingOAuthRegistration` (Task 3); `findUserByEmail`, `createOAuthUser` (Task 4/existing); `createOAuthIdentity` (Task 2); `createUserSession` (existing).
- Produces: `pending` returns `{ success: true, pending: { provider, nome?, cognome?, providerEmail?, providerEmailVerified? } }` or 401. `complete-registration` accepts `{ role, ageGroup, chiesa?, email? }`, returns `{ success: true, user }` (201) with `user_session` cookie set and `oauth_pending` cleared, or 400/401/409 with the same error-string conventions as `/api/auth/register` (spec §3.4) so `RegisterModal`'s existing `errorMap` keeps working.

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/api/auth/oauth/pending/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/oauth/flow-cookie", () => ({
  verifyOAuthPendingCookie: vi.fn(),
}));
vi.mock("@/lib/mongo/pending-oauth-registrations", () => ({
  findPendingOAuthRegistrationById: vi.fn(),
}));

import { GET } from "./route";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import { findPendingOAuthRegistrationById } from "@/lib/mongo/pending-oauth-registrations";

beforeEach(() => vi.clearAllMocks());

function req(cookie = "") {
  return new Request("https://example.org/api/auth/oauth/pending", {
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /api/auth/oauth/pending", () => {
  it("returns 401 when there is no oauth_pending cookie", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the cookie is invalid or the pending doc is gone", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(req("oauth_pending=token"));
    expect(res.status).toBe(401);
  });

  it("returns non-sensitive pending data when valid", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "p1",
      provider: "google",
      providerAccountId: "g-1",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
      nome: "Mario",
      cognome: "Rossi",
      createdAt: "now",
      expiresAt: new Date(),
    });
    const res = await GET(req("oauth_pending=token"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.pending).toEqual({
      provider: "google",
      nome: "Mario",
      cognome: "Rossi",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
    });
    expect(body.pending.providerAccountId).toBeUndefined();
  });
});
```

```ts
// src/app/api/auth/oauth/complete-registration/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/oauth/flow-cookie", () => ({
  verifyOAuthPendingCookie: vi.fn(),
}));
vi.mock("@/lib/mongo/pending-oauth-registrations", () => ({
  findPendingOAuthRegistrationById: vi.fn(),
  deletePendingOAuthRegistration: vi.fn(),
}));
vi.mock("@/lib/mongo/users", () => ({
  findUserByEmail: vi.fn(),
  createOAuthUser: vi.fn(),
}));
vi.mock("@/lib/mongo/oauth-identities", () => ({
  createOAuthIdentity: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({
  createUserSession: vi.fn(async () => ({ token: "t", expiresAt: new Date(Date.now() + 1000) })),
}));

import { POST } from "./route";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import { findPendingOAuthRegistrationById, deletePendingOAuthRegistration } from "@/lib/mongo/pending-oauth-registrations";
import { findUserByEmail, createOAuthUser } from "@/lib/mongo/users";
import { createOAuthIdentity } from "@/lib/mongo/oauth-identities";

beforeEach(() => vi.clearAllMocks());

function req(body: unknown, cookie = "oauth_pending=token") {
  return new Request("https://example.org/api/auth/oauth/complete-registration", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPending = {
  _id: "p1",
  provider: "google" as const,
  providerAccountId: "g-1",
  providerEmail: "a@b.com",
  providerEmailVerified: true,
  nome: "Mario",
  cognome: "Rossi",
  createdAt: "now",
  expiresAt: new Date(),
};

describe("POST /api/auth/oauth/complete-registration", () => {
  it("returns 401 without a valid oauth_pending cookie", async () => {
    const res = await POST(req({ role: "credente", ageGroup: "19-29" }, ""));
    expect(res.status).toBe(401);
  });

  it("ignores provider/providerAccountId supplied in the body and uses only the cookie-resolved pending doc", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue(validPending);
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createOAuthUser as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", email: "a@b.com" });

    await POST(
      req({
        role: "credente",
        ageGroup: "19-29",
        provider: "facebook",
        providerAccountId: "attacker-controlled",
      })
    );

    expect(createOAuthIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google", providerAccountId: "g-1", userId: "user-1" })
    );
  });

  it("returns 400 when role or ageGroup is invalid", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue(validPending);
    const res = await POST(req({ role: "not-a-role", ageGroup: "19-29" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 without merging when the email is already registered", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue(validPending);
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "existing-user" });

    const res = await POST(req({ role: "credente", ageGroup: "19-29" }));
    expect(res.status).toBe(409);
    expect(createOAuthUser).not.toHaveBeenCalled();
  });

  it("creates the user, links the identity, deletes the pending doc, and sets a session on success", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue(validPending);
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createOAuthUser as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", email: "a@b.com" });

    const res = await POST(req({ role: "credente", ageGroup: "19-29" }));

    expect(res.status).toBe(201);
    expect(deletePendingOAuthRegistration).toHaveBeenCalledWith("p1");
    expect(res.headers.get("set-cookie")).toContain("user_session=");
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("requires a manually supplied email when the provider gave none", async () => {
    (verifyOAuthPendingCookie as ReturnType<typeof vi.fn>).mockResolvedValue({ pendingId: "p1" });
    (findPendingOAuthRegistrationById as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...validPending,
      providerEmail: undefined,
    });
    const res = await POST(req({ role: "credente", ageGroup: "19-29" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/auth/oauth/pending/route.test.ts src/app/api/auth/oauth/complete-registration/route.test.ts`
Expected: FAIL — route modules do not exist.

- [ ] **Step 3: Implement `pending/route.ts`**

```ts
// src/app/api/auth/oauth/pending/route.ts
import { NextResponse } from "next/server";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import { findPendingOAuthRegistrationById } from "@/lib/mongo/pending-oauth-registrations";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)oauth_pending=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const parsed = token ? await verifyOAuthPendingCookie(token) : null;
  if (!parsed) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  const pending = await findPendingOAuthRegistrationById(parsed.pendingId);
  if (!pending) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    pending: {
      provider: pending.provider,
      nome: pending.nome,
      cognome: pending.cognome,
      providerEmail: pending.providerEmail,
      providerEmailVerified: pending.providerEmailVerified,
    },
  });
}
```

- [ ] **Step 4: Implement `complete-registration/route.ts`**

```ts
// src/app/api/auth/oauth/complete-registration/route.ts
import { NextResponse } from "next/server";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import {
  findPendingOAuthRegistrationById,
  deletePendingOAuthRegistration,
} from "@/lib/mongo/pending-oauth-registrations";
import { findUserByEmail, createOAuthUser } from "@/lib/mongo/users";
import { createOAuthIdentity } from "@/lib/mongo/oauth-identities";
import { createUserSession } from "@/lib/mongo/sessions";
import type { UserRole, AgeGroup } from "@/types";

const VALID_ROLES: UserRole[] = ["credente", "madre", "padre", "ospite_chiesa"];
const VALID_AGE_GROUPS: AgeGroup[] = ["0-11", "12-18", "19-29", "30-45", "46-65", "65+"];

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 15) || "utente";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${local}_${suffix}`;
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)oauth_pending=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const parsed = token ? await verifyOAuthPendingCookie(token) : null;
  if (!parsed) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  const pending = await findPendingOAuthRegistrationById(parsed.pendingId);
  if (!pending) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { role, ageGroup, chiesa, email: manualEmail } = body as {
    role?: string;
    ageGroup?: string;
    chiesa?: string;
    email?: string;
  };

  if (!role || !VALID_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ success: false, error: "Ruolo non valido" }, { status: 400 });
  }
  if (!ageGroup || !VALID_AGE_GROUPS.includes(ageGroup as AgeGroup)) {
    return NextResponse.json({ success: false, error: "Fascia d'età non valida" }, { status: 400 });
  }

  const email = (pending.providerEmail ?? manualEmail ?? "").toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: "Email non valida" }, { status: 400 });
  }

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Email già registrata. Accedi con email e password, poi collega questo provider dal tuo profilo.",
      },
      { status: 409 }
    );
  }

  const user = await createOAuthUser({
    email,
    username: usernameFromEmail(email),
    nome: pending.nome?.trim() || "Utente",
    cognome: pending.cognome?.trim() || "",
    role: role as UserRole,
    ageGroup: ageGroup as AgeGroup,
    chiesa: role === "ospite_chiesa" ? chiesa?.trim() : undefined,
  });

  await createOAuthIdentity({
    provider: pending.provider,
    providerAccountId: pending.providerAccountId,
    userId: user._id!,
    providerEmail: pending.providerEmail,
    providerEmailVerified: pending.providerEmailVerified,
  });

  await deletePendingOAuthRegistration(pending._id);

  const { token: sessionToken, expiresAt } = await createUserSession(user._id!, request, false);
  const res = NextResponse.json({ success: true, user }, { status: 201 });
  res.cookies.set("user_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  res.cookies.delete("oauth_pending");
  return res;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/app/api/auth/oauth/pending/route.test.ts src/app/api/auth/oauth/complete-registration/route.test.ts`
Expected: PASS (3 + 6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/oauth/pending src/app/api/auth/oauth/complete-registration
git commit -m "feat: add OAuth pending lookup and complete-registration routes"
```

---

## Task 10: `POST /api/auth/oauth/unlink` and `GET /api/auth/oauth/status`

**Files:**
- Create: `src/app/api/auth/oauth/unlink/route.ts`
- Create: `src/app/api/auth/oauth/status/route.ts`
- Test: `src/app/api/auth/oauth/unlink/route.test.ts`
- Test: `src/app/api/auth/oauth/status/route.test.ts`

**Interfaces:**
- Consumes: `validateUserSession` (existing); `findUserByIdFull` (existing); `findOAuthIdentitiesByUserId`, `countOAuthIdentitiesByUserId`, `deleteOAuthIdentity` (Task 2).
- Produces: `unlink` accepts `{ provider }`, returns 200 on success, 400 with a clear message when it's the last method, 401 without a session. `status` returns `{ success: true, hasPassword: boolean, identities: [{ provider, linkedAt, providerEmail? }] }`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/api/auth/oauth/unlink/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({ findUserByIdFull: vi.fn() }));
vi.mock("@/lib/mongo/oauth-identities", () => ({
  countOAuthIdentitiesByUserId: vi.fn(),
  deleteOAuthIdentity: vi.fn(),
}));

import { POST } from "./route";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { countOAuthIdentitiesByUserId, deleteOAuthIdentity } from "@/lib/mongo/oauth-identities";

beforeEach(() => vi.clearAllMocks());

function req(body: unknown, cookie = "user_session=token") {
  return new Request("https://example.org/api/auth/oauth/unlink", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/oauth/unlink", () => {
  it("returns 401 without a valid session", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(401);
  });

  it("blocks unlinking the only remaining auth method (no password, one identity)", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: false });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(400);
    expect(deleteOAuthIdentity).not.toHaveBeenCalled();
  });

  it("allows unlinking when a password is set", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: true });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (deleteOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(200);
    expect(deleteOAuthIdentity).toHaveBeenCalledWith("user-1", "google");
  });

  it("allows unlinking when another provider is still linked", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: false });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (deleteOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(req({ provider: "facebook" }));
    expect(res.status).toBe(200);
  });
});
```

```ts
// src/app/api/auth/oauth/status/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({ findUserByIdFull: vi.fn() }));
vi.mock("@/lib/mongo/oauth-identities", () => ({ findOAuthIdentitiesByUserId: vi.fn() }));

import { GET } from "./route";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { findOAuthIdentitiesByUserId } from "@/lib/mongo/oauth-identities";

beforeEach(() => vi.clearAllMocks());

function req(cookie = "user_session=token") {
  return new Request("https://example.org/api/auth/oauth/status", { headers: { cookie } });
}

describe("GET /api/auth/oauth/status", () => {
  it("returns 401 without a valid session", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(req(""));
    expect(res.status).toBe(401);
  });

  it("returns hasPassword and linked identities for the current user", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: true });
    (findOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "google", linkedAt: "2026-01-01", providerEmail: "a@b.com" },
    ]);

    const res = await GET(req());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hasPassword).toBe(true);
    expect(body.identities).toEqual([
      { provider: "google", linkedAt: "2026-01-01", providerEmail: "a@b.com" },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/auth/oauth/unlink/route.test.ts src/app/api/auth/oauth/status/route.test.ts`
Expected: FAIL — route modules do not exist.

- [ ] **Step 3: Implement `unlink/route.ts`**

```ts
// src/app/api/auth/oauth/unlink/route.ts
import { NextResponse } from "next/server";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { countOAuthIdentitiesByUserId, deleteOAuthIdentity } from "@/lib/mongo/oauth-identities";
import type { OAuthProvider } from "@/lib/mongo/oauth-identities";

const VALID_PROVIDERS: OAuthProvider[] = ["google", "facebook"];

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const session = token ? await validateUserSession(token) : null;
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const provider = (body as { provider?: string }).provider;
  if (!provider || !VALID_PROVIDERS.includes(provider as OAuthProvider)) {
    return NextResponse.json({ success: false, error: "Provider non valido" }, { status: 400 });
  }

  const user = await findUserByIdFull(session.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
  }

  const identityCount = await countOAuthIdentitiesByUserId(session.userId);
  const availableMethods = (user.hasPassword !== false ? 1 : 0) + identityCount;
  if (availableMethods <= 1) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Questo è il tuo unico metodo di accesso. Imposta una password o collega un altro provider prima di scollegarlo.",
      },
      { status: 400 }
    );
  }

  await deleteOAuthIdentity(session.userId, provider as OAuthProvider);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Implement `status/route.ts`**

```ts
// src/app/api/auth/oauth/status/route.ts
import { NextResponse } from "next/server";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { findOAuthIdentitiesByUserId } from "@/lib/mongo/oauth-identities";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const session = token ? await validateUserSession(token) : null;
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const [user, identities] = await Promise.all([
    findUserByIdFull(session.userId),
    findOAuthIdentitiesByUserId(session.userId),
  ]);

  return NextResponse.json({
    success: true,
    hasPassword: user?.hasPassword !== false,
    identities: identities.map((i) => ({
      provider: i.provider,
      linkedAt: i.linkedAt,
      providerEmail: i.providerEmail,
    })),
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/app/api/auth/oauth/unlink/route.test.ts src/app/api/auth/oauth/status/route.test.ts`
Expected: PASS (4 + 2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/oauth/unlink src/app/api/auth/oauth/status
git commit -m "feat: add OAuth unlink and status routes"
```

---

## Task 11: `LoginModal` — provider buttons

**Files:**
- Modify: `src/components/auth/LoginModal.tsx`
- Modify: `src/messages/it.json`, `src/messages/ar.json` (add `auth.oauthContinueWithGoogle`, `auth.oauthContinueWithFacebook`, `auth.oauthDivider`, `auth.oauthErrorGeneric` keys — read the existing `auth` namespace structure in both files first and match the existing key style before inserting)

**Interfaces:**
- Produces: two buttons that navigate the browser (full page redirect, not fetch) to `/api/auth/oauth/google/start?intent=login&returnTo=<current path>` and `/api/auth/oauth/facebook/start?intent=login&returnTo=<current path>`.

- [ ] **Step 1: Read the current `LoginModal.tsx` and the `auth` namespace in `src/messages/it.json`/`ar.json` to find the exact insertion point and existing key-naming pattern (do not skip this — matching the existing style is required, not optional).**

- [ ] **Step 2: Add translation keys**

In `src/messages/it.json`, inside the `"auth"` object (alongside existing `login*`/`register*` keys):

```json
"oauthDivider": "oppure",
"oauthContinueWithGoogle": "Continua con Google",
"oauthContinueWithFacebook": "Continua con Facebook",
"oauthErrorAccessDenied": "Accesso annullato.",
"oauthErrorGeneric": "Non è stato possibile completare l'accesso con il provider. Riprova.",
"oauthErrorAlreadyLinked": "Questo provider è già collegato al tuo account.",
"oauthErrorIdentityTaken": "Questo account è già collegato a un altro profilo.",
"oauthErrorSessionExpired": "Sessione scaduta, accedi di nuovo e riprova."
```

In `src/messages/ar.json`, the same keys with Arabic translations matching the file's existing tone (mirror how other `auth.*` strings are phrased there):

```json
"oauthDivider": "أو",
"oauthContinueWithGoogle": "المتابعة باستخدام Google",
"oauthContinueWithFacebook": "المتابعة باستخدام Facebook",
"oauthErrorAccessDenied": "تم إلغاء تسجيل الدخول.",
"oauthErrorGeneric": "تعذر إكمال تسجيل الدخول عبر مزوّد الخدمة. حاول مرة أخرى.",
"oauthErrorAlreadyLinked": "هذا الحساب مرتبط بالفعل بحسابك.",
"oauthErrorIdentityTaken": "هذا الحساب مرتبط بالفعل بملف تعريف آخر.",
"oauthErrorSessionExpired": "انتهت الجلسة، سجّل الدخول مرة أخرى وأعد المحاولة."
```

- [ ] **Step 3: Add the buttons to `LoginModal.tsx`**

Add near the top of the credentials form (after the header, before the identifier/password fields — read the file to find the exact JSX position), and import `useMemo`/`usePathname` from `next/navigation` if not already present:

```tsx
import { usePathname } from "next/navigation";
```

Inside the component body:

```tsx
const pathname = usePathname();
const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);

function startOAuth(provider: "google" | "facebook") {
  setOauthLoading(provider);
  const returnTo = encodeURIComponent(pathname || "/");
  window.location.href = `/api/auth/oauth/${provider}/start?intent=login&returnTo=${returnTo}`;
}
```

JSX block (placed once, above the existing credentials form):

```tsx
<div className="space-y-2 mb-4">
  <button
    type="button"
    onClick={() => startOAuth("google")}
    disabled={oauthLoading !== null}
    className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-60"
  >
    {oauthLoading === "google" ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
    ) : (
      <GoogleIcon className="h-4 w-4" />
    )}
    {t("oauthContinueWithGoogle")}
  </button>
  <button
    type="button"
    onClick={() => startOAuth("facebook")}
    disabled={oauthLoading !== null}
    className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-60"
  >
    {oauthLoading === "facebook" ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
    ) : (
      <FacebookIcon className="h-4 w-4" />
    )}
    {t("oauthContinueWithFacebook")}
  </button>
  <div className="flex items-center gap-3 py-1">
    <div className="h-px flex-1 bg-border" />
    <span className="text-xs text-foreground/50">{t("oauthDivider")}</span>
    <div className="h-px flex-1 bg-border" />
  </div>
</div>
```

Add two small inline icon components at the bottom of the file (below the default export, or in a new `src/components/auth/ProviderIcons.tsx` shared file used by both `LoginModal` and `RegisterModal` — create the shared file to avoid duplicating the SVGs):

```tsx
// src/components/auth/ProviderIcons.tsx
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12C3.24 21.3 7.29 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A6.6 6.6 0 0 1 4.92 12c0-.8.14-1.57.35-2.29V6.6H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.29 0 3.24 2.7 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.96 10.13 11.85V15.47H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38C19.61 22.96 24 17.99 24 12z"
      />
    </svg>
  );
}
```

Import in `LoginModal.tsx`: `import { GoogleIcon, FacebookIcon } from "./ProviderIcons";`

- [ ] **Step 4: Manual verification (no automated test — pure UI wiring)**

Run: `npm run dev`, open `/`, trigger the login modal, confirm both buttons render with the divider, and clicking one navigates the browser to `/api/auth/oauth/google/start?...` (will 503 until Task 1's env vars are set — expected at this stage, verified fully in Task 14).

- [ ] **Step 5: Run lint and type-check**

Run: `npx eslint src/components/auth/LoginModal.tsx src/components/auth/ProviderIcons.tsx`
Expected: 0 errors.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/LoginModal.tsx src/components/auth/ProviderIcons.tsx src/messages/it.json src/messages/ar.json
git commit -m "feat: add Google/Facebook login buttons to LoginModal"
```

---

## Task 12: `RegisterModal` — provider buttons + OAuth quiz-completion mode

**Files:**
- Modify: `src/components/auth/RegisterModal.tsx`
- Modify: `src/messages/it.json`, `src/messages/ar.json` (add `auth.registerOauthBanner`, `auth.registerOauthEmailRequired` keys)

**Interfaces:**
- Consumes: `GoogleIcon`, `FacebookIcon` (Task 11); `GET /api/auth/oauth/pending`, `POST /api/auth/oauth/complete-registration` (Task 9).
- Produces: on mount, if the URL has `?completeRegistration=1`, the modal calls `/api/auth/oauth/pending`; on success it opens directly on the `quiz` step in a new `oauthMode` state, pre-fills `nome`/`cognome`, shows a "Continua come {nome}, via {provider}" banner, requires manual email entry only if `providerEmail` is absent, and submits to `complete-registration` instead of `register`+auto-login.

- [ ] **Step 1: Add translation keys**

`it.json` (`auth` namespace):
```json
"registerOauthBanner": "Continua come {nome}, tramite {provider}. Completa questi ultimi dati per finire la registrazione.",
"registerOauthEmailMissing": "Il provider non ha condiviso un'email: inseriscine una per completare la registrazione.",
"registerOauthExpired": "La sessione di registrazione è scaduta. Ricomincia da \"Continua con Google/Facebook\"."
```

`ar.json`:
```json
"registerOauthBanner": "المتابعة كـ {nome} عبر {provider}. أكمل هذه البيانات الأخيرة لإنهاء التسجيل.",
"registerOauthEmailMissing": "لم يشارك المزوّد بريدًا إلكترونيًا: أدخل واحدًا لإكمال التسجيل.",
"registerOauthExpired": "انتهت صلاحية جلسة التسجيل. ابدأ من جديد بالضغط على \"المتابعة عبر Google/Facebook\"."
```

- [ ] **Step 2: Add OAuth state and mount-time detection**

At the top of `RegisterModal`, alongside existing state (after the `chiesa`/`requestAdmin` declarations):

```tsx
const [oauthPending, setOauthPending] = useState<{
  provider: "google" | "facebook";
  nome?: string;
  cognome?: string;
  providerEmail?: string;
} | null>(null);
const [oauthManualEmail, setOauthManualEmail] = useState("");
const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
```

New effect (near the existing "Reset form quando si apre" effect):

```tsx
useEffect(() => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("completeRegistration") !== "1") return;

  (async () => {
    try {
      const res = await fetch("/api/auth/oauth/pending");
      const data = await res.json();
      if (data.success && data.pending) {
        setOauthPending(data.pending);
        setNome(data.pending.nome ?? "");
        setCognome(data.pending.cognome ?? "");
        setShowRegisterModal(true);
        setStep("quiz");
      } else {
        setError(t("registerOauthExpired"));
        setShowRegisterModal(true);
      }
    } catch {
      // rete non disponibile: nessuna azione, l'utente può riprovare manualmente
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.delete("completeRegistration");
      window.history.replaceState({}, "", url.toString());
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Reset the new state in the existing "Reset form quando si apre" effect's else-branch is not needed since that effect only runs `if (showRegisterModal)`; instead extend it to also clear `oauthPending`/`oauthManualEmail` when the modal is closed and reopened normally — add these two lines inside the existing `if (showRegisterModal) { ... }` block, right after `setRequestAdmin(false);`:

```tsx
      if (!oauthPending) {
        setOauthManualEmail("");
      }
```

(Skip resetting `oauthPending` itself there — it must survive the modal's own open/close reset because it was set by the effect above; only clear it explicitly when the user goes "back" out of OAuth mode, see Step 3.)

- [ ] **Step 3: Add OAuth buttons to the credentials step and a "back to normal registration" escape hatch**

At the top of the `step === "credentials"` block (before the `nome`/`cognome` grid), add the same buttons/divider pattern as `LoginModal` (Task 11), but pointing at `intent=register`:

```tsx
{!oauthPending && (
  <div className="space-y-2 mb-4">
    <button
      type="button"
      onClick={() => {
        setOauthLoading("google");
        window.location.href = "/api/auth/oauth/google/start?intent=register";
      }}
      disabled={oauthLoading !== null}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-60"
    >
      {oauthLoading === "google" ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
      ) : (
        <GoogleIcon className="h-4 w-4" />
      )}
      {t("oauthContinueWithGoogle")}
    </button>
    <button
      type="button"
      onClick={() => {
        setOauthLoading("facebook");
        window.location.href = "/api/auth/oauth/facebook/start?intent=register";
      }}
      disabled={oauthLoading !== null}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-60"
    >
      {oauthLoading === "facebook" ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
      ) : (
        <FacebookIcon className="h-4 w-4" />
      )}
      {t("oauthContinueWithFacebook")}
    </button>
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-foreground/50">{t("oauthDivider")}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  </div>
)}
```

Import `GoogleIcon, FacebookIcon` from `"./ProviderIcons"`.

- [ ] **Step 4: Render the OAuth banner and conditional email field in the `quiz` step**

At the top of the `step === "quiz"` block, before the "Ruolo" section:

```tsx
{oauthPending && (
  <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 mb-2">
    <p className="text-sm text-foreground/80">
      {t("registerOauthBanner", {
        nome: oauthPending.nome || "",
        provider: oauthPending.provider === "google" ? "Google" : "Facebook",
      })}
    </p>
  </div>
)}
{oauthPending && !oauthPending.providerEmail && (
  <div>
    <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">
      {t("registerFieldEmail")}
    </label>
    <input
      type="email"
      value={oauthManualEmail}
      onChange={(e) => setOauthManualEmail(e.target.value)}
      placeholder={t("registerPlaceholderEmail")}
      required
      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
    />
    <p className="text-xs text-foreground/50 mt-1">{t("registerOauthEmailMissing")}</p>
  </div>
)}
```

Also hide the "Torna indietro" button to `credentials` when `oauthPending` is set (there is no credentials step to go back to) — wrap the existing back button in `{!oauthPending && (...)}` in both places it appears in the quiz step (the header back link and the footer back button).

- [ ] **Step 5: Branch `handleSubmit` between classic and OAuth completion**

Replace the body of `handleSubmit` (the `fetch("/api/auth/register", ...)` block) with a branch at the top, keeping the existing classic-path code as the `else` branch:

```tsx
async function handleSubmit() {
  setError("");
  const nextFieldErrors: Partial<Record<RegisterFieldName, string>> = {};

  if (!role || !ageGroup) {
    setError(t("registerErrorRoleAge"));
    if (!role) nextFieldErrors.role = t("registerErrorRoleAge");
    if (!ageGroup) nextFieldErrors.ageGroup = t("registerErrorRoleAge");
    setFieldErrors(nextFieldErrors);
    scrollToFirstError(nextFieldErrors);
    return;
  }
  if (role === "ospite_chiesa" && !chiesa) {
    setError(t("registerErrorChurch"));
    nextFieldErrors.chiesa = t("registerErrorChurch");
    setFieldErrors(nextFieldErrors);
    scrollToFirstError(nextFieldErrors);
    return;
  }

  if (oauthPending) {
    if (!oauthPending.providerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oauthManualEmail)) {
      setError(t("registerErrorEmailInvalid"));
      setFieldErrors({ email: t("registerErrorEmailInvalid") });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/oauth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          ageGroup,
          chiesa: role === "ospite_chiesa" ? chiesa : undefined,
          email: oauthPending.providerEmail ? undefined : oauthManualEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        await refresh();
        setTimeout(() => setShowRegisterModal(false), 1500);
      } else {
        setError(mapRegisterError(data.error) || data.error || t("registerErrorGeneric"));
      }
    } catch {
      setError(t("registerErrorConnection"));
    } finally {
      setLoading(false);
    }
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome.trim(),
        cognome: cognome.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        role,
        ageGroup,
        chiesa: role === "ospite_chiesa" ? chiesa : undefined,
        requestAdmin,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setSuccess(true);
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim().toLowerCase(),
          password,
          rememberMe: false,
        }),
      });
      const loginData = await loginRes.json();
      if (loginData.success && loginData.user) {
        localStorage.setItem("user_info", JSON.stringify(loginData.user));
      }
      await refresh();
      setTimeout(() => {
        setShowRegisterModal(false);
      }, 1500);
    } else {
      const mapped = mapRegisterError(data.error);
      setError(mapped || t("registerErrorGeneric"));
      if (data.error === "Email già registrata") {
        nextFieldErrors.email = t("registerErrorEmailTaken");
      } else if (data.error === "Username già in uso") {
        nextFieldErrors.username = t("registerErrorUsernameTaken");
      } else if (data.error === "Email o username già in uso") {
        nextFieldErrors.email = t("registerErrorEmailTaken");
        nextFieldErrors.username = t("registerErrorUsernameTaken");
      }
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        scrollToFirstError(nextFieldErrors);
      }
    }
  } catch {
    setError(t("registerErrorConnection"));
  } finally {
    setLoading(false);
  }
}
```

Note: the OAuth error strings returned by `complete-registration` ("Email già registrata..." with the longer message) won't all match `errorMap`'s exact keys — that's intentional (`mapRegisterError(data.error) || data.error || ...` falls back to showing the server's message directly, which is already user-facing Italian text).

- [ ] **Step 6: Manual verification checklist (documented for Task 18, not run here)**

No automated test for this task — it's UI composition over already-tested API routes (Tasks 8-9) and translated strings. Full end-to-end browser verification happens in Task 15/18 once real provider credentials exist.

- [ ] **Step 7: Run lint and type-check**

Run: `npx eslint src/components/auth/RegisterModal.tsx`
Expected: 0 errors.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/auth/RegisterModal.tsx src/messages/it.json src/messages/ar.json
git commit -m "feat: add OAuth registration buttons and quiz-completion mode to RegisterModal"
```

---

## Task 13: `/profilo` — "Accessi collegati" section

**Files:**
- Modify: `src/app/(main)/profilo/page.tsx`
- Create: `src/components/profile/LinkedAccountsSection.tsx`
- Modify: `src/messages/it.json`, `src/messages/ar.json` (add `profilo.linkedAccountsTitle`, `linkedAccountsSubtitle`, `linkedAccountsConnect`, `linkedAccountsDisconnect`, `linkedAccountsConnected`, `linkedAccountsNotConnected`, `linkedAccountsConfirmUnlink`, `linkedAccountsLastMethod`, `linkedAccountsLinkedOn`)

**Interfaces:**
- Consumes: `GET /api/auth/oauth/status`, `POST /api/auth/oauth/unlink`, `GoogleIcon`/`FacebookIcon` (Task 11).
- Produces: a self-contained `<LinkedAccountsSection />` component, rendered only when `type === "user"` (not for admins/guests), reading `useAuth()` for auth state.

- [ ] **Step 1: Add translation keys**

`it.json` (`profilo` namespace — read the file first to match indentation/ordering):
```json
"linkedAccountsTitle": "Accessi collegati",
"linkedAccountsSubtitle": "Collega Google o Facebook per accedere più velocemente, oltre a email e password.",
"linkedAccountsConnect": "Collega",
"linkedAccountsDisconnect": "Scollega",
"linkedAccountsConnected": "Collegato",
"linkedAccountsNotConnected": "Non collegato",
"linkedAccountsConfirmUnlink": "Scollegare questo account? Potrai ricollegarlo in qualsiasi momento.",
"linkedAccountsLastMethod": "Questo è il tuo unico metodo di accesso. Imposta una password o collega un altro provider prima di scollegarlo.",
"linkedAccountsLinkedOn": "Collegato il {date}",
"linkedAccountsError": "Non è stato possibile completare l'operazione. Riprova."
```

`ar.json` (mirror tone of existing `profilo.*` entries):
```json
"linkedAccountsTitle": "حسابات مرتبطة",
"linkedAccountsSubtitle": "اربط Google أو Facebook لتسجيل الدخول بسرعة أكبر، بالإضافة إلى البريد الإلكتروني وكلمة المرور.",
"linkedAccountsConnect": "ربط",
"linkedAccountsDisconnect": "إلغاء الربط",
"linkedAccountsConnected": "مرتبط",
"linkedAccountsNotConnected": "غير مرتبط",
"linkedAccountsConfirmUnlink": "هل تريد إلغاء ربط هذا الحساب؟ يمكنك إعادة ربطه في أي وقت.",
"linkedAccountsLastMethod": "هذه هي طريقة الدخول الوحيدة لديك. عيّن كلمة مرور أو اربط مزوّدًا آخر قبل إلغاء الربط.",
"linkedAccountsLinkedOn": "تم الربط في {date}",
"linkedAccountsError": "تعذر إتمام العملية. حاول مرة أخرى."
```

- [ ] **Step 2: Implement `LinkedAccountsSection.tsx`**

```tsx
// src/components/profile/LinkedAccountsSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Link2, AlertTriangle } from "lucide-react";
import { GoogleIcon, FacebookIcon } from "@/components/auth/ProviderIcons";

type Provider = "google" | "facebook";

interface Status {
  hasPassword: boolean;
  identities: { provider: Provider; linkedAt: string; providerEmail?: string }[];
}

const PROVIDERS: { id: Provider; label: string; Icon: typeof GoogleIcon }[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
];

export default function LinkedAccountsSection() {
  const t = useTranslations("profilo");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Provider | null>(null);
  const [confirmingUnlink, setConfirmingUnlink] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/oauth/status");
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch {
      // silenzioso: la sezione mostra semplicemente "non disponibile"
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleConnect(provider: Provider) {
    setActionLoading(provider);
    window.location.href = `/api/auth/oauth/${provider}/start?intent=link&returnTo=/profilo`;
  }

  async function handleUnlink(provider: Provider) {
    setActionLoading(provider);
    setError("");
    try {
      const res = await fetch("/api/auth/oauth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
      } else {
        setError(data.error || t("linkedAccountsError"));
      }
    } catch {
      setError(t("linkedAccountsError"));
    } finally {
      setActionLoading(null);
      setConfirmingUnlink(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse">
        <div className="h-4 w-40 bg-surface-2 rounded mb-3" />
        <div className="h-10 w-full bg-surface-2 rounded" />
      </div>
    );
  }

  const totalMethods = (status?.hasPassword ? 1 : 0) + (status?.identities.length ?? 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-foreground mb-1">{t("linkedAccountsTitle")}</h3>
      <p className="text-sm text-foreground/60 mb-4">{t("linkedAccountsSubtitle")}</p>

      {error && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map(({ id, label, Icon }) => {
          const identity = status?.identities.find((i) => i.provider === id);
          const isConnected = Boolean(identity);
          const isLast = isConnected && totalMethods <= 1;

          return (
            <div
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-foreground/60 flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-success" />
                        {t("linkedAccountsConnected")}
                        {identity && ` · ${t("linkedAccountsLinkedOn", { date: new Date(identity.linkedAt).toLocaleDateString() })}`}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-foreground/40" />
                        {t("linkedAccountsNotConnected")}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {isConnected ? (
                confirmingUnlink === id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUnlink(id)}
                      disabled={actionLoading === id}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      {t("linkedAccountsDisconnect")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingUnlink(null)}
                      className="text-xs text-foreground/60 hover:underline"
                    >
                      {t("linkedAccountsAnnulla") ?? "Annulla"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      isLast ? setError(t("linkedAccountsLastMethod")) : setConfirmingUnlink(id)
                    }
                    disabled={actionLoading !== null}
                    className="shrink-0 text-xs font-semibold text-foreground/70 hover:text-danger transition-colors border border-border rounded-lg px-3 py-1.5"
                  >
                    {t("linkedAccountsDisconnect")}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(id)}
                  disabled={actionLoading !== null}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline border border-accent/30 rounded-lg px-3 py-1.5 disabled:opacity-60"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {t("linkedAccountsConnect")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Note: `t("linkedAccountsAnnulla")` intentionally falls back to a literal via `??` since "Annulla" already exists generically elsewhere in the app; if `next-intl`'s `t()` throws instead of returning undefined for a missing key in this project's config, replace that line with `tCommon("annulla")` — check `src/messages/it.json`'s `common` namespace for the exact existing key name before finalizing this line, and use it directly instead of adding a new one.

- [ ] **Step 3: Mount the section in `/profilo`**

In `src/app/(main)/profilo/page.tsx`, import `LinkedAccountsSection` and render it once, guarded by `type === "user"` (not for guests/admins), placed near the other account-settings cards (e.g. next to the change-password section — read the file to find that section's container and place this section as a sibling card).

```tsx
import LinkedAccountsSection from "@/components/profile/LinkedAccountsSection";
```

```tsx
{type === "user" && <LinkedAccountsSection />}
```

- [ ] **Step 4: Handle the `?linked=<provider>` success query param from the callback route**

In `profilo/page.tsx`, add an effect that reads `?linked=` from the URL on mount and shows a transient success toast/banner (reuse whatever toast/banner pattern already exists in this page — check for an existing `useState<string|null>` message pattern before adding a new one), then strips the param with `history.replaceState`, mirroring the pattern used in Task 12 Step 2.

- [ ] **Step 5: Manual verification checklist (documented for Task 18)**

No automated test — pure composition over the already-tested `status`/`unlink` routes. Verified in Task 18's browser pass.

- [ ] **Step 6: Run lint and type-check**

Run: `npx eslint src/components/profile/LinkedAccountsSection.tsx "src/app/(main)/profilo/page.tsx"`
Expected: 0 errors.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/profile/LinkedAccountsSection.tsx "src/app/(main)/profilo/page.tsx" src/messages/it.json src/messages/ar.json
git commit -m "feat: add linked accounts section to profile page"
```

---

## Task 14: `oauthError` handling on the public pages + optional `hasPassword` backfill script

**Files:**
- Modify: `src/components/auth/AuthContext.tsx` or the root layout wrapper (wherever a good single place exists to read `?oauthError=` once globally — check `src/app/layout.tsx` and `src/app/(main)/layout.tsx` for the right spot; prefer adding this to `LoginModal`/`RegisterModal`'s existing error-surfacing rather than a new global toast system if one doesn't already exist)
- Create: `src/scripts/backfill-has-password.ts`

**Interfaces:**
- Produces: a mapping from `oauthError` codes (`access_denied`, `invalid_state`, `provider_error`, `provider_unavailable`, `session_expired`, `already_linked`, `identity_taken`, `account_disabled`, `unsupported_provider`) to the translation keys added in Tasks 11-13, surfaced as a non-blocking message wherever the user lands back on the site.

- [ ] **Step 1: Read `src/app/layout.tsx` and `src/app/(main)/layout.tsx`** to confirm whether a global banner/toast mechanism already exists (the `SectionVisibilityGate`/admin toast pattern mentioned in `PROJECT_CONTEXT.md` §5.2 is admin-only). If none exists for the public site, add the simplest option: in `LoginModal.tsx` and the `/profilo` page (the two places a user lands after an OAuth redirect with `intent=login` and `intent=link` respectively), read `?oauthError=` on mount and set the existing `error`/message state to the mapped translation string, then strip the param.

Example mapping (place as a small exported helper so both call sites reuse it):

```ts
// src/lib/oauth/error-messages.ts
export const OAUTH_ERROR_KEYS: Record<string, string> = {
  access_denied: "oauthErrorAccessDenied",
  invalid_state: "oauthErrorSessionExpired",
  session_expired: "oauthErrorSessionExpired",
  provider_error: "oauthErrorGeneric",
  provider_unavailable: "oauthErrorGeneric",
  unsupported_provider: "oauthErrorGeneric",
  account_disabled: "oauthErrorGeneric",
  already_linked: "oauthErrorAlreadyLinked",
  identity_taken: "oauthErrorIdentityTaken",
};
```

Wire it into `LoginModal.tsx` (mount effect):

```tsx
useEffect(() => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("oauthError");
  if (!code) return;
  const key = OAUTH_ERROR_KEYS[code] ?? "oauthErrorGeneric";
  setError(t(key));
  setShowLoginModal(true);
  const url = new URL(window.location.href);
  url.searchParams.delete("oauthError");
  window.history.replaceState({}, "", url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

And equivalently in `/profilo/page.tsx` for the `link` flow's failures (same param, same helper), setting whatever local error-message state Task 13 Step 4 introduced.

- [ ] **Step 2: Implement the optional backfill script**

```ts
// src/scripts/backfill-has-password.ts
/**
 * Imposta esplicitamente hasPassword:true su tutti i documenti "users"
 * che ne sono privi. Non necessario per il funzionamento (il campo assente
 * è già trattato come true a runtime — vedi design spec §2.3), ma rende
 * lo stato esplicito nel DB. Idempotente: eseguibile più volte senza effetti
 * collaterali.
 *
 * Uso: npx tsx src/scripts/backfill-has-password.ts
 */
import "dotenv/config";
import { getDb } from "@/lib/mongo/client";

async function main() {
  const db = await getDb();
  const result = await db
    .collection("users")
    .updateMany({ hasPassword: { $exists: false } }, { $set: { hasPassword: true } });
  console.log(`Aggiornati ${result.modifiedCount} utenti con hasPassword:true esplicito.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Add a script entry to `package.json`:

```json
"backfill-has-password": "npx tsx src/scripts/backfill-has-password.ts"
```

- [ ] **Step 3: Run lint and type-check**

Run: `npx eslint src/lib/oauth/error-messages.ts src/components/auth/LoginModal.tsx "src/app/(main)/profilo/page.tsx" src/scripts/backfill-has-password.ts`
Expected: 0 errors.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/oauth/error-messages.ts src/components/auth/LoginModal.tsx "src/app/(main)/profilo/page.tsx" src/scripts/backfill-has-password.ts package.json
git commit -m "feat: surface OAuth errors on redirect and add hasPassword backfill script"
```

---

## Task 15: Full test suite, lint, type-check pass

**Files:** none new — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests (existing + all new ones from Tasks 2-10) PASS, no failures, no unexpected skips.

- [ ] **Step 2: Run lint across the whole project**

Run: `npm run lint`
Expected: 0 new errors. Pre-existing warnings noted in `PROJECT_CONTEXT.md` §10.4/§10.5 are acceptable; any new warning on a file touched by this feature must be fixed, not ignored.

- [ ] **Step 3: Run the full type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: build succeeds. This will surface any server/client boundary issues (e.g. accidentally importing a Node-only Mongo module into a client component) that unit tests can't catch.

- [ ] **Step 5: If any step fails, fix and re-run from Step 1 before proceeding.**

- [ ] **Step 6: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint/type/build issues from OAuth feature verification pass"
```

(Skip this commit if Steps 1-4 were already clean.)

---

## Task 16: Manual browser verification (requires real credentials — user-provided)

**Files:** none — verification only, per spec §"Test e verifica" and the criteria in the original request.

This task cannot be completed by an autonomous worker without real Google/Facebook OAuth app credentials, since Tasks 1-15 explicitly build the code without live credentials (per the approved design). Document this clearly rather than claiming untested behavior works.

- [ ] **Step 1: Prerequisite — the user creates the OAuth apps**

Document (do not perform) these external steps for the user, to be added to the final report (Task 17):
- Google Cloud Console → OAuth consent screen + OAuth client ID (Web application), authorized redirect URI `${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/google/callback`.
- Facebook Developers → an app with "Facebook Login" product, Valid OAuth Redirect URI `${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/facebook/callback`, and `email` + `public_profile` permissions (default, no App Review needed for basic profile+email in development mode with test users).
- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` in `.env.local` (dev) and in Vercel project settings (production/preview).

- [ ] **Step 2: Once credentials exist, run `npm run dev` and manually verify each scenario from the original request**

Checklist to execute in-browser (record pass/fail per item in the final report, Task 17):
1. Normal email/password login still works.
2. Normal email/password registration still works, quiz still mandatory.
3. First-time login via Google → pending registration created → quiz shown → cannot be skipped by closing/reopening the modal → completing it creates the account and session.
4. Same for Facebook.
5. Abandoning after Google auth but before the quiz, then returning to the site: the pending registration and `oauth_pending` cookie survive (within 30 min), the quiz resumes without re-authenticating with Google.
6. Logging in again via an already-linked Google account goes straight to a session, no quiz shown, profile/role/quiz-completion data unchanged.
7. From `/profilo` while logged in with email/password, linking Google: no new account created, existing user id/data/role unchanged, `status` now shows Google connected.
8. Confirm the same user can now log in with either email/password or Google.
9. Attempt to link a Google account already linked to a different local account: rejected with `identity_taken`, no data changed on either account.
10. Attempt Facebook login where the test Facebook user has no email on the app: `complete-registration` correctly prompts for manual email entry and succeeds once provided.
11. Cancel the Google/Facebook consent screen mid-flow: redirected back with `oauthError=access_denied`, no account/pending doc created.
12. Manually corrupt/omit the `oauth_flow` cookie value and hit the callback URL directly: rejected with `invalid_state`, no session created.
13. Expire a `user_session` cookie (or use an old invalid token) and attempt `intent=link`: rejected with 401/`session_expired`.
14. Attempt `POST /api/auth/oauth/unlink` as the only-method user (no password, one provider): blocked with the "last method" message; verify via `curl` or browser devtools that a modified client request (e.g. omitting the confirm step) still gets rejected server-side — this proves the block isn't just UI.
15. With a password set and one provider linked, unlink the provider: succeeds; verify email/password login still works afterward.
16. Verify desktop, tablet (iPad-width devtools emulation), and mobile (390px) layouts for: `LoginModal`, `RegisterModal` (both classic and OAuth-quiz mode), and the `/profilo` linked-accounts section.
17. Verify Arabic locale renders all new strings correctly (no missing-key fallback text visible).

- [ ] **Step 3: Report results**

Feed the pass/fail results from Step 2 into the final documentation (Task 17). Any failing scenario must be fixed (new commit) and re-verified before the feature is considered complete — do not report success without this evidence, per the project's verification-before-completion norm.

---

## Task 17: Final documentation

**Files:**
- Modify: `PROJECT_CONTEXT.md` — add a new subsection under §7 ("Flusso autenticazione") documenting the OAuth addition, following the existing audit-log style used in §6.4.1/§10.x (dated entry, what changed, files touched, what was/wasn't verified).

- [ ] **Step 1: Write the `PROJECT_CONTEXT.md` addition**, covering (mirroring the structure the original request asked for, condensed into the project's existing documentation style):
1. Summary of the pre-existing auth architecture (one paragraph, cross-reference §6.4/§7).
2. List of all files created/modified across Tasks 1-14 (generate this from `git log --stat` for the feature's commits rather than retyping from memory).
3. New registration flow via provider.
4. Login flow via provider.
5. Linking flow from an existing account.
6. All new env vars (copy from spec §6).
7. Google/Facebook/Vercel configuration steps (copy from Task 16 Step 1).
8. Callback URLs to register (copy from spec §6).
9. Database changes: the two new collections and the `hasPassword` field (copy from spec §2, note no required migration + optional backfill script from Task 14).
10. Commands run and lint/type-check/test/build results (from Task 15).
11. Remaining manual steps: creating the provider apps, setting env vars in Vercel, running Task 16's browser checklist with real credentials, and — if the user later wants it — implementing Apple per spec §8.
12. Explicit confirmation that no secret/credential was committed (`git log -p` review of `.env.example` and all new files shows only variable names, no values).

- [ ] **Step 2: Commit**

```bash
git add PROJECT_CONTEXT.md
git commit -m "docs: document OAuth providers feature in PROJECT_CONTEXT.md"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (arctic, no new framework) → Task 6; §2.1/§2.2/§2.3 (data model) → Tasks 2-4; §3.1-§3.6 (all six routes) → Tasks 7-10; §4 (UI) → Tasks 11-13; §5 (security: state/PKCE/no client-trusted identity/rate-limit/unlink-block/no-auto-merge) → enforced across Tasks 5, 7-10 and asserted directly in their tests; §6 (env vars) → Task 1; §7 (migrations) → Task 14; §8 (Apple reserved, not implemented) → whitelist in Task 6 excludes it, noted in Task 17 doc as future work; §9 (out of scope) → not built, consistent with the plan.
- **Placeholder scan:** no TBD/TODO left; every code step has real code; Task 16 is explicitly a manual-verification task (not a placeholder — it's correctly separated because it requires credentials no worker in this session has).
- **Type consistency:** `OAuthProvider` (Task 2) reused verbatim by Tasks 3, 6 (as `SupportedProvider` alias, both restricted to `"google"|"facebook"`), 8, 9, 10; `OAuthProfile` (Task 6) fields consumed exactly as named in Task 8's callback; `OAuthFlowPayload`/`OAuthIntent` (Task 5) consumed exactly as named in Tasks 7-8; `PendingOAuthRegistration` (Task 3) fields consumed exactly as named in Task 9.
