import { describe, it, expect } from "vitest";
import { renderResetPasswordEmail } from "./reset-password";

const resetUrl = "https://chiesa.example.it/reset-password?token=abc123";

describe("renderResetPasswordEmail", () => {
  it("renders the Italian email with the link, expiry and ltr direction", async () => {
    const email = await renderResetPasswordEmail({ resetUrl, locale: "it", expirationMinutes: 45 });

    expect(email.subject).toBe("Reimposta la tua password");
    expect(email.html).toContain('dir="ltr"');
    expect(email.html).toContain(`href="${resetUrl}"`);
    expect(email.html).toContain("45");
    expect(email.text).toContain(resetUrl);
  });

  it("renders the Arabic email right-to-left, without Italian fallback text", async () => {
    const email = await renderResetPasswordEmail({ resetUrl, locale: "ar", expirationMinutes: 60 });

    expect(email.html).toContain('lang="ar" dir="rtl"');
    expect(email.subject).not.toBe("Reimposta la tua password");
    expect(email.html).not.toContain("Reimposta la password");
  });

  it("escapes the URL inside the HTML body", async () => {
    const email = await renderResetPasswordEmail({
      resetUrl: 'https://x.example/"><script>alert(1)</script>',
      locale: "it",
      expirationMinutes: 60,
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&quot;&gt;&lt;script&gt;");
  });
});
