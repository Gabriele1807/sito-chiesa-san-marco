"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MailWarning, X, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const HIDDEN_KEY = "email_verify_banner_hidden";

/**
 * Promemoria per chi non ha ancora confermato l'email: in cima alle pagine
 * pubbliche, con reinvio del link. Nascondibile per la sessione del
 * browser; non compare su profilo (che mostra già lo stato) e su
 * /verifica-email.
 */
export default function EmailVerifyBanner() {
  const t = useTranslations("profilo");
  const { type, user } = useAuth();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let wasHidden = false;
    try {
      wasHidden = sessionStorage.getItem(HIDDEN_KEY) === "1";
    } catch {
      // storage non disponibile
    }
    setHidden(wasHidden);
  }, []);

  if (
    hidden ||
    type !== "user" ||
    !user ||
    user.emailVerificata !== false ||
    pathname?.startsWith("/profilo") ||
    pathname?.startsWith("/verifica-email")
  ) {
    return null;
  }

  function hide() {
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // resta nascosto solo fino al prossimo caricamento
    }
    setHidden(true);
  }

  async function resend() {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMessage({ ok: true, text: t("verificaInviata") });
      else if (data.error === "too_soon" && typeof data.retryAfter === "number") {
        setMessage({ ok: false, text: t("verificaAttendi", { seconds: data.retryAfter }) });
      } else setMessage({ ok: false, text: t("verificaErrore") });
    } catch {
      setMessage({ ok: false, text: t("verificaErrore") });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="border-warning/30 bg-warning/[0.08] mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
      role="status"
    >
      <MailWarning className="text-warning mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-foreground/85">{t("verifyBannerText", { email: user.email })}</p>
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="text-accent mt-1 inline-flex items-center gap-1 font-semibold hover:underline disabled:opacity-50"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          {t("verifyBannerAction")}
        </button>
        {message && (
          <p className={`mt-1 text-xs ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={hide}
        className="text-foreground/50 hover:bg-warning/10 hover:text-foreground rounded-full p-1"
        aria-label={t("verifyBannerClose")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
