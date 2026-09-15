# Password reset + email service (Resend/Brevo split) — Design

Status: approved, ready for implementation plan.

## 1. Scope

Implement "Password dimenticata?" end to end (frontend pages, API endpoints,
DB collection, Resend email), and lay the foundation for a general email
service split between two providers by category:

- **Resend** (server API, `RESEND_API_KEY`): auth/security email — password
  reset (this feature), and typed function signatures for future
  verify-email / registration-confirmation / OTP / sensitive-action email.
- **Brevo** (server API, `BREVO_API_KEY`): events/comms email — typed
  function signatures for booking confirmation/change/cancellation, event
  reminder, newsletter. **Not wired into `registrations.ts` / `content.ts`
  in this pass** — only the module and signatures are built, per YAGNI (no
  dead schema fields added until a real caller exists).

One category → one provider. No dual-send, no automatic fallback between
providers (would risk duplicate email).

## 2. Existing architecture this design builds on

- Users: MongoDB `users` collection, `src/lib/mongo/users.ts`,
  `UserProfile` in `src/types/index.ts`. `hasPassword?: boolean` (absent =
  true) marks OAuth-only accounts.
- Password hashing: bcryptjs, cost 12, `src/lib/auth/password.ts`.
- Sessions: stateless HMAC-SHA256 JWTs via `src/lib/auth/jwt.ts`
  (`signJwt`/`verifyJwt`), already always including `iat`/`exp` in seconds.
  Two independent cookies/systems:
  - `admin_session` (`src/lib/auth/session.ts`): per-token deny-list in
    Redis (`getRedis()`, null-fallback to in-memory `Set`), keyed by the
    exact token string.
  - `user_session` (`src/lib/mongo/sessions.ts`): **currently fully
    stateless**, no server-side hook at all. `deleteUserSession` and
    `deleteAllUserSessions` exist as **silent no-op stubs**.
- Redis: `src/lib/redis/client.ts`, `getRedis()` returns `Redis | null`
  (Upstash HTTP client), every caller must handle the null case with an
  in-memory fallback (see `rate-limit.ts`, `session.ts`).
- Collection-with-TTL-index pattern:
  `src/lib/mongo/pending-oauth-registrations.ts` — each collection module
  owns a lazy, idempotent `ensureIndexes()`, called on first write. This is
  the template for the new token collection.
- API route convention: plain Next.js route handlers, manual validation (no
  zod anywhere in the repo — **not introduced here**), response envelope
  `{ success: boolean, error?: string, ...data }`, try/catch →
  `console.error` + generic 500.
- i18n: `next-intl`, locales `it` and `ar` only (no Coptic — confirmed
  absent from the repo despite being mentioned in the original request).
  Server-side translation via `getTranslations` from `next-intl/server`,
  already used outside JSX in several server components — reusable as-is
  for building email HTML strings.
- Frontend: no shared component library, no shadcn/ui. Raw Tailwind 4 with
  semantic tokens in `globals.css`. Login today is a **modal**
  (`LoginModal.tsx`), not a page.

## 3. Session invalidation after password change — resolved design

This was the one open architectural question, resolved with the user
before writing this spec:

**Finding:** `user_session` is a purely stateless JWT. `iat` is already
included in every signed token (`jwt.ts` always sets it — no change needed
there). There is no per-token or per-user server-side state today: the
`admin_session` deny-list mechanism doesn't apply, because at reset time we
don't know the JWT of the user's other active sessions (different
device/browser), so a deny-list can't reach them.

**Decision: `passwordChangedAt` + `iat` comparison.**

- Add `passwordChangedAt?: string` (ISO 8601, same convention as the
  existing `updatedAt` field on `UserProfile`) to `UserProfile`
  (`src/types/index.ts`) and set it in `src/lib/mongo/users.ts` every time
  a password is set: reset-password, change-password, and (implicitly)
  when an OAuth-only account sets its first password via reset.
- Extend `validateUserSession` (`src/lib/mongo/sessions.ts`) to, after
  verifying the JWT, look up the user's `passwordChangedAt` and reject the
  session if the token was issued at or before that timestamp:
  `payload.iat <= Math.floor(Date.parse(user.passwordChangedAt) / 1000)`
  → session invalid, return `null`.
- **Clock skew / granularity:** `iat` is Unix seconds; `passwordChangedAt`
  is stored as an ISO string with millisecond precision. Normalize by
  truncating `passwordChangedAt` to whole seconds
  (`Math.floor(Date.parse(passwordChangedAt) / 1000)`) before comparing,
  and use `<=` (not `<`) so a token issued in the *same second* as the
  password change is treated as stale/pre-change rather than ambiguously
  accepted. This is intentionally conservative: worst case, a session
  created in the same second as a password change requires a fresh login,
  which is an acceptable cost for a case that should not occur in the
  reset-password flow (see next point) and is rare in change-password.
- **No session reuse across reset:** `POST /api/auth/reset-password` does
  not create or return a `user_session` cookie. The reset-password page
  redirects to login on success; the user authenticates explicitly via
  `POST /api/auth/login`, which calls `createUserSession` **after** the
  password update has already committed and after `passwordChangedAt` has
  been written. This guarantees the new session's `iat` is strictly later
  than `passwordChangedAt`, with no reliance on same-second edge case
  handling for this path.
- **`change-password` gets the same fix in this pass.** It currently calls
  `updateUserPassword` with no session invalidation at all — same gap,
  fixed by the same `passwordChangedAt` write. Unlike reset-password, this
  path *does* run inside an existing session (the user is already logged
  in when changing their password), so the `<=` truncation-to-seconds rule
  above is what protects the *current* request's session from being
  self-invalidated by its own change: the fix is applied only to
  *subsequent* `validateUserSession` calls, not to the in-flight request
  that performs the change, which does not re-validate after writing.
- **Admin sessions are explicitly out of scope.** `admin_session` /
  `validateSession` (`src/lib/auth/session.ts`) is untouched by this
  change and continues to use its existing Redis deny-list. The two
  systems (`passwordChangedAt` for users, per-token deny-list for admins)
  are intentionally different and are not to be unified in this pass, to
  avoid confusing the two going forward. Admin password changes do not go
  through `passwordChangedAt` at all — `change-password/route.ts`'s admin
  branch updates Supabase `admin_users.password_hash` directly and is
  unaffected.
- **Stub honesty (`deleteUserSession` / `deleteAllUserSessions`):**
  Decision (b) — implement them now using the same mechanism, rather than
  leaving misleading no-ops:
  - `deleteAllUserSessions(userId)` sets `passwordChangedAt = now` on that
    user, which retroactively invalidates every existing session for that
    user (exactly the "logout everywhere" semantics the name promises).
    This becomes the single implementation reused by reset-password and
    change-password (both call it after successfully writing the new
    password hash).
  - `deleteUserSession(token)` (single-session logout) **cannot** be
    implemented via `passwordChangedAt` (that would log out every session,
    not just one) and there is no per-token store for user sessions. It is
    kept as a stub but changed from a silent no-op to one with an explicit
    comment stating it only clears the caller's cookie and does not
    invalidate the JWT server-side — matching what `logout/route.ts`
    actually needs (clear the browser's cookie) without claiming more than
    that. This limitation is also documented in `PROJECT_CONTEXT.md`.

## 4. Data model

### `password_reset_tokens` (new Mongo collection)

`src/lib/mongo/password-reset-tokens.ts`, modeled directly on
`pending-oauth-registrations.ts`:

```ts
interface PasswordResetTokenDoc {
  _id: ObjectId;
  userId: string;
  tokenHash: string;      // sha256 hex of the raw token
  expiresAt: Date;        // TTL index, expireAfterSeconds: 0
  usedAt: Date | null;
  createdAt: Date;
  requestIp?: string;
  userAgent?: string;
}
```

- Raw token: `crypto.randomBytes(32).toString("hex")` (256 bits).
- Stored as **SHA-256 hash**, not bcrypt: this is a lookup key requiring
  fast equality-by-hash for a DB query, not a secret requiring slow,
  salted verification — bcrypt stays reserved for the password itself,
  consistent with how the codebase already treats these as different
  problems (OAuth's `createOAuthUser` placeholder hash is the one existing
  precedent for a random-secret-via-bcrypt, but that is a password
  placeholder, not a lookup token).
- `ensureIndexes()`: TTL index on `expiresAt`
  (`expireAfterSeconds: 0`), called lazily on first write.
- Expiration: `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` env var, default 60,
  clamped in code to a sane 5–60 minute range regardless of misconfiguration.
- Creating a new token for a user invalidates (sets `usedAt = now` on) any
  other unused, unexpired tokens for that same `userId` first.

### `UserProfile` (extend)

Add `passwordChangedAt?: string` (ISO string). No migration needed —
absent means "never explicitly tracked," and `validateUserSession` treats
a missing field as "no invalidation floor" (always valid, same as today).

## 5. Endpoints

### `POST /api/auth/forgot-password`

1. Parse `{ email }`, manual validation (non-empty string, basic email
   regex — reuse whatever pattern `register/route.ts` already uses if one
   exists, otherwise a standard RFC-5322-lite regex).
2. Normalize: `trim().toLowerCase()`.
3. Rate limit (see §6). On limit exceeded, still return the generic
   success response (do not leak rate-limit state to the client) but skip
   sending mail.
4. Look up user by normalized email. If not found, or found but with a
   pending admin-only edge case (none identified), fall through to the
   same generic response — **do not branch on existence in the HTTP
   response**.
5. If found: generate token, store hash + expiry, build reset URL as
   `${NEXT_PUBLIC_SITE_URL}/reset-password?token=<raw token>` (reusing the
   existing `NEXT_PUBLIC_SITE_URL` var — no new `NEXT_PUBLIC_APP_URL`),
   send via Resend (`sendPasswordResetEmail`), in the user's saved locale
   preference if the schema has one, else `it`.
6. Always respond `{ success: true }` with a fixed generic message,
   regardless of steps 4–5's outcome. Never include the token, user
   existence, or provider error detail in the response body. Log only
   category/provider/result/message-id, never the token or full email
   content.

OAuth-only accounts (`hasPassword === false`): allowed through the same
flow with no special-casing in step 4 — per the approved decision, a
successful reset sets `hasPassword = true` and gives them an email+password
login option alongside their linked provider.

### `POST /api/auth/reset-password`

1. Parse `{ token, newPassword }`.
2. Hash incoming token (SHA-256), look up in `password_reset_tokens`.
3. Reject (generic `{ success: false, error: "Link non valido o scaduto" }`,
   400) if: not found, `usedAt` set, or `expiresAt` in the past. Same
   generic error for all three cases — don't distinguish "expired" vs
   "already used" vs "never existed" in the response (minor enumeration
   surface, not worth a better UX here).
4. Validate `newPassword` with the existing `validatePasswordRules`
   (`src/lib/auth/password-rules.ts`) — same rules as change-password.
5. On success: `hashPassword` (bcrypt 12), `updateUserPassword`, set
   `hasPassword = true`, set `passwordChangedAt = now`, mark the token
   `usedAt = now`, call `deleteAllUserSessions(userId)` (§3) to invalidate
   any other outstanding sessions.
6. Does **not** create a session or set a cookie (§3). Client redirects to
   login on success.

## 6. Rate limiting

Mirrors `src/lib/auth/rate-limit.ts`'s `getRedis()` null-fallback pattern
exactly (same INCR+EXPIRE shape, same graceful degrade to in-memory when
Redis isn't configured):

- Per normalized email: max 1 request / 60s, max 5 / 24h.
- Per IP: max 5 requests / 60s, max 20 / 24h (`forgot-password` only;
  `reset-password` is already token-gated so it doesn't need the same
  email-enumeration protection, but still gets a coarse per-IP limit
  against brute-forcing tokens: max 20 attempts / hour / IP).
- Redis keys: `ratelimit:forgot-password:email:{email}`,
  `ratelimit:forgot-password:ip:{ip}`, `ratelimit:reset-password:ip:{ip}`.

## 7. Email module

```
src/lib/email/
├── resend.ts          # thin Resend client wrapper, reads RESEND_API_KEY
├── brevo.ts            # thin Brevo client wrapper, reads BREVO_API_KEY
├── send-email.ts        # typed dispatch functions, one per email kind
└── templates/
    ├── reset-password.ts        # implemented this pass
    ├── verify-email.ts          # signature only (throws "not implemented")
    ├── booking-confirmation.ts  # signature only
    ├── event-reminder.ts        # signature only
    └── newsletter.ts            # signature only
```

- Templates are plain functions returning `{ subject, html, text }`
  strings (no `.tsx`/React-email dependency — keeps this dependency-free
  and consistent with the rest of the repo's "no extra UI framework"
  stance; revisit only if template complexity grows).
- `sendPasswordResetEmail(user, resetUrl, locale)` — the only function
  with a real implementation in this pass, using `getTranslations("email")`
  (new namespace) for it/ar strings, added to
  `src/messages/it.json` / `src/messages/ar.json`.
- All other `send*Email()` functions exist with correct TypeScript
  signatures and JSDoc but throw `Error("not implemented")` if called —
  making the intended shape of the Brevo integration concrete without
  wiring unused code paths into `registrations.ts` / `content.ts`.
- Error handling: provider errors (missing API key, network, timeout) are
  caught in `send-email.ts`, logged with category/provider/error code
  (never token/password/API key/full email body), and surfaced to the
  caller as a generic failure — `forgot-password/route.ts` still returns
  the same generic success response to the client even if the send fails,
  so failures are invisible to an attacker probing for account existence
  but visible in server logs for operators.

## 8. Frontend

New standalone pages (not modals — approved decision, since email
deep-links don't fit the existing modal-only auth UI):

- `src/app/(main)/forgot-password/page.tsx`: email field, submit button,
  loading state, generic success message ("Se l'indirizzo è associato a un
  account, riceverai una email con le istruzioni per reimpostare la
  password."), link back to home/login (opens `LoginModal` via
  `AuthContext`, consistent with how login is triggered elsewhere).
- `src/app/(main)/reset-password/page.tsx`: reads `token` from
  `useSearchParams`, new-password + confirm fields with the same rule
  display as elsewhere in the repo (reuse `password-rules.ts` client-side
  equivalent if one exists, else mirror the same rule list), handles
  missing/invalid/expired/used token (generic message per §5),
  success → redirect to home with login modal opened.
- `LoginModal.tsx` gets a "Password dimenticata?" link to `/forgot-password`.
- Styling: Tailwind 4 semantic tokens from `globals.css` (`bg-background`,
  `bg-surface`, `border-border`, `gold`/`gold-light`/`accent`), same visual
  language as `LoginModal.tsx`, no new component library.

## 9. Env vars

Added to `.env.example`:

```
RESEND_API_KEY=
BREVO_API_KEY=
EMAIL_FROM_AUTH=
EMAIL_FROM_EVENTS=
EMAIL_FROM_NEWSLETTER=
EMAIL_REPLY_TO=
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60
```

`NEXT_PUBLIC_SITE_URL` (existing var) is reused for the reset link base —
no duplicate `NEXT_PUBLIC_APP_URL` introduced.

Documented separately (README): SPF/DKIM/DMARC setup guidance for the
sending domain(s), and that Gmail-personal addresses must not be used as
the production sender.

## 10. Testing (Vitest, mocked Resend/Brevo clients — no real sends)

- Token: generation (format/length), hashing, expiry (TTL boundary),
  single-use (second use rejected), invalidation of prior tokens on new
  request.
- `forgot-password`: valid email, unknown email (same response), malformed
  email (400), rate limit exceeded (still generic response, no send),
  OAuth-only account (allowed).
- `reset-password`: valid token happy path, missing token, invalid token,
  expired token, already-used token, weak password rejected, successful
  reset sets `hasPassword`, `passwordChangedAt`, marks token used, no
  session cookie set.
- `validateUserSession`: token issued before `passwordChangedAt` rejected;
  token issued after accepted; user with no `passwordChangedAt` unaffected
  (back-compat).
- `change-password`: session invalidation wired the same way (does not
  reject the in-flight request's own session — see §3).
- Locale selection: it vs ar template content.
- Resend/Brevo client error handling (network error, missing API key) does
  not leak to the HTTP response.

## 11. Explicitly out of scope for this pass

- Wiring Brevo sends into the actual booking/event flows
  (`registrations.ts`, `content.ts`) — only the typed function stubs are
  built. No `emailPending`/`emailSent`/... fields are added to
  `IscrizioneEvento` until a real caller exists (YAGNI); noted in
  `PROJECT_CONTEXT.md` as ready-to-add follow-up work instead.
- `deleteUserSession` real per-session revocation (not achievable without
  a per-session store; documented limitation, not built here).
- zod / any new validation library.
- Coptic locale (does not exist in this repo).
