import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const KEY =
  "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM";

function setup(permission: NotificationPermission, response = new Response("{}", { status: 200 })) {
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/x",
    options: {},
    toJSON: () => ({
      endpoint: "https://fcm.googleapis.com/fcm/send/x",
      keys: { p256dh: "a", auth: "b" },
    }),
    unsubscribe: vi.fn(async () => true),
  };
  const pushManager = {
    getSubscription: vi.fn(async () => null),
    subscribe: vi.fn(async () => subscription),
  };
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission: vi.fn(async () => permission),
  });
  vi.stubGlobal("navigator", { serviceWorker: { ready: Promise.resolve({ pushManager }) } });
  vi.stubGlobal("fetch", fetchMock);
  return { pushManager, fetchMock, subscription };
}

describe("subscribeToPush", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", KEY);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not subscribe when the user refuses the permission", async () => {
    const { pushManager, fetchMock } = setup("denied");
    const { subscribeToPush } = await import("./push-client");
    expect(await subscribeToPush("it")).toBe("denied");
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("subscribes and registers the device on the server with its language", async () => {
    const { pushManager, fetchMock } = setup("granted");
    const { subscribeToPush } = await import("./push-client");
    expect(await subscribeToPush("ar")).toBe("granted");
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/push/subscribe");
    expect(JSON.parse(init.body as string)).toMatchObject({
      locale: "ar",
      subscription: { endpoint: expect.any(String) },
    });
  });

  it("undoes the device subscription when the server refuses it", async () => {
    const { subscription } = setup(
      "granted",
      new Response(JSON.stringify({ success: false, error: "not_configured" }), { status: 503 })
    );
    const { subscribeToPush, PushSaveError } = await import("./push-client");
    const attempt = subscribeToPush("it");
    await expect(attempt).rejects.toBeInstanceOf(PushSaveError);
    await expect(attempt).rejects.toMatchObject({ code: "not_configured" });
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
