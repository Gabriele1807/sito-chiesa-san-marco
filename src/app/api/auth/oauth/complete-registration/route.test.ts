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
