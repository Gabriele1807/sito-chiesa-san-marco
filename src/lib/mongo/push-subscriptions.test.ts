import { describe, it, expect, vi } from "vitest";

vi.mock("./client", () => ({ getDb: vi.fn() }));

import { parsePushSubscription, isAllowedPushEndpoint } from "./push-subscriptions";

const keys = {
  p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
  auth: "tBHItJI5svbpez7KI4CCXg",
};

describe("isAllowedPushEndpoint (niente SSRF)", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/QGx",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ])("accepts the browser push service %s", (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(true);
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://evil.example/fcm.googleapis.com",
    "https://fcm.googleapis.com.evil.example/x",
    "https://169.254.169.254/latest/meta-data",
    "https://localhost/x",
    "https://user:pass@fcm.googleapis.com/x",
    "https://fcm.googleapis.com:8443/x",
    "not a url",
  ])("rejects %s", (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });
});

describe("parsePushSubscription", () => {
  it("keeps endpoint, keys and a supported locale only", () => {
    expect(
      parsePushSubscription(
        { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys, expirationTime: null },
        "ar"
      )
    ).toEqual({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys, locale: "ar" });
    expect(
      parsePushSubscription({ endpoint: "https://fcm.googleapis.com/x", keys }, "fr")?.locale
    ).toBe("it");
  });

  it("rejects malformed keys and objects in place of strings", () => {
    const endpoint = "https://fcm.googleapis.com/x";
    expect(
      parsePushSubscription({ endpoint, keys: { ...keys, auth: "not base64!" } }, "it")
    ).toBeNull();
    expect(
      parsePushSubscription({ endpoint, keys: { ...keys, p256dh: { $ne: null } } }, "it")
    ).toBeNull();
    expect(parsePushSubscription({ endpoint: { $gt: "" }, keys }, "it")).toBeNull();
    expect(parsePushSubscription(null, "it")).toBeNull();
  });
});
