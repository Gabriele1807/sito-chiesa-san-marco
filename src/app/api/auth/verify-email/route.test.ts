import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
const consumeEmailVerificationToken = vi.fn();
vi.mock("@/lib/mongo/email-verification-tokens", () => ({
  consumeEmailVerificationToken: (token: string) => consumeEmailVerificationToken(token),
}));
const markEmailVerified = vi.fn();
vi.mock("@/lib/mongo/users", () => ({
  markEmailVerified: (id: string, email: string) => markEmailVerified(id, email),
}));

import { POST } from "./route";

const req = (body: unknown) =>
  new Request("http://localhost/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies the address the link was issued for", async () => {
    consumeEmailVerificationToken.mockResolvedValue({ userId: "u1", email: "mario@example.com" });
    markEmailVerified.mockResolvedValue(true);
    const res = await POST(req({ token: "a".repeat(64) }));
    expect(res.status).toBe(200);
    expect(markEmailVerified).toHaveBeenCalledWith("u1", "mario@example.com");
  });

  it("rejects invalid or expired links", async () => {
    consumeEmailVerificationToken.mockResolvedValue(null);
    const res = await POST(req({ token: "bad" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: "invalid_token" });
    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("does not verify a new address with a link sent to the old one", async () => {
    consumeEmailVerificationToken.mockResolvedValue({ userId: "u1", email: "old@example.com" });
    markEmailVerified.mockResolvedValue(false);
    const res = await POST(req({ token: "a".repeat(64) }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ success: false, error: "email_changed" });
  });
});
