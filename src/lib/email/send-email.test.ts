import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  // `function` (non arrow): da Vitest 4 un mock usato con `new` deve essere costruibile.
  Resend: vi.fn(function () {
    return { emails: { send } };
  }),
}));

import { sendPasswordResetEmail } from "./send-email";

describe("sendPasswordResetEmail", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM_AUTH", "noreply@auth.example.com");
  });

  it("sends via Resend and returns the message id", async () => {
    send.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result).toEqual({ ok: true, messageId: "msg_123" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "utente@example.com",
        from: "noreply@auth.example.com",
      })
    );
  });

  it("returns a generic failure without leaking provider error details when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns a generic failure when the provider errors", async () => {
    send.mockResolvedValue({ data: null, error: { message: "network down" } });

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result).toEqual({ ok: false, error: "send_failed" });
  });

  it("refuses to fall back to the Resend test sender in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_FROM_AUTH", "");

    const result = await sendPasswordResetEmail({
      to: "utente@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      locale: "it",
      expirationMinutes: 60,
    });

    expect(result).toEqual({ ok: false, error: "provider_not_configured" });
    expect(send).not.toHaveBeenCalled();
  });

  it("never logs the reset URL or token", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValueOnce({ data: { id: "msg_1" }, error: null });
    send.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    for (let i = 0; i < 2; i++) {
      await sendPasswordResetEmail({
        to: "utente@example.com",
        resetUrl: "https://example.com/reset-password?token=segreto123",
        locale: "it",
        expirationMinutes: 60,
      });
    }

    const logged = JSON.stringify([...log.mock.calls, ...error.mock.calls]);
    expect(logged).not.toContain("segreto123");
    expect(logged).not.toContain("re_test_key");
    log.mockRestore();
    error.mockRestore();
  });
});
