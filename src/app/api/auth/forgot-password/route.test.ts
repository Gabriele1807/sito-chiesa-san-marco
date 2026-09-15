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
