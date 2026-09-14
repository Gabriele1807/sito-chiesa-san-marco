import { describe, it, expect, beforeAll } from "vitest";
import {
  signOAuthFlowCookie,
  verifyOAuthFlowCookie,
  signOAuthPendingCookie,
  verifyOAuthPendingCookie,
  hashSessionToken,
} from "./flow-cookie";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
});

describe("oauth flow cookie", () => {
  it("round-trips a login-intent payload", async () => {
    const token = await signOAuthFlowCookie({
      state: "abc123",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    const payload = await verifyOAuthFlowCookie(token);
    expect(payload?.state).toBe("abc123");
    expect(payload?.provider).toBe("google");
    expect(payload?.intent).toBe("login");
  });

  it("round-trips a link-intent payload with a session hash", async () => {
    const hash = await hashSessionToken("some-session-jwt");
    const token = await signOAuthFlowCookie({
      state: "xyz",
      provider: "facebook",
      intent: "link",
      returnTo: "/profilo",
      linkedSessionHash: hash,
    });
    const payload = await verifyOAuthFlowCookie(token);
    expect(payload?.intent).toBe("link");
    expect(payload?.linkedSessionHash).toBe(hash);
  });

  it("rejects a tampered flow cookie", async () => {
    const token = await signOAuthFlowCookie({
      state: "abc",
      provider: "google",
      intent: "login",
      returnTo: "/",
    });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifyOAuthFlowCookie(tampered)).toBeNull();
  });

  it("round-trips a pending cookie", async () => {
    const token = await signOAuthPendingCookie("pending-1");
    const payload = await verifyOAuthPendingCookie(token);
    expect(payload?.pendingId).toBe("pending-1");
  });

  it("hashSessionToken is deterministic for the same input", async () => {
    const a = await hashSessionToken("same-token");
    const b = await hashSessionToken("same-token");
    expect(a).toBe(b);
    expect(a).not.toBe("same-token");
  });
});
