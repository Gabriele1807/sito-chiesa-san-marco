import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send } })),
}));

import { sendPasswordResetEmail } from "./send-email";

describe("sendPasswordResetEmail", () => {
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
});
