"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, MailWarning, Loader2 } from "lucide-react";

/** Stato di verifica dell'email nel profilo, con reinvio del link. */
export default function EmailVerificationStatus({ verified }: { verified: boolean }) {
  const t = useTranslations("profilo");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (verified) {
    return (
      <span className="badge-success mt-1.5">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        {t("emailVerificata")}
      </span>
    );
  }

  async function resend() {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: t("verificaInviata") });
      } else if (data.error === "too_soon" && typeof data.retryAfter === "number") {
        setMessage({ ok: false, text: t("verificaAttendi", { seconds: data.retryAfter }) });
      } else {
        setMessage({ ok: false, text: t("verificaErrore") });
      }
    } catch {
      setMessage({ ok: false, text: t("verificaErrore") });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      <span className="border-warning/30 bg-warning/10 text-warning inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
        <MailWarning className="h-3.5 w-3.5" aria-hidden />
        {t("emailNonVerificata")}
      </span>
      <p className="text-foreground/60 text-xs">
        {t("emailNonVerificataTesto")}{" "}
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="text-accent inline-flex items-center gap-1 font-semibold hover:underline disabled:opacity-50"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          {t("inviaVerifica")}
        </button>
      </p>
      {message && (
        <p role="status" className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
