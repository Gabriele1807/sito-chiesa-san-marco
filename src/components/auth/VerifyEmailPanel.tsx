"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MailCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const KNOWN_ERRORS = ["invalid_token", "email_changed", "rate_limit"];

/**
 * Conferma dell'email con un clic esplicito (non all'apertura della pagina):
 * i sistemi antispam aprono i link delle email in automatico e
 * consumerebbero il token prima dell'utente.
 */
export default function VerifyEmailPanel({ token }: { token: string }) {
  const t = useTranslations("verificaEmail");
  const { type, refresh } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    token ? "idle" : "error"
  );
  const [error, setError] = useState(token ? "" : t("linkMancante"));

  async function confirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus("done");
        await refresh().catch(() => undefined);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(
        KNOWN_ERRORS.includes(data.error) ? t(`errore_${data.error}`) : t("errore_generico")
      );
      setStatus("error");
    } catch {
      setError(t("errore_generico"));
      setStatus("error");
    }
  }

  const Icon = status === "done" ? CheckCircle2 : status === "error" ? AlertCircle : MailCheck;
  const iconClass =
    status === "done" ? "text-success" : status === "error" ? "text-danger" : "text-accent";

  return (
    <div className="border-border bg-surface rounded-2xl border p-6 text-center shadow-sm sm:p-8">
      <Icon className={`mx-auto mb-4 h-12 w-12 ${iconClass}`} aria-hidden />
      <h1 className="font-display text-foreground text-3xl">
        {status === "done" ? t("successoTitolo") : t("titolo")}
      </h1>

      {status === "done" ? (
        <>
          <p className="text-foreground/70 mt-3 text-sm" role="status">
            {t("successoTesto")}
          </p>
          <Link href={type === "user" ? "/profilo" : "/"} className="btn-primary mt-6">
            {type === "user" ? t("vaiProfilo") : t("vaiHome")}
          </Link>
        </>
      ) : status === "error" ? (
        <>
          <p className="text-foreground/70 mt-3 text-sm" role="alert">
            {error}
          </p>
          <Link href={type === "user" ? "/profilo" : "/"} className="btn-secondary mt-6">
            {type === "user" ? t("vaiProfilo") : t("vaiHome")}
          </Link>
        </>
      ) : (
        <>
          <p className="text-foreground/70 mt-3 text-sm">{t("intro")}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={status === "loading"}
            className="btn-primary mt-6"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {status === "loading" ? t("confermaInCorso") : t("conferma")}
          </button>
        </>
      )}
    </div>
  );
}
