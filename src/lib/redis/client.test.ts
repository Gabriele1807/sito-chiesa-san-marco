import { describe, it, expect, vi, afterEach } from "vitest";

// `function` (non arrow): da Vitest 4 un mock usato con `new` deve essere costruibile.
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(function () {
    return {};
  }),
}));

describe("getRedis", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns null and warns once in production when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getRedis } = await import("./client");

    expect(getRedis()).toBeNull();
    expect(getRedis()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not warn outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getRedis } = await import("./client");

    expect(getRedis()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("accepts the Vercel Marketplace KV_REST_* names", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "test-token");
    const { getRedis } = await import("./client");
    expect(getRedis()).not.toBeNull();
  });
});
