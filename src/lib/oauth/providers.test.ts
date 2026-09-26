import { createHmac } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProviderAdapter, SUPPORTED_PROVIDERS } from "./providers";

describe("provider adapters", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("exposes exactly google and facebook as supported providers", () => {
    expect(SUPPORTED_PROVIDERS).toEqual(["google", "facebook"]);
  });

  it("returns null for google when env vars are missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(getProviderAdapter("google")).toBeNull();
  });

  it("returns an adapter for google when env vars are present", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    const adapter = getProviderAdapter("google");
    expect(adapter).not.toBeNull();
    expect(adapter?.usesPkce).toBe(true);
    const url = adapter!.createAuthorizationURL("state-value", "verifier-value");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("returns an adapter for facebook when env vars are present, without PKCE", () => {
    process.env.FACEBOOK_CLIENT_ID = "fb-id";
    process.env.FACEBOOK_CLIENT_SECRET = "fb-secret";
    const adapter = getProviderAdapter("facebook");
    expect(adapter).not.toBeNull();
    expect(adapter?.usesPkce).toBe(false);
    const url = adapter!.createAuthorizationURL("state-value");
    expect(url.searchParams.get("state")).toBe("state-value");
  });

  it("builds the callback URL without a double slash when NEXT_PUBLIC_SITE_URL ends with '/'", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org/";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    const url = getProviderAdapter("google")!.createAuthorizationURL("s", "v");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://example.org/api/auth/oauth/google/callback"
    );
  });

  it("signs the Facebook Graph call with appsecret_proof", async () => {
    process.env.FACEBOOK_CLIENT_ID = "fb-id";
    process.env.FACEBOOK_CLIENT_SECRET = "fb-secret";
    const adapter = getProviderAdapter("facebook")!;

    const { Facebook } = await import("arctic");
    const validateSpy = vi
      .spyOn(Facebook.prototype, "validateAuthorizationCode")
      .mockResolvedValue({ accessToken: () => "fb-access-token" } as never);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "fb-1", email: "a@example.com" }), { status: 200 })
      );

    try {
      const profile = await adapter.validateCallback("code");
      expect(profile.providerAccountId).toBe("fb-1");

      const calledUrl = new URL(String(fetchSpy.mock.calls[0][0]));
      const expectedProof = createHmac("sha256", "fb-secret")
        .update("fb-access-token")
        .digest("hex");
      expect(calledUrl.searchParams.get("appsecret_proof")).toBe(expectedProof);
    } finally {
      validateSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});
