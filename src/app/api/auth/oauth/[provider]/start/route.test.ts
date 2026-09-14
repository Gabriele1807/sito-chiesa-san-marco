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
