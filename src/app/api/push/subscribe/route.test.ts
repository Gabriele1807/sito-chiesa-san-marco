import { createECDH } from "node:crypto";
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
const savePushSubscription = vi.fn();
const deletePushSubscription = vi.fn();
vi.mock("@/lib/mongo/push-subscriptions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/mongo/push-subscriptions")>()),
  savePushSubscription: (...args: unknown[]) => savePushSubscription(...args),
  deletePushSubscription: (...args: unknown[]) => deletePushSubscription(...args),
}));
vi.mock("@/lib/mongo/client", () => ({ getDb: vi.fn() }));

import { POST } from "./route";

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQ", auth: "tBHItJI5svbpez7KI4CCXg" },
};

function req(body: unknown, cookie = "") {
  return new Request("http://localhost/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: cookie ? { cookie } : {},
  });
}

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Coppia valida: la configurazione verifica formato e corrispondenza delle chiavi.
    const ecdh = createECDH("prime256v1");
    ecdh.generateKeys();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ecdh.getPublicKey().toString("base64url");
    process.env.VAPID_PRIVATE_KEY = ecdh.getPrivateKey().toString("base64url");
    process.env.VAPID_SUBJECT = "mailto:test@example.com";
  });

  it("answers 503 when push is not configured", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    expect((await POST(req({ subscription }))).status).toBe(503);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it("rejects endpoints that are not browser push services", async () => {
    const res = await POST(
      req({ subscription: { ...subscription, endpoint: "https://169.254.169.254/x" } })
    );
    expect(res.status).toBe(400);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it("stores a valid subscription with the visitor's language from the cookie", async () => {
    const res = await POST(req({ subscription }, "locale=ar"));
    expect(res.status).toBe(200);
    expect(savePushSubscription).toHaveBeenCalledWith({ ...subscription, locale: "ar" });
  });

  it("replaces the previous endpoint when the browser renews the subscription", async () => {
    await POST(req({ subscription, previousEndpoint: "https://fcm.googleapis.com/fcm/send/old" }));
    expect(deletePushSubscription).toHaveBeenCalledWith("https://fcm.googleapis.com/fcm/send/old");
  });
});
