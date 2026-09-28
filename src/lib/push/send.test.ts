import { describe, it, expect, vi, beforeEach } from "vitest";

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: { sendNotification: (...args: unknown[]) => sendNotification(...args) },
}));

type Sub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  locale: "it" | "ar";
  lastRunId?: string;
};
let subscriptions: Sub[] = [];
const deletePushSubscription = vi.fn<(endpoint: string) => Promise<boolean>>(async (endpoint) => {
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  return true;
});
vi.mock("@/lib/mongo/push-subscriptions", () => ({
  iteratePushSubscriptions: async function* (runId: string) {
    yield subscriptions.filter((s) => s.lastRunId !== runId).map((s) => ({ ...s }));
  },
  countPendingPushSubscriptions: async (runId: string) =>
    subscriptions.filter((s) => s.lastRunId !== runId).length,
  deletePushSubscription: (endpoint: string) => deletePushSubscription(endpoint),
  markPushHandled: async (endpoints: string[], runId: string) => {
    for (const s of subscriptions) if (endpoints.includes(s.endpoint)) s.lastRunId = runId;
  },
}));

import { sendPushToAll, PushNotConfiguredError } from "./send";

const sub = (name: string, locale: "it" | "ar" = "it"): Sub => ({
  endpoint: `https://fcm.googleapis.com/${name}`,
  keys: { p256dh: "a", auth: "b" },
  locale,
});
const payload = (locale: "it" | "ar") => ({
  title: locale === "ar" ? "إعلان" : "Avviso",
  body: "Testo",
  url: "/avvisi",
  lang: locale,
});

describe("sendPushToAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptions = [sub("ok-it"), sub("ok-ar", "ar"), sub("gone"), sub("flaky")];
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public";
    process.env.VAPID_PRIVATE_KEY = "private";
    process.env.VAPID_SUBJECT = "mailto:test@example.com";
    sendNotification.mockImplementation(async (s: { endpoint: string }) => {
      if (s.endpoint.endsWith("/gone")) throw Object.assign(new Error("gone"), { statusCode: 410 });
      if (s.endpoint.endsWith("/flaky"))
        throw Object.assign(new Error("server"), { statusCode: 500 });
      return { statusCode: 201 };
    });
  });

  it("refuses to send without VAPID keys", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    await expect(sendPushToAll(payload, { runId: "r1" })).rejects.toBeInstanceOf(
      PushNotConfiguredError
    );
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends each device its language, removes expired subscriptions and counts failures", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendPushToAll(payload, { runId: "r1", urgent: true });

    expect(result).toEqual({ sent: 2, failed: 1, removed: 1, remaining: 0 });
    expect(deletePushSubscription).toHaveBeenCalledWith("https://fcm.googleapis.com/gone");
    const arCall = sendNotification.mock.calls.find(([s]) => s.endpoint.endsWith("/ok-ar"));
    expect(JSON.parse(arCall![1]).title).toBe("إعلان");
    expect(arCall![2]).toMatchObject({ urgency: "high", TTL: 86400 });
    error.mockRestore();
  });

  it("stops at the time limit and resumes the same run without duplicates", async () => {
    subscriptions = Array.from({ length: 25 }, (_, i) => sub(`device-${i}`));
    // Primo giro: tempo esaurito dopo il primo blocco da 10.
    const first = await sendPushToAll(payload, { runId: "r2", timeBudgetMs: -1 });
    expect(first).toMatchObject({ sent: 0, remaining: 25 });

    let calls = 0;
    sendNotification.mockImplementation(async () => {
      calls += 1;
      return { statusCode: 201 };
    });
    const resumed = await sendPushToAll(payload, { runId: "r2" });
    expect(resumed).toMatchObject({ sent: 25, remaining: 0 });
    // Ripetere lo stesso invio non manda nulla di nuovo.
    const again = await sendPushToAll(payload, { runId: "r2" });
    expect(again).toMatchObject({ sent: 0, remaining: 0 });
    expect(calls).toBe(25);
    // Un nuovo invio (runId diverso) raggiunge di nuovo tutti.
    expect((await sendPushToAll(payload, { runId: "r3" })).sent).toBe(25);
  });
});
