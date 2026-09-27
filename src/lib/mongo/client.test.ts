import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const connectWithRetry = vi.fn();
vi.mock("./connection-utils", () => ({
  connectWithRetry: (...args: unknown[]) => connectWithRetry(...args),
  healthCheckConnection: vi.fn(async () => true),
}));

describe("mongo client", () => {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeAll(() => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:1/test");
    process.on("unhandledRejection", onUnhandled);
  });
  afterAll(() => {
    process.off("unhandledRejection", onUnhandled);
    vi.unstubAllEnvs();
  });

  it("does not connect when the module is imported (e.g. during next build)", async () => {
    await import("./client");
    expect(connectWithRetry).not.toHaveBeenCalled();
  });

  it("rejects getDb on connection failure without leaving an unhandled rejection", async () => {
    connectWithRetry.mockRejectedValue(new Error("Connection timeout exceeded"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { getDb } = await import("./client");

    await expect(getDb()).rejects.toThrow("Connection timeout exceeded");
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(unhandled).toEqual([]);
  });

  it("reconnects on the next call after a failure", async () => {
    const db = { name: "ok" };
    connectWithRetry.mockResolvedValue({ db: () => db });
    const { getDb } = await import("./client");

    await expect(getDb()).resolves.toBe(db);
  });
});
