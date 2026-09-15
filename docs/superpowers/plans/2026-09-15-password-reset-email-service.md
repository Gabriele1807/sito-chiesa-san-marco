# Password Reset + Email Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Password dimenticata?" flow end-to-end (forgot/reset password pages, API endpoints, token storage, Resend email) and lay the typed foundation for a Resend/Brevo split email service, fixing the pre-existing `user_session` invalidation gap along the way.

**Architecture:** New `password_reset_tokens` Mongo collection (TTL-indexed, hashed tokens) backs two new API routes; a new `src/lib/email/` module wraps Resend (implemented) and Brevo (stubbed) behind typed `send*Email()` functions; `passwordChangedAt` on `UserProfile` plus an `iat` check in `validateUserSession` gives real, retroactive session invalidation without a per-token store.

**Tech Stack:** Next.js 16 route handlers, MongoDB driver, bcryptjs, Node `crypto`, Upstash Redis (`@upstash/redis`), `next-intl` (`getTranslations`), Vitest, `resend` npm package (new dependency).

**Spec:** `docs/superpowers/specs/2026-09-15-password-reset-email-service-design.md`

## Global Constraints

- No zod or any new validation library — manual `if`/`typeof` checks, matching every existing route (spec §2, §5).
- Response envelope always `{ success: boolean, error?: string, ...data }`; generic `try/catch` → `console.error` + 500 (spec §2).
- Never log tokens, passwords, or API keys — log only category/provider/result/message-id (spec §7, §10).
- Reset/forgot-password responses must be identical regardless of whether the email exists (spec §5).
- `admin_session` / `validateSession` (`src/lib/auth/session.ts`) must not be touched by this work (spec §3).
- Bcrypt for the actual password (cost 12, via `src/lib/auth/password.ts`); SHA-256 for the reset token hash — these are different problems, do not conflate them (spec §4).
- `NEXT_PUBLIC_SITE_URL` (existing var) is the base for reset links — do not introduce `NEXT_PUBLIC_APP_URL` (spec §9).
- Only locales `it` and `ar` exist — no Coptic (spec §2, §11).
- Brevo templates/functions are typed stubs only in this pass — do not wire them into `src/lib/mongo/registrations.ts` or `src/lib/mongo/content.ts`, and do not add `emailPending`/`emailSent`/... fields to `IscrizioneEvento` (spec §11).

---

## Task 1: `passwordChangedAt` field + session invalidation in `validateUserSession`

**Files:**
- Modify: `src/types/index.ts` (add field to `UserProfile`, near line 160)
- Modify: `src/lib/mongo/users.ts` (add `setPasswordChangedAt`, extend `updateUserPassword`)
- Modify: `src/lib/mongo/sessions.ts` (`validateUserSession`, `deleteAllUserSessions`, `deleteUserSession`)
- Test: `src/lib/mongo/sessions.test.ts` (new file)

**Interfaces:**
- Consumes: `UserProfile` type, `findUserByIdFull` (existing, `src/lib/mongo/users.ts`)
- Produces: `setPasswordChangedAt(userId: string): Promise<void>` (also used as the real body of `deleteAllUserSessions`), `validateUserSession(token: string): Promise<{ userId: string } | null>` (same signature, now checks `passwordChangedAt`)

- [ ] **Step 1: Write the failing test**

Create `src/lib/mongo/sessions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
}));

import { validateUserSession } from "@/lib/mongo/sessions";
import { signJwt } from "@/lib/auth/jwt";
import { findUserByIdFull } from "@/lib/mongo/users";

const mockFindUser = findUserByIdFull as unknown as ReturnType<typeof vi.fn>;

describe("validateUserSession", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret-value-not-real");
    mockFindUser.mockReset();
  });

  it("rejects a token issued before passwordChangedAt", async () => {
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const result = await validateUserSession(token);
    expect(result).toBeNull();
  });

  it("accepts a token issued after passwordChangedAt", async () => {
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);

    const result = await validateUserSession(token);
    expect(result).toEqual({ userId: "user-1" });
  });

  it("accepts a token when the user has no passwordChangedAt (back-compat)", async () => {
    mockFindUser.mockResolvedValue({ _id: "user-1" });
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);

    const result = await validateUserSession(token);
    expect(result).toEqual({ userId: "user-1" });
  });

  it("rejects a token issued in the same second as passwordChangedAt", async () => {
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);
    // decode iat from the token we just signed, reuse the same second
    const payloadSegment = token.split(".")[1];
    const iat = JSON.parse(Buffer.from(payloadSegment, "base64url").toString()).iat as number;
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(iat * 1000).toISOString(),
    });

    const result = await validateUserSession(token);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mongo/sessions.test.ts`
Expected: FAIL — `validateUserSession` does not yet import `findUserByIdFull` or check `passwordChangedAt`, so the "rejects" tests fail (function currently only checks JWT validity).

- [ ] **Step 3: Add `passwordChangedAt` to the type**

In `src/types/index.ts`, inside `UserProfile` (after the `hasPassword?: boolean` line):

```ts
  /** ISO date, impostata ad ogni reset/cambio password. Usata da validateUserSession
   * per invalidare retroattivamente le sessioni JWT precedenti (vedi design spec §3):
   * un token con iat <= a questo timestamp (troncato al secondo) viene rifiutato. */
  passwordChangedAt?: string;
```

- [ ] **Step 4: Add `setPasswordChangedAt` to `users.ts`**

In `src/lib/mongo/users.ts`, right after `updateUserPassword` (after line 281):

```ts
export async function setPasswordChangedAt(id: string): Promise<void> {
  const c = await col();
  if (!ObjectId.isValid(id)) return;
  await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { passwordChangedAt: new Date().toISOString() } }
  );
}
```

- [ ] **Step 5: Implement the session check and honest stubs in `sessions.ts`**

Replace the full contents of `src/lib/mongo/sessions.ts`:

```ts
/**
 * Sessioni utenti normali tramite JWT firmati.
 * Compatibile con i cookie esistenti `user_session`.
 *
 * Nota architetturale (vedi design spec §3,
 * docs/superpowers/specs/2026-09-15-password-reset-email-service-design.md):
 * questo è un JWT completamente stateless, senza alcun aggancio server-side
 * per-token. L'invalidazione dopo un cambio password è ottenuta tramite
 * `passwordChangedAt` su UserProfile confrontato con `iat` del token, non
 * tramite una deny-list (che richiederebbe conoscere il token esatto delle
 * altre sessioni attive, cosa che non abbiamo). Questo è un meccanismo
 * diverso da quello usato per admin_session (src/lib/auth/session.ts), e
 * intenzionalmente non unificato con esso.
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

// Durate sessione
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000; // 24 ore
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 giorni

// --------------- Create ---------------

export async function createUserSession(
  userId: string,
  _req: Request,
  rememberMe = false
): Promise<{ token: string; expiresAt: Date }> {
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);
  const token = await signJwt(
    {
      sub: userId,
      sessionType: "user",
    },
    Math.floor(duration / 1000)
  );

  return { token, expiresAt };
}

// --------------- Validate ---------------

export async function validateUserSession(
  token: string
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "user" || !payload.sub) return null;

  // Importa dinamicamente per evitare circular dependencies (stesso pattern
  // già usato in getUserFromSessionToken più sotto).
  const { findUserByIdFull } = await import("./users");
  const user = await findUserByIdFull(payload.sub);
  if (!user) return null;

  if (user.passwordChangedAt) {
    const changedAtSeconds = Math.floor(Date.parse(user.passwordChangedAt) / 1000);
    if (payload.iat <= changedAtSeconds) return null;
  }

  return { userId: payload.sub };
}

// --------------- Delete ---------------

/**
 * Logout di una singola sessione. NON esiste uno store per-token per
 * user_session (a differenza di admin_session): questa funzione pulisce
 * solo il cookie lato client chiamante. Il JWT resta valido lato server
 * fino alla scadenza naturale se qualcuno ne conserva una copia — limite
 * documentato, non una vera revoca. Vedi design spec §3 e PROJECT_CONTEXT.md.
 */
export async function deleteUserSession(token: string): Promise<void> {
  void token;
}

/**
 * Logout da tutti i dispositivi: invalida retroattivamente OGNI sessione
 * esistente per l'utente impostando passwordChangedAt = ora, cosicché
 * qualunque JWT con iat <= ora venga rifiutato da validateUserSession.
 * Usata da reset-password e change-password dopo un cambio password riuscito.
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const { setPasswordChangedAt } = await import("./users");
  await setPasswordChangedAt(userId);
}

// --------------- Cleanup ---------------

export async function cleanExpiredUserSessions(): Promise<void> {
  return Promise.resolve();
}

// --------------- Helper for server-side access checks ---------------

/**
 * Recupera l'utente associato a una sessione, se valida.
 * Usato per verificare il ruolo dell'utente nelle route server-side.
 */
export async function getUserFromSessionToken(
  sessionToken: string
): Promise<{ userId: string; role: string } | null> {
  if (!sessionToken) return null;

  try {
    const session = await validateUserSession(sessionToken);
    if (!session) return null;

    const { findUserById } = await import("./users");
    const user = await findUserById(session.userId);

    if (!user) return null;

    return {
      userId: session.userId,
      role: user.role,
    };
  } catch (error) {
    console.error("[getUserFromSessionToken] Errore:", error);
    return null;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/mongo/sessions.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/lib/mongo/users.ts src/lib/mongo/sessions.ts src/lib/mongo/sessions.test.ts
git commit -m "feat: invalidate user sessions retroactively via passwordChangedAt"
```

---

## Task 2: Wire `deleteAllUserSessions` into `change-password/route.ts`

**Files:**
- Modify: `src/app/api/auth/change-password/route.ts:108-121`
- Test: `src/app/api/auth/change-password/route.test.ts` (new file)

**Interfaces:**
- Consumes: `deleteAllUserSessions(userId: string): Promise<void>` (Task 1), existing `updateUserPassword`, `hashPassword`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/auth/change-password/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({
  validateUserSession: vi.fn(),
  deleteAllUserSessions: vi.fn(),
}));
vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
  findUserByUsername: vi.fn(),
  updateUserPassword: vi.fn(),
}));
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/auth/session", () => ({
  validateSession: vi.fn(),
}));

import { POST } from "./route";
import { cookies } from "next/headers";
import { validateUserSession, deleteAllUserSessions } from "@/lib/mongo/sessions";
import { findUserByIdFull, updateUserPassword } from "@/lib/mongo/users";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) => (name === "user_session" ? { value: "tok" } : undefined),
    });
  });

  it("invalidates all other sessions after a successful password change", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "mario",
      passwordHash: "hash",
      adminRequest: "none",
    });
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue("newhash");
    (updateUserPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(
      mockRequest({ currentPassword: "Old12345!", newPassword: "New12345!" })
    );
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(deleteAllUserSessions).toHaveBeenCalledWith("u1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/auth/change-password/route.test.ts`
Expected: FAIL — `deleteAllUserSessions` not called (assertion fails), since the route doesn't call it yet.

- [ ] **Step 3: Wire the call**

In `src/app/api/auth/change-password/route.ts`, add the import at the top (after the `validateSession` import on line 9):

```ts
import { deleteAllUserSessions } from "@/lib/mongo/sessions";
```

Then, in the body, right after `await updateUserPassword(mongoUser._id, newHash);` (line 111), add:

```ts

    // Invalida tutte le altre sessioni attive dopo il cambio password
    // (design spec §3): non tocca la richiesta corrente, che non si
    // ri-valida da sola dopo la scrittura.
    await deleteAllUserSessions(mongoUser._id);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/auth/change-password/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/change-password/route.ts src/app/api/auth/change-password/route.test.ts
git commit -m "feat: invalidate other sessions when a user changes their password"
```

---

## Task 3: `password_reset_tokens` collection

**Files:**
- Create: `src/lib/mongo/password-reset-tokens.ts`
- Test: `src/lib/mongo/password-reset-tokens.test.ts`

**Interfaces:**
- Consumes: `getDb` from `./client`
- Produces:
  - `createPasswordResetToken(userId: string, meta?: { requestIp?: string; userAgent?: string }): Promise<{ rawToken: string; expiresAt: Date }>`
  - `findValidPasswordResetToken(rawToken: string): Promise<{ _id: string; userId: string } | null>`
  - `markPasswordResetTokenUsed(id: string): Promise<void>`
  - `ensurePasswordResetTokenIndexes(): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/mongo/password-reset-tokens.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const updateMany = vi.fn();
const findOne = vi.fn();
const updateOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: () => ({ insertOne, updateMany, findOne, updateOne, createIndex }),
  }),
}));

import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "./password-reset-tokens";
import { createHash } from "node:crypto";

describe("password-reset-tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertOne.mockResolvedValue({ insertedId: { toString: () => "id1" } });
  });

  it("creates a token, invalidates prior ones, and stores only the hash", async () => {
    const { rawToken, expiresAt } = await createPasswordResetToken("user-1");

    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(updateMany).toHaveBeenCalledWith(
      { userId: "user-1", usedAt: null },
      { $set: { usedAt: expect.any(Date) } }
    );
    const insertedDoc = insertOne.mock.calls[0][0];
    expect(insertedDoc.tokenHash).toBe(createHash("sha256").update(rawToken).digest("hex"));
    expect(insertedDoc.tokenHash).not.toBe(rawToken);
  });

  it("finds a token by its raw value via hash lookup", async () => {
    findOne.mockResolvedValue({ _id: { toString: () => "id1" }, userId: "user-1" });

    const found = await findValidPasswordResetToken("deadbeef");

    expect(findOne).toHaveBeenCalledWith({
      tokenHash: createHash("sha256").update("deadbeef").digest("hex"),
      usedAt: null,
      expiresAt: { $gt: expect.any(Date) },
    });
    expect(found).toEqual({ _id: "id1", userId: "user-1" });
  });

  it("returns null when no matching token exists", async () => {
    findOne.mockResolvedValue(null);
    const found = await findValidPasswordResetToken("nope");
    expect(found).toBeNull();
  });

  it("marks a token used by id", async () => {
    await markPasswordResetTokenUsed("id1");
    expect(updateOne).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mongo/password-reset-tokens.test.ts`
Expected: FAIL — module `./password-reset-tokens` doesn't exist yet.

- [ ] **Step 3: Implement the collection module**

Create `src/lib/mongo/password-reset-tokens.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/mongo/password-reset-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mongo/password-reset-tokens.ts src/lib/mongo/password-reset-tokens.test.ts
git commit -m "feat: add password_reset_tokens collection with TTL index"
```

---

## Task 4: Email module — Resend client + reset-password template (implemented) and Brevo/other templates (typed stubs)

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/lib/email/brevo.ts`
- Create: `src/lib/email/templates/reset-password.ts`
- Create: `src/lib/email/templates/verify-email.ts`
- Create: `src/lib/email/templates/booking-confirmation.ts`
- Create: `src/lib/email/templates/event-reminder.ts`
- Create: `src/lib/email/templates/newsletter.ts`
- Create: `src/lib/email/send-email.ts`
- Test: `src/lib/email/send-email.test.ts`
- Modify: `package.json` (add `resend` dependency)
- Modify: `src/messages/it.json`, `src/messages/ar.json` (new `email` namespace)

**Interfaces:**
- Produces:
  - `sendPasswordResetEmail(params: { to: string; resetUrl: string; locale: "it" | "ar"; expirationMinutes: number }): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }>`
  - `sendVerificationEmail`, `sendBookingConfirmationEmail`, `sendEventReminderEmail`, `sendNewsletter` — same `{ ok, ... }` shape, all throw `Error("not implemented")` when called (stubs)

- [ ] **Step 1: Add the `resend` dependency**

Run: `npm install resend`

- [ ] **Step 2: Add `email` translation keys**

In `src/messages/it.json`, add a top-level `"email"` key (merge into the existing JSON object, don't replace other keys):

```json
"email": {
  "resetPassword": {
    "subject": "Reimposta la tua password",
    "title": "Reimposta la tua password",
    "intro": "Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account presso Chiesa San Marco.",
    "button": "Reimposta la password",
    "altLinkLabel": "Se il pulsante non funziona, copia e incolla questo link nel browser:",
    "expiry": "Questo link scade tra {minutes} minuti.",
    "ignore": "Se non hai richiesto tu questa operazione, puoi ignorare questa email: la tua password non verrà modificata."
  }
}
```

In `src/messages/ar.json`, add the matching namespace:

```json
"email": {
  "resetPassword": {
    "subject": "إعادة تعيين كلمة المرور الخاصة بك",
    "title": "إعادة تعيين كلمة المرور الخاصة بك",
    "intro": "تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في كنيسة مار مرقس.",
    "button": "إعادة تعيين كلمة المرور",
    "altLinkLabel": "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
    "expiry": "ينتهي صلاحية هذا الرابط خلال {minutes} دقيقة.",
    "ignore": "إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة: لن يتم تغيير كلمة المرور الخاصة بك."
  }
}
```

- [ ] **Step 3: Write the failing test for send-email dispatch**

Create `src/lib/email/send-email.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send } })),
}));

import { sendPasswordResetEmail } from "./send-email";

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM_AUTH", "noreply@auth.example.com");
  });

  it("sends via Resend and returns the message id", async () => {
    send.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result).toEqual({ ok: true, messageId: "msg_123" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "utente@example.com",
        from: "noreply@auth.example.com",
      })
    );
  });

  it("returns a generic failure without leaking provider error details when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns a generic failure when the provider errors", async () => {
    send.mockResolvedValue({ data: null, error: { message: "network down" } });

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result).toEqual({ ok: false, error: "send_failed" });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/email/send-email.test.ts`
Expected: FAIL — none of the email module files exist yet.

- [ ] **Step 5: Implement `resend.ts`**

Create `src/lib/email/resend.ts`:

```ts
/**
 * Wrapper sottile attorno al client Resend. Usato solo per la categoria
 * "auth/security" (vedi design spec §1, §7). Non importare mai
 * RESEND_API_KEY o questo modulo in codice client-side.
 *
 * ⚠️ Solo lato server.
 */
import { Resend } from "resend";

let client: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  client = apiKey ? new Resend(apiKey) : null;
  return client;
}
```

- [ ] **Step 6: Implement `brevo.ts` (client wrapper, unused by any real send in this pass)**

Create `src/lib/email/brevo.ts`:

```ts
/**
 * Wrapper sottile attorno alle API Brevo (transactional email), usato per
 * la categoria "eventi/comunicazioni" (vedi design spec §1, §7). Nessun
 * chiamante reale in questa fase: solo predisposto per i template stub in
 * ./templates/booking-confirmation.ts, event-reminder.ts, newsletter.ts.
 *
 * ⚠️ Solo lato server.
 */

const BREVO_SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface BrevoSendParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface BrevoSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendViaBrevo(params: BrevoSendParams): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "provider_not_configured" };

  try {
    const res = await fetch(BREVO_SEND_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: params.from },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        replyTo: params.replyTo ? { email: params.replyTo } : undefined,
      }),
    });

    if (!res.ok) return { ok: false, error: "send_failed" };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
```

- [ ] **Step 7: Implement the reset-password template**

Create `src/lib/email/templates/reset-password.ts`:

```ts
import { getTranslations } from "next-intl/server";

export interface ResetPasswordTemplateParams {
  resetUrl: string;
  locale: "it" | "ar";
  expirationMinutes: number;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export async function renderResetPasswordEmail(
  params: ResetPasswordTemplateParams
): Promise<RenderedEmail> {
  const t = await getTranslations({ locale: params.locale, namespace: "email.resetPassword" });
  const dir = params.locale === "ar" ? "rtl" : "ltr";

  const subject = t("subject");
  const expiry = t("expiry", { minutes: params.expirationMinutes });

  const html = `<!doctype html>
<html lang="${params.locale}" dir="${dir}">
  <body style="margin:0;padding:0;background-color:#f7f5f0;font-family:Georgia,serif;">
    <table role="presentation" width="100%" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" style="background:#ffffff;border-radius:8px;padding:32px;text-align:${dir === "rtl" ? "right" : "left"};">
            <tr><td>
              <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 16px;">${t("title")}</h1>
              <p style="font-size:15px;color:#333;line-height:1.5;">${t("intro")}</p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${params.resetUrl}" style="background:#b8860b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;">${t("button")}</a>
              </p>
              <p style="font-size:13px;color:#666;">${t("altLinkLabel")}</p>
              <p style="font-size:13px;color:#b8860b;word-break:break-all;">${params.resetUrl}</p>
              <p style="font-size:13px;color:#666;">${expiry}</p>
              <p style="font-size:13px;color:#999;margin-top:24px;">${t("ignore")}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${t("title")}\n\n${t("intro")}\n\n${params.resetUrl}\n\n${expiry}\n\n${t("ignore")}`;

  return { subject, html, text };
}
```

- [ ] **Step 8: Implement stub templates**

Create `src/lib/email/templates/verify-email.ts`:

```ts
/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7). */
export interface VerifyEmailTemplateParams {
  verifyUrl: string;
  locale: "it" | "ar";
}
export async function renderVerifyEmail(
  _params: VerifyEmailTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  throw new Error("not implemented");
}
```

Create `src/lib/email/templates/booking-confirmation.ts`:

```ts
/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface BookingConfirmationTemplateParams {
  eventName: string;
  eventDate: string;
  locale: "it" | "ar";
}
export async function renderBookingConfirmationEmail(
  _params: BookingConfirmationTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  throw new Error("not implemented");
}
```

Create `src/lib/email/templates/event-reminder.ts`:

```ts
/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface EventReminderTemplateParams {
  eventName: string;
  eventDate: string;
  locale: "it" | "ar";
}
export async function renderEventReminderEmail(
  _params: EventReminderTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  throw new Error("not implemented");
}
```

Create `src/lib/email/templates/newsletter.ts`:

```ts
/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface NewsletterTemplateParams {
  title: string;
  bodyHtml: string;
  locale: "it" | "ar";
}
export async function renderNewsletterEmail(
  _params: NewsletterTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  throw new Error("not implemented");
}
```

- [ ] **Step 9: Implement `send-email.ts` (dispatch layer)**

Create `src/lib/email/send-email.ts`:

```ts
/**
 * Funzioni tipizzate di invio email, una per categoria. Resend per
 * auth/security, Brevo per eventi/comunicazioni — un solo provider per
 * categoria, nessun invio doppio (design spec §1). Non logga mai token,
 * password, API key o corpo completo dell'email: solo categoria,
 * provider, esito, message id (design spec §7, §10).
 *
 * ⚠️ Solo lato server.
 */

import { getResendClient } from "./resend";
import { sendViaBrevo } from "./brevo";
import { renderResetPasswordEmail } from "./templates/reset-password";

export type SendEmailResult = { ok: true; messageId?: string } | { ok: false; error: string };

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  locale: "it" | "ar";
  expirationMinutes: number;
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    console.error("[email] reset-password send skipped: RESEND_API_KEY not configured");
    return { ok: false, error: "provider_not_configured" };
  }

  const from = process.env.EMAIL_FROM_AUTH || "onboarding@resend.dev";
  const replyTo = process.env.EMAIL_REPLY_TO;

  try {
    const { subject, html, text } = await renderResetPasswordEmail({
      resetUrl: params.resetUrl,
      locale: params.locale,
      expirationMinutes: params.expirationMinutes,
    });

    const { data, error } = await client.emails.send({
      to: params.to,
      from,
      subject,
      html,
      text,
      replyTo,
    });

    if (error || !data) {
      console.error("[email] reset-password send failed", { provider: "resend" });
      return { ok: false, error: "send_failed" };
    }

    console.log("[email] reset-password sent", { provider: "resend", messageId: data.id });
    return { ok: true, messageId: data.id };
  } catch {
    console.error("[email] reset-password send threw", { provider: "resend" });
    return { ok: false, error: "send_failed" };
  }
}

/** Stub — vedi design spec §7, §11. Non collegato a nessun flusso reale. */
export async function sendVerificationEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. Non collegato a registrations.ts. */
export async function sendBookingConfirmationEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. Non collegato a registrations.ts. */
export async function sendEventReminderEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. */
export async function sendNewsletter(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

// Riesportato per completezza del modulo Brevo predisposto (design spec §7).
export { sendViaBrevo };
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run src/lib/email/send-email.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/lib/email src/messages/it.json src/messages/ar.json
git commit -m "feat: add email module (Resend implemented, Brevo stubbed)"
```

---

## Task 5: Rate limiting for forgot/reset-password

**Files:**
- Create: `src/lib/auth/password-reset-rate-limit.ts`
- Test: `src/lib/auth/password-reset-rate-limit.test.ts`

**Interfaces:**
- Consumes: `getRedis` from `@/lib/redis/client` (existing)
- Produces:
  - `isForgotPasswordRateLimited(ip: string, email: string): Promise<boolean>`
  - `recordForgotPasswordAttempt(ip: string, email: string): Promise<void>`
  - `isResetPasswordRateLimited(ip: string): Promise<boolean>`
  - `recordResetPasswordAttempt(ip: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth/password-reset-rate-limit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/redis/client", () => ({ getRedis: vi.fn(() => null) }));

import {
  isForgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "./password-reset-rate-limit";

describe("forgot-password rate limiting (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("is not limited before any attempts", async () => {
    const limited = await isForgotPasswordRateLimited("1.2.3.4", `fresh-${Date.now()}@x.com`);
    expect(limited).toBe(false);
  });

  it("limits after exceeding the per-email threshold", async () => {
    const email = `test-${Date.now()}@example.com`;
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) {
      await recordForgotPasswordAttempt(ip, email);
    }
    const limited = await isForgotPasswordRateLimited(ip, email);
    expect(limited).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/password-reset-rate-limit.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement the rate limiter**

Create `src/lib/auth/password-reset-rate-limit.ts`:

```ts
/**
 * Rate limiting per forgot-password / reset-password. Stesso pattern
 * null-fallback di src/lib/auth/rate-limit.ts (design spec §6).
 */

import { getRedis } from "@/lib/redis/client";

const EMAIL_MAX_PER_MINUTE = 1;
const EMAIL_MAX_PER_DAY = 5;
const IP_MAX_PER_MINUTE = 5;
const IP_MAX_PER_DAY = 20;
const RESET_IP_MAX_PER_HOUR = 20;

const MINUTE = 60;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

interface WindowRecord {
  count: number;
  firstAt: number;
}

const memory = new Map<string, WindowRecord>();

async function incrWithWindow(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return count;
  }
  const record = memory.get(key);
  if (!record || Date.now() - record.firstAt > windowSeconds * 1000) {
    memory.set(key, { count: 1, firstAt: Date.now() });
    return 1;
  }
  record.count++;
  return record.count;
}

async function getCount(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    return (await redis.get<number>(key)) ?? 0;
  }
  const record = memory.get(key);
  if (!record || Date.now() - record.firstAt > windowSeconds * 1000) return 0;
  return record.count;
}

export async function isForgotPasswordRateLimited(ip: string, email: string): Promise<boolean> {
  const [emailMinute, emailDay, ipMinute, ipDay] = await Promise.all([
    getCount(`ratelimit:forgot-password:email:${email}:m`, MINUTE),
    getCount(`ratelimit:forgot-password:email:${email}:d`, DAY),
    getCount(`ratelimit:forgot-password:ip:${ip}:m`, MINUTE),
    getCount(`ratelimit:forgot-password:ip:${ip}:d`, DAY),
  ]);
  return (
    emailMinute >= EMAIL_MAX_PER_MINUTE ||
    emailDay >= EMAIL_MAX_PER_DAY ||
    ipMinute >= IP_MAX_PER_MINUTE ||
    ipDay >= IP_MAX_PER_DAY
  );
}

export async function recordForgotPasswordAttempt(ip: string, email: string): Promise<void> {
  await Promise.all([
    incrWithWindow(`ratelimit:forgot-password:email:${email}:m`, MINUTE),
    incrWithWindow(`ratelimit:forgot-password:email:${email}:d`, DAY),
    incrWithWindow(`ratelimit:forgot-password:ip:${ip}:m`, MINUTE),
    incrWithWindow(`ratelimit:forgot-password:ip:${ip}:d`, DAY),
  ]);
}

export async function isResetPasswordRateLimited(ip: string): Promise<boolean> {
  const count = await getCount(`ratelimit:reset-password:ip:${ip}`, HOUR);
  return count >= RESET_IP_MAX_PER_HOUR;
}

export async function recordResetPasswordAttempt(ip: string): Promise<void> {
  await incrWithWindow(`ratelimit:reset-password:ip:${ip}`, HOUR);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/password-reset-rate-limit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password-reset-rate-limit.ts src/lib/auth/password-reset-rate-limit.test.ts
git commit -m "feat: add rate limiting for forgot/reset-password"
```

---

## Task 6: `POST /api/auth/forgot-password`

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`
- Test: `src/app/api/auth/forgot-password/route.test.ts`

**Interfaces:**
- Consumes: `findUserByEmail` (`@/lib/mongo/users`), `createPasswordResetToken` (Task 3), `sendPasswordResetEmail` (Task 4), `isForgotPasswordRateLimited`/`recordForgotPasswordAttempt` (Task 5), `getClientIp` (`@/lib/auth/rate-limit`)

- [ ] **Step 1: Write the failing test**

Create `src/app/api/auth/forgot-password/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/users", () => ({ findUserByEmail: vi.fn() }));
vi.mock("@/lib/mongo/password-reset-tokens", () => ({
  createPasswordResetToken: vi.fn(),
}));
vi.mock("@/lib/email/send-email", () => ({ sendPasswordResetEmail: vi.fn() }));
vi.mock("@/lib/auth/password-reset-rate-limit", () => ({
  isForgotPasswordRateLimited: vi.fn().mockResolvedValue(false),
  recordForgotPasswordAttempt: vi.fn(),
}));

import { POST } from "./route";
import { findUserByEmail } from "@/lib/mongo/users";
import { createPasswordResetToken } from "@/lib/mongo/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-email";
import { isForgotPasswordRateLimited } from "@/lib/auth/password-reset-rate-limit";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the same generic response whether the user exists or not", async () => {
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const resUnknown = await POST(mockRequest({ email: "nobody@example.com" }));
    const jsonUnknown = await resUnknown.json();

    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      email: "known@example.com",
    });
    (createPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      rawToken: "abc",
      expiresAt: new Date(),
    });
    (sendPasswordResetEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const resKnown = await POST(mockRequest({ email: "known@example.com" }));
    const jsonKnown = await resKnown.json();

    expect(jsonUnknown).toEqual(jsonKnown);
    expect(jsonKnown.success).toBe(true);
  });

  it("sends the email only when the user exists", async () => {
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      email: "known@example.com",
    });
    (createPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      rawToken: "abc",
      expiresAt: new Date(),
    });
    (sendPasswordResetEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await POST(mockRequest({ email: "known@example.com" }));

    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("rejects malformed email with a 400", async () => {
    const res = await POST(mockRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns the generic success response without sending when rate limited", async () => {
    (isForgotPasswordRateLimited as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      email: "known@example.com",
    });

    const res = await POST(mockRequest({ email: "known@example.com" }));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/auth/forgot-password/route.test.ts`
Expected: FAIL — route file doesn't exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/auth/forgot-password/route.ts`:

```ts
import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/mongo/users";
import { createPasswordResetToken } from "@/lib/mongo/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-email";
import {
  isForgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESPONSE = {
  success: true,
  message:
    "Se l'indirizzo è associato a un account, riceverai una email con le istruzioni per reimpostare la password.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Indirizzo email non valido" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);

    if (await isForgotPasswordRateLimited(ip, email)) {
      // Risposta generica identica, nessun invio: non rivela il rate limit al client.
      return NextResponse.json(GENERIC_RESPONSE);
    }
    await recordForgotPasswordAttempt(ip, email);

    const user = await findUserByEmail(email);
    if (user) {
      const { rawToken, expiresAt } = await createPasswordResetToken(user._id, {
        requestIp: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;
      const expirationMinutes = Math.max(
        1,
        Math.round((expiresAt.getTime() - Date.now()) / 60000)
      );

      const result = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        locale: "it",
        expirationMinutes,
      });
      if (!result.ok) {
        console.error("[forgot-password] send failed", { error: result.error });
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("Errore POST /api/auth/forgot-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/auth/forgot-password/route.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/forgot-password
git commit -m "feat: add POST /api/auth/forgot-password"
```

---

## Task 7: `POST /api/auth/reset-password`

**Files:**
- Create: `src/app/api/auth/reset-password/route.ts`
- Test: `src/app/api/auth/reset-password/route.test.ts`

**Interfaces:**
- Consumes: `findValidPasswordResetToken`, `markPasswordResetTokenUsed` (Task 3), `validatePasswordRules` (existing), `hashPassword` (existing), `updateUserPassword`, `setPasswordChangedAt` (Task 1), `deleteAllUserSessions` (Task 1), `isResetPasswordRateLimited`/`recordResetPasswordAttempt` (Task 5)

- [ ] **Step 1: Write the failing test**

Create `src/app/api/auth/reset-password/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/password-reset-tokens", () => ({
  findValidPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
}));
vi.mock("@/lib/mongo/users", () => ({
  updateUserPassword: vi.fn(),
  setPasswordChangedAt: vi.fn(),
  setHasPassword: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({ deleteAllUserSessions: vi.fn() }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("newhash") }));
vi.mock("@/lib/auth/password-reset-rate-limit", () => ({
  isResetPasswordRateLimited: vi.fn().mockResolvedValue(false),
  recordResetPasswordAttempt: vi.fn(),
}));

import { POST } from "./route";
import {
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/mongo/password-reset-tokens";
import { updateUserPassword, setPasswordChangedAt, setHasPassword } from "@/lib/mongo/users";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a missing token", async () => {
    const res = await POST(mockRequest({ token: "", newPassword: "Valid123!" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid or expired token with a generic message", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(mockRequest({ token: "bad", newPassword: "Valid123!" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Link non valido o scaduto");
  });

  it("rejects a weak password", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });
    const res = await POST(mockRequest({ token: "good", newPassword: "weak" }));
    expect(res.status).toBe(400);
  });

  it("resets the password, marks the token used, and invalidates other sessions", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });

    const res = await POST(mockRequest({ token: "good", newPassword: "Valid123!" }));
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith("u1", "newhash");
    expect(setHasPassword).toHaveBeenCalledWith("u1", true);
    expect(setPasswordChangedAt).toHaveBeenCalledWith("u1");
    expect(markPasswordResetTokenUsed).toHaveBeenCalledWith("tok1");
    expect(deleteAllUserSessions).toHaveBeenCalledWith("u1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/auth/reset-password/route.test.ts`
Expected: FAIL — route file and `setHasPassword` don't exist yet.

- [ ] **Step 3: Add `setHasPassword` to `users.ts`**

In `src/lib/mongo/users.ts`, right after `setPasswordChangedAt` (added in Task 1):

```ts
export async function setHasPassword(id: string, value: boolean): Promise<void> {
  const c = await col();
  if (!ObjectId.isValid(id)) return;
  await c.updateOne({ _id: new ObjectId(id) }, { $set: { hasPassword: value } });
}
```

- [ ] **Step 4: Implement the route**

Create `src/app/api/auth/reset-password/route.ts`:

```ts
import { NextResponse } from "next/server";
import {
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/mongo/password-reset-tokens";
import { updateUserPassword, setPasswordChangedAt, setHasPassword } from "@/lib/mongo/users";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import {
  isResetPasswordRateLimited,
  recordResetPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";

const INVALID_TOKEN_RESPONSE = { success: false, error: "Link non valido o scaduto" };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Token e nuova password richiesti" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    if (await isResetPasswordRateLimited(ip)) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }
    await recordResetPasswordAttempt(ip);

    const passwordRules = validatePasswordRules(newPassword);
    if (Object.values(passwordRules).some((rule) => !rule)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La nuova password deve contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale",
        },
        { status: 400 }
      );
    }

    const tokenDoc = await findValidPasswordResetToken(token);
    if (!tokenDoc) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(tokenDoc.userId, newHash);
    await setHasPassword(tokenDoc.userId, true);
    await setPasswordChangedAt(tokenDoc.userId);
    await markPasswordResetTokenUsed(tokenDoc._id);
    await deleteAllUserSessions(tokenDoc.userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/reset-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/api/auth/reset-password/route.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/mongo/users.ts src/app/api/auth/reset-password
git commit -m "feat: add POST /api/auth/reset-password"
```

---

## Task 8: Frontend — `/forgot-password` page + login link

**Files:**
- Create: `src/app/(main)/forgot-password/page.tsx`
- Modify: `src/components/auth/LoginModal.tsx` (add link)

**Interfaces:**
- Consumes: `POST /api/auth/forgot-password` (Task 6)

- [ ] **Step 1: Locate the login form's submit button in `LoginModal.tsx`**

Run: `grep -n "type=\"submit\"" src/components/auth/LoginModal.tsx`

Read the ~15 lines around the match to find the right insertion point (directly below the password field, above the submit button, matching the existing modal's JSX structure and Tailwind classes already used elsewhere in that file — reuse the same `text-sm text-foreground/60 hover:text-accent` -style classes visible on other secondary links in that file, do not invent new ones).

- [ ] **Step 2: Add the "Password dimenticata?" link**

Add a `<Link href="/forgot-password" className="...">Password dimenticata?</Link>` (using `next/link`, matching existing import conventions in the file) in that location, closing the modal via the same handler used by other in-modal navigation links if one exists (check how `RegisterModal` is opened from `LoginModal` for the pattern — likely a context setter from `AuthContext`).

- [ ] **Step 3: Create the forgot-password page**

Create `src/app/(main)/forgot-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok && data?.error) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow mb-2 text-accent">Accesso</p>
      <h1 className="font-display mb-4 text-2xl text-foreground">Password dimenticata?</h1>

      {submitted ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
          Se l&apos;indirizzo è associato a un account, riceverai una email con le istruzioni
          per reimpostare la password.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-foreground/60">
            Inserisci il tuo indirizzo email: ti invieremo un link per reimpostare la password.
          </p>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-foreground/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
          >
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 text-center text-sm text-foreground/60 hover:text-accent">
        Torna al login
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, navigate to `/forgot-password`, submit a real (existing) test-user email against a dev DB with `RESEND_API_KEY` unset. Confirm: generic success message shown, no error thrown, server console logs `provider_not_configured` (expected, since no key is set locally) rather than crashing.

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/forgot-password src/components/auth/LoginModal.tsx
git commit -m "feat: add forgot-password page and login link"
```

---

## Task 9: Frontend — `/reset-password` page

**Files:**
- Create: `src/app/(main)/reset-password/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/reset-password` (Task 7), `validatePasswordRules` (existing, for live client-side rule display)

- [ ] **Step 1: Create the reset-password page**

Create `src/app/(main)/reset-password/page.tsx`:

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validatePasswordRules } from "@/lib/auth/password-rules";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rules = validatePasswordRules(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link non valido o scaduto");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono");
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError("La password non soddisfa tutti i requisiti richiesti");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Link non valido o scaduto");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
        Link non valido o scaduto.{" "}
        <Link href="/forgot-password" className="text-accent hover:underline">
          Richiedi un nuovo link
        </Link>
        .
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
        Password aggiornata. Verrai reindirizzato alla pagina di accesso...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-foreground/80">
          Nuova password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm text-foreground/80">
          Conferma password
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </div>
      <ul className="space-y-1 text-xs text-foreground/60">
        <li className={rules.length ? "text-green-600" : ""}>Almeno 8 caratteri</li>
        <li className={rules.lowercase ? "text-green-600" : ""}>Una lettera minuscola</li>
        <li className={rules.uppercase ? "text-green-600" : ""}>Una lettera maiuscola</li>
        <li className={rules.number ? "text-green-600" : ""}>Un numero</li>
        <li className={rules.special ? "text-green-600" : ""}>Un carattere speciale</li>
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
      >
        {loading ? "Salvataggio..." : "Reimposta password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow mb-2 text-accent">Accesso</p>
      <h1 className="font-display mb-4 text-2xl text-foreground">Reimposta la tua password</h1>
      <Suspense fallback={<p className="text-sm text-foreground/60">Caricamento...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, visit `/reset-password` with no token (expect the invalid-link message), then with a bogus token (expect the API's generic error after submit), then generate a real token via a local forgot-password request and complete the flow end to end against the dev DB.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/reset-password
git commit -m "feat: add reset-password page"
```

---

## Task 10: Env vars, README, PROJECT_CONTEXT.md

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `PROJECT_CONTEXT.md`

**Interfaces:** none (documentation only)

- [ ] **Step 1: Check whether `.env.example` exists**

Run: `ls -la .env.example 2>/dev/null || echo "not found"` — if not found, check `PROJECT_CONTEXT.md`/`README.md` for the actual filename used (spec §9 assumed `.env.example`; confirm before editing).

- [ ] **Step 2: Append the new env vars**

Add to the env example file, after the existing OAuth block:

```env
# Email transazionali — reset password, verifica account (Resend)
RESEND_API_KEY=
EMAIL_FROM_AUTH=
EMAIL_REPLY_TO=
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60

# Email eventi/comunicazioni — conferme, promemoria, newsletter (Brevo)
BREVO_API_KEY=
EMAIL_FROM_EVENTS=
EMAIL_FROM_NEWSLETTER=
```

- [ ] **Step 3: Update `README.md`**

Read the current README's structure first (`Read README.md`), then add a section (matching its existing heading style/language) covering: the forgot-password feature description, how to get a Resend API key and a Brevo API key for local dev, what happens when the keys are unset (generic response still returned, send skipped, logged), how to configure `EMAIL_FROM_AUTH`/`EMAIL_FROM_EVENTS`/`EMAIL_FROM_NEWSLETTER` and `EMAIL_REPLY_TO`, a short SPF/DKIM/DMARC checklist for the production sending domain, and the warning not to use a personal Gmail address as the production sender. Also add `npx vitest run` (or the project's existing test/lint/typecheck commands, copied verbatim from `package.json` scripts) to any "development flow" section if one exists.

- [ ] **Step 4: Update `PROJECT_CONTEXT.md`**

Read the current file's structure first. Update (not just append) the auth section to describe: the new forgot/reset-password flow and endpoints, the `password_reset_tokens` collection and its TTL index, the `passwordChangedAt` session-invalidation mechanism and how it differs from `admin_session`'s deny-list, the honest-stub state of `deleteUserSession`, the Resend/Brevo split and which is wired vs. stubbed, the new env vars, and the `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` default. If the file has a known-limitations/tech-debt section (referenced earlier as existing, e.g. around session revocation), update it to reflect the new state rather than leaving the old "no session persistence" note unqualified.

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md PROJECT_CONTEXT.md
git commit -m "docs: document password reset flow, session invalidation, and email env vars"
```

---

## Task 11: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including every test file created in Tasks 1–7.

- [ ] **Step 2: Run lint and type-check**

Run: `npm run lint`
Run: `npx tsc --noEmit`
Expected: no errors introduced by this feature (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 3: Confirm no secrets committed**

Run: `git log --oneline main..feature/password-reset-email-service` then `git diff main...feature/password-reset-email-service -- .env.example` to confirm only empty-value placeholders were added, no real keys.

- [ ] **Step 4: Commit any fixups**

If lint/type-check reveal issues, fix them and commit as `fix: address lint/type-check issues in password reset feature`.

---

## Task 12: Code review, optional visual check, PR

**Files:** none (process only)

- [ ] **Step 1: Run the code-review skill** against the full diff on this branch (`git diff main...feature/password-reset-email-service`). Apply pertinent, well-justified fixes as new commits.

- [ ] **Step 2 (optional, if `claude-in-chrome` MCP is available and dev server can run):** With `npm run dev` running, open `/forgot-password` in Chrome, submit a test address, confirm the generic message renders; open `/reset-password` with no token, with a bogus token, and — if a real token can be generated locally against a dev DB — with a valid one. Report any layout/responsiveness/accessibility issues found and fix them. Do not send real email; use a local/dev environment only.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin feature/password-reset-email-service
gh pr create --title "feat: password reset flow + Resend/Brevo email service foundation" --body "$(cat <<'EOF'
## Summary
- Implements the full "Password dimenticata?" flow: forgot/reset-password pages, API endpoints, hashed+TTL-indexed reset tokens, Resend email delivery.
- Adds a typed email module split by category (Resend: auth/security, Brevo: events/comms) — this pass wires Resend for password reset only; Brevo is a typed stub, not connected to booking/event flows yet.
- Fixes a pre-existing gap: `user_session` was a fully stateless JWT with no server-side invalidation hook. Adds `passwordChangedAt` on `UserProfile`, checked against the JWT's `iat` in `validateUserSession`, and wires it into both reset-password and change-password. `admin_session` is untouched (different mechanism, unchanged).

## New environment variables
`RESEND_API_KEY`, `BREVO_API_KEY`, `EMAIL_FROM_AUTH`, `EMAIL_FROM_EVENTS`, `EMAIL_FROM_NEWSLETTER`, `EMAIL_REPLY_TO`, `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES`

## Design doc
docs/superpowers/specs/2026-09-15-password-reset-email-service-design.md

## Test plan
- [ ] `npm run test` passes
- [ ] `npm run lint` / `npx tsc --noEmit` clean
- [ ] Manual: forgot-password with unknown/known email, reset-password with missing/invalid/expired/valid token
- [ ] Confirm no secrets in `.env.example` diff
EOF
)"
```

Report the PR URL back to the user.
