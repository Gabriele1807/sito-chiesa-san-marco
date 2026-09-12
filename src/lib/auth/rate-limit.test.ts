import { describe, it, expect, beforeAll } from "vitest";
import {
  isRateLimited,
  recordFailedAttempt,
  resetAttempts,
  remainingAttempts,
  isIpRateLimited,
  recordIpRequest,
  remainingIpRequests,
} from "./rate-limit";

// No UPSTASH_REDIS_REST_URL/TOKEN in the test environment, so these exercise
// the in-memory fallback path (getRedis() returns null). Each test uses its
// own fake IP to avoid interference, since the fallback Maps are module-level
// singletons shared across tests in this file.
beforeAll(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("login attempt rate limiting (in-memory fallback)", () => {
  it("is not rate limited before any failed attempt", async () => {
    expect(await isRateLimited("1.1.1.1")).toBe(false);
    expect(await remainingAttempts("1.1.1.1")).toBe(5);
  });

  it("blocks after 5 failed attempts and tracks remaining count", async () => {
    const ip = "2.2.2.2";
    for (let i = 0; i < 4; i++) {
      await recordFailedAttempt(ip);
      expect(await isRateLimited(ip)).toBe(false);
    }
    expect(await remainingAttempts(ip)).toBe(1);

    await recordFailedAttempt(ip); // 5th failure
    expect(await isRateLimited(ip)).toBe(true);
    expect(await remainingAttempts(ip)).toBe(0);
  });

  it("resetAttempts clears the block for that IP", async () => {
    const ip = "3.3.3.3";
    for (let i = 0; i < 5; i++) await recordFailedAttempt(ip);
    expect(await isRateLimited(ip)).toBe(true);

    await resetAttempts(ip);
    expect(await isRateLimited(ip)).toBe(false);
    expect(await remainingAttempts(ip)).toBe(5);
  });

  it("tracks each IP independently", async () => {
    await recordFailedAttempt("4.4.4.4");
    expect(await isRateLimited("4.4.4.4")).toBe(false);
    expect(await isRateLimited("5.5.5.5")).toBe(false);
    expect(await remainingAttempts("5.5.5.5")).toBe(5);
  });
});

describe("generic request rate limiting (in-memory fallback)", () => {
  it("blocks after 60 requests from the same IP", async () => {
    const ip = "6.6.6.6";
    for (let i = 0; i < 59; i++) {
      await recordIpRequest(ip);
      expect(await isIpRateLimited(ip)).toBe(false);
    }
    expect(await remainingIpRequests(ip)).toBe(1);

    await recordIpRequest(ip); // 60th request
    expect(await isIpRateLimited(ip)).toBe(true);
    expect(await remainingIpRequests(ip)).toBe(0);
  });
});
