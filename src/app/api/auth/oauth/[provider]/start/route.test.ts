// src/app/api/auth/oauth/[provider]/start/route.test.ts
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
});

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

vi.mock("@/lib/auth/session", () => ({
  validateSession: vi.fn(),
}));

vi.mock("@/lib/oauth/flow-cookie", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth/flow-cookie")>("@/lib/oauth/flow-cookie");
  return { ...actual, signOAuthFlowCookie: vi.fn(actual.signOAuthFlowCookie) };
});

import { GET } from "./route";
import { getProviderAdapter } from "@/lib/oauth/providers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { validateSession as validateAdminSession } from "@/lib/auth/session";
import { signOAuthFlowCookie } from "@/lib/oauth/flow-cookie";

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
    (validateAdminSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(
      req("https://example.org/api/auth/oauth/google/start?intent=link"),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(401);
  });

  it("allows intent=link with a valid admin session (checked before user session)", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    (validateAdminSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "admin-1", attivo: true });
    const res = await GET(
      req(
        "https://example.org/api/auth/oauth/google/start?intent=link",
        "admin_session=admin-token"
      ),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(307);
    expect(validateUserSession).not.toHaveBeenCalled();
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

  it("always sets Cache-Control: no-store, including on error responses (bfcache/back-button hardening)", async () => {
    const notFound = await GET(req("https://example.org/api/auth/oauth/apple/start"), {
      params: Promise.resolve({ provider: "apple" }),
    });
    expect(notFound.headers.get("Cache-Control")).toBe("no-store");

    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    const redirect = await GET(req("https://example.org/api/auth/oauth/google/start"), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(redirect.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects an absolute-URL returnTo and falls back to a safe default (open-redirect guard)", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    const res = await GET(
      req("https://example.org/api/auth/oauth/google/start?returnTo=https://evil.example"),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(307);
    const signedPayload = (signOAuthFlowCookie as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signedPayload.returnTo).toBe("/");
  });

  it("rejects a protocol-relative returnTo and falls back to a safe default", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    (validateAdminSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "admin-1", attivo: true });
    const res = await GET(
      req(
        "https://example.org/api/auth/oauth/google/start?intent=link&returnTo=//evil.example",
        "admin_session=admin-token"
      ),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(307);
    const signedPayload = (signOAuthFlowCookie as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signedPayload.returnTo).toBe("/profilo");
  });

  it("accepts a genuine same-origin relative returnTo", async () => {
    (getProviderAdapter as ReturnType<typeof vi.fn>).mockReturnValue({
      usesPkce: true,
      createAuthorizationURL: (state: string) =>
        new URL(`https://accounts.google.com/authorize?state=${state}`),
    });
    const res = await GET(
      req("https://example.org/api/auth/oauth/google/start?returnTo=/eventi"),
      { params: Promise.resolve({ provider: "google" }) }
    );
    expect(res.status).toBe(307);
    const signedPayload = (signOAuthFlowCookie as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signedPayload.returnTo).toBe("/eventi");
  });
});
