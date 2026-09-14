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
