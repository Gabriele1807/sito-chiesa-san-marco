import { describe, it, expect, vi, beforeEach } from "vitest";

const consumeActionLimit = vi.fn<
  (...args: unknown[]) => Promise<{ allowed: boolean; retryAfterSeconds: number }>
>(async () => ({ allowed: true, retryAfterSeconds: 0 }));
vi.mock("@/lib/auth/action-limit", () => ({
  LIMITS: { register: {}, prayerRequest: {}, pushSubscribe: {}, eventRegistration: {} },
  consumeActionLimit: (...args: unknown[]) => consumeActionLimit(...args),
}));
vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
const createPrayerRequest = vi.fn();
vi.mock("@/lib/mongo/prayer-requests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/mongo/prayer-requests")>()),
  createPrayerRequest: (...args: unknown[]) => createPrayerRequest(...args),
}));
vi.mock("@/lib/mongo/client", () => ({ getDb: vi.fn() }));

import { POST } from "./route";

const req = (body: unknown) =>
  new Request("http://localhost/api/richieste-preghiera", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/richieste-preghiera", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores a valid request", async () => {
    const res = await POST(
      req({ tipo: "defunti", intenzione: "Per l'anima di Giovanni", consenso: true })
    );
    expect(res.status).toBe(201);
    expect(createPrayerRequest).toHaveBeenCalledTimes(1);
  });

  it("silently drops submissions that fill the honeypot field", async () => {
    const res = await POST(
      req({ tipo: "defunti", intenzione: "spam", consenso: true, website: "http://spam" })
    );
    expect(res.status).toBe(201);
    expect(createPrayerRequest).not.toHaveBeenCalled();
  });

  it("returns a translatable error code for invalid data", async () => {
    const res = await POST(req({ tipo: "defunti", intenzione: "Per Giovanni" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: "consent" });
  });

  it("limits how many requests a network can send per hour", async () => {
    consumeActionLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 600 });
    const res = await POST(
      req({ tipo: "defunti", intenzione: "Per l'anima di Giovanni", consenso: true })
    );
    expect(res.status).toBe(429);
    expect(createPrayerRequest).not.toHaveBeenCalled();
  });
});
