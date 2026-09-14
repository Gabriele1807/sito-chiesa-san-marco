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
  validateUserSession: vi.fn(async () => ({ userId: "user-1" })),
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

  it("redirects with identity_taken when the identity is already linked to a different user (intent=link)", async () => {
    (verifyOAuthFlowCookie as ReturnType<typeof vi.fn>).mockResolvedValue({
      state: "s",
      provider: "google",
      intent: "link",
      returnTo: "/profilo",
      linkedSessionHash: "hash:session-token",
    });
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      validateCallback: vi.fn(async () => ({ providerAccountId: "g-taken", email: "t@b.com" })),
    });
    (findOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "id-2",
      provider: "google",
      providerAccountId: "g-taken",
      userId: "user-other",
      linkedAt: "now",
    });

    const res = await GET(
      req(
        "https://example.org/api/auth/oauth/google/callback?state=s&code=c",
        "oauth_flow=flow-token; user_session=session-token"
      ),
      { params: Promise.resolve({ provider: "google" }) }
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("identity_taken");
    expect(createOAuthIdentity).not.toHaveBeenCalled();
  });
});
