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

describe("newsletter (non attiva)", () => {
  it("returns an explicit failure instead of throwing, without sending", async () => {
    const { sendNewsletter } = await import("./send-email");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    send.mockClear();
    await expect(sendNewsletter()).resolves.toEqual({ ok: false, error: "not_implemented" });
    expect(send).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

const booking = {
  to: "famiglia@example.com",
  locale: "it" as const,
  eventTitle: "Ritiro <giovani>",
  eventDate: "2026-10-04T09:30",
  luogo: "Chiesa di San Marco",
  partecipanti: ["Maria Rossi", "Giovanni Rossi"],
  raccolta: "Stazione Centrale · 08:30",
  manageUrl: "https://sanmarco.example/iscrizioni",
};

describe("email degli eventi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM_AUTH", "noreply@auth.example.com");
    vi.stubEnv("BREVO_API_KEY", "");
  });

  it("sends the booking confirmation via Resend from the events sender, with escaped content", async () => {
    vi.stubEnv("EMAIL_FROM_EVENTS", "eventi@example.com");
    send.mockResolvedValue({ data: { id: "msg_booking" }, error: null });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendBookingConfirmationEmail } = await import("./send-email");

    const result = await sendBookingConfirmationEmail(booking);

    expect(result).toEqual({ ok: true, messageId: "msg_booking" });
    const sent = send.mock.calls[0][0];
    expect(sent).toMatchObject({ to: "famiglia@example.com", from: "eventi@example.com" });
    expect(sent.subject).toBe("Iscrizione confermata: Ritiro <giovani>");
    expect(sent.html).toContain("Ritiro &lt;giovani&gt;");
    expect(sent.html).not.toContain("<giovani>");
    expect(sent.html).toContain("domenica 4 ottobre 2026, 09:30");
    expect(sent.text).toContain("Maria Rossi, Giovanni Rossi");
    expect(JSON.stringify(log.mock.calls)).not.toContain("famiglia@example.com");
    log.mockRestore();
  });

  it("falls back to the auth sender when no events sender is set", async () => {
    send.mockResolvedValue({ data: { id: "msg" }, error: null });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendEventReminderEmail } = await import("./send-email");
    await sendEventReminderEmail({ ...booking, eventUrl: "https://sanmarco.example/eventi" });
    expect(send.mock.calls[0][0]).toMatchObject({ from: "noreply@auth.example.com" });
    expect(send.mock.calls[0][0].subject).toBe("Promemoria: domani Ritiro <giovani>");
  });

  it("uses Brevo for event emails when it is configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "brevo_key");
    vi.stubEnv("EMAIL_FROM_EVENTS", "eventi@example.com");
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ messageId: "brevo_1" }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendBookingConfirmationEmail } = await import("./send-email");

    expect(await sendBookingConfirmationEmail({ ...booking, locale: "ar" })).toEqual({
      ok: true,
      messageId: "brevo_1",
    });
    expect(send).not.toHaveBeenCalled();
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string
    );
    expect(body.subject).toContain("تم تأكيد التسجيل");
    expect(body.htmlContent).toContain('dir="rtl"');
  });

  it("reports a missing provider instead of pretending to send", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendBookingConfirmationEmail } = await import("./send-email");
    expect(await sendBookingConfirmationEmail(booking)).toEqual({
      ok: false,
      error: "provider_not_configured",
    });
  });

  it("renders the verification email with the link", async () => {
    send.mockResolvedValue({ data: { id: "msg_verify" }, error: null });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendVerificationEmail } = await import("./send-email");
    await sendVerificationEmail({
      to: "nuovo@example.com",
      locale: "it",
      verifyUrl: "https://sanmarco.example/verifica-email?token=abc",
      expirationHours: 48,
    });
    const sent = send.mock.calls[0][0];
    expect(sent.subject).toBe("Conferma il tuo indirizzo email");
    expect(sent.html).toContain("https://sanmarco.example/verifica-email?token=abc");
    expect(sent.text).toContain("48 ore");
  });
});
