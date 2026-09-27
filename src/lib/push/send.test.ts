import { describe, it, expect, vi, beforeEach } from "vitest";

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: { sendNotification: (...args: unknown[]) => sendNotification(...args) },
}));

const subscriptions = [
  {
    endpoint: "https://fcm.googleapis.com/ok-it",
    keys: { p256dh: "a", auth: "b" },
    locale: "it" as const,
  },
  {
    endpoint: "https://fcm.googleapis.com/ok-ar",
    keys: { p256dh: "a", auth: "b" },
    locale: "ar" as const,
  },
  {
    endpoint: "https://fcm.googleapis.com/gone",
    keys: { p256dh: "a", auth: "b" },
    locale: "it" as const,
  },
  {
    endpoint: "https://fcm.googleapis.com/flaky",
    keys: { p256dh: "a", auth: "b" },
    locale: "it" as const,
  },
];
const deletePushSubscription = vi.fn<(endpoint: string) => Promise<boolean>>(async () => true);
const markPushDelivered = vi.fn<(endpoints: string[]) => Promise<void>>(async () => undefined);
vi.mock("@/lib/mongo/push-subscriptions", () => ({
  iteratePushSubscriptions: async function* () {
    yield subscriptions;
  },
  deletePushSubscription: (endpoint: string) => deletePushSubscription(endpoint),
  markPushDelivered: (endpoints: string[]) => markPushDelivered(endpoints),
}));

import { sendPushToAll, PushNotConfiguredError } from "./send";

const payload = (locale: "it" | "ar") => ({
  title: locale === "ar" ? "إعلان" : "Avviso",
  body: "Testo",
  url: "/avvisi",
  lang: locale,
});

describe("sendPushToAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public";
    process.env.VAPID_PRIVATE_KEY = "private";
    process.env.VAPID_SUBJECT = "mailto:test@example.com";
  });

  it("refuses to send without VAPID keys", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    await expect(sendPushToAll(payload)).rejects.toBeInstanceOf(PushNotConfiguredError);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends each device its language, removes expired subscriptions and counts failures", async () => {
    sendNotification.mockImplementation(async (sub: { endpoint: string }) => {
      if (sub.endpoint.endsWith("/gone"))
        throw Object.assign(new Error("gone"), { statusCode: 410 });
      if (sub.endpoint.endsWith("/flaky"))
        throw Object.assign(new Error("server"), { statusCode: 500 });
      return { statusCode: 201 };
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendPushToAll(payload, { urgent: true });

    expect(result).toEqual({ sent: 2, failed: 1, removed: 1 });
    expect(deletePushSubscription).toHaveBeenCalledWith("https://fcm.googleapis.com/gone");
    expect(deletePushSubscription).toHaveBeenCalledTimes(1);
    const arCall = sendNotification.mock.calls.find(([sub]) => sub.endpoint.endsWith("/ok-ar"));
    expect(JSON.parse(arCall![1]).title).toBe("إعلان");
    expect(arCall![2]).toMatchObject({ urgency: "high", TTL: 86400 });
    expect(markPushDelivered).toHaveBeenCalledWith([
      "https://fcm.googleapis.com/ok-it",
      "https://fcm.googleapis.com/ok-ar",
    ]);
    error.mockRestore();
  });
});
