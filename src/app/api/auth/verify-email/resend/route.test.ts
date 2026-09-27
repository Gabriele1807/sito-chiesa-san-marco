import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => ({ value: "tok" }) })),
}));
const validateUserSession = vi.fn();
vi.mock("@/lib/mongo/sessions", () => ({
  validateUserSession: (t: string) => validateUserSession(t),
}));
const findUserByIdFull = vi.fn();
vi.mock("@/lib/mongo/users", () => ({ findUserByIdFull: (id: string) => findUserByIdFull(id) }));
const secondsUntilNextVerificationEmail = vi.fn();
vi.mock("@/lib/mongo/email-verification-tokens", () => ({
  secondsUntilNextVerificationEmail: (id: string) => secondsUntilNextVerificationEmail(id),
}));
const startEmailVerification = vi.fn();
vi.mock("@/lib/auth/email-verification", () => ({
  startEmailVerification: (...args: unknown[]) => startEmailVerification(...args),
  localeFromRequest: () => "it",
}));

import { POST } from "./route";

const call = () =>
  POST(new Request("http://localhost/api/auth/verify-email/resend", { method: "POST" }));

describe("POST /api/auth/verify-email/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateUserSession.mockResolvedValue({ userId: "u1" });
    findUserByIdFull.mockResolvedValue({
      _id: "u1",
      email: "mario@example.com",
      emailVerificata: false,
    });
    secondsUntilNextVerificationEmail.mockResolvedValue(0);
    startEmailVerification.mockResolvedValue({ ok: true });
  });

  it("requires a user session", async () => {
    validateUserSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(startEmailVerification).not.toHaveBeenCalled();
  });

  it("sends a new link to the account address", async () => {
    expect((await call()).status).toBe(200);
    expect(startEmailVerification).toHaveBeenCalledWith("u1", "mario@example.com", "it");
  });

  it("limits how often a link can be requested", async () => {
    secondsUntilNextVerificationEmail.mockResolvedValue(42);
    const res = await call();
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: "too_soon", retryAfter: 42 });
    expect(startEmailVerification).not.toHaveBeenCalled();
  });

  it("does nothing for an already verified address", async () => {
    findUserByIdFull.mockResolvedValue({
      _id: "u1",
      email: "mario@example.com",
      emailVerificata: true,
    });
    expect(await (await call()).json()).toEqual({ success: true, alreadyVerified: true });
    expect(startEmailVerification).not.toHaveBeenCalled();
  });
});
