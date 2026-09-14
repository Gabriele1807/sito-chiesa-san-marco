import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
});
