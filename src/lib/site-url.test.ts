import { describe, it, expect, afterEach, vi } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns the configured URL without trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://chiesa.example.it//");
    expect(getSiteUrl()).toBe("https://chiesa.example.it");
  });

  it("returns null when the variable is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl()).toBeNull();
  });

  it("returns null for a relative or non-http value", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "/solo-percorso");
    expect(getSiteUrl()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "javascript:alert(1)");
    expect(getSiteUrl()).toBeNull();
  });
});
