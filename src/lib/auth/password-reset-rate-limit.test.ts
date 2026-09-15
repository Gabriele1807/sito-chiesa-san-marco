import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/redis/client", () => ({ getRedis: vi.fn(() => null) }));

import {
  isForgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "./password-reset-rate-limit";

describe("forgot-password rate limiting (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("is not limited before any attempts", async () => {
    const limited = await isForgotPasswordRateLimited("1.2.3.4", `fresh-${Date.now()}@x.com`);
    expect(limited).toBe(false);
  });

  it("limits after exceeding the per-email threshold", async () => {
    const email = `test-${Date.now()}@example.com`;
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) {
      await recordForgotPasswordAttempt(ip, email);
    }
    const limited = await isForgotPasswordRateLimited(ip, email);
    expect(limited).toBe(true);
  });
});
