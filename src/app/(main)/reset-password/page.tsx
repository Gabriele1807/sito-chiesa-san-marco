"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { validatePasswordRules } from "@/lib/auth/password-rules";

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  // Il token viene letto una sola volta e poi tolto dalla barra degli
  // indirizzi: non resta nella cronologia, nei segnalibri o negli screenshot.
  const [token] = useState(() => searchParams.get("token") ?? "");

  useEffect(() => {
    if (!token) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [token]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rules = validatePasswordRules(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t("resetPasswordMismatch"));
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError(t("resetPasswordRulesNotMet"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(
          res.status === 400 ? t("resetPasswordInvalidLink") : t("passwordResetGenericError")
        );
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("passwordResetGenericError"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="border-border bg-surface text-foreground/80 rounded-lg border p-4 text-sm">
        {t("resetPasswordInvalidLink")}{" "}
        <Link href="/forgot-password" className="text-accent hover:underline">
          {t("resetPasswordRequestNewLink")}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div
        role="status"
        className="border-border bg-surface text-foreground/80 space-y-4 rounded-lg border p-4 text-sm"
      >
        <p>{t("resetPasswordSuccess")}</p>
        <Link href="/?login=1" className="btn-primary w-full justify-center">
          {t("loginTitle")}
        </Link>
      </div>
    );
  }

  const ruleItems: { ok: boolean; label: string }[] = [
    { ok: rules.length, label: t("registerPasswordRuleLength") },
    { ok: rules.lowercase, label: t("registerPasswordRuleLowercase") },
    { ok: rules.uppercase, label: t("registerPasswordRuleUppercase") },
    { ok: rules.number, label: t("registerPasswordRuleNumber") },
    { ok: rules.special, label: t("registerPasswordRuleSpecial") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="text-foreground/80 mb-1 block text-sm">
          {t("resetPasswordNewLabel")}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="text-foreground/80 mb-1 block text-sm">
          {t("resetPasswordConfirmLabel")}
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field"
        />
      </div>
      <ul className="text-foreground/60 space-y-1 text-xs">
        {ruleItems.map((rule) => (
          <li key={rule.label} className={rule.ok ? "text-success" : ""}>
            {rule.label}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="badge-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("resetPasswordSubmitting") : t("resetPasswordSubmit")}
      </button>
    </form>
  );
}

function ResetPasswordFallback() {
  const t = useTranslations("auth");
  return <p className="text-foreground/60 text-sm">{t("resetPasswordLoading")}</p>;
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow text-accent mb-2">{t("passwordResetEyebrow")}</p>
      <h1 className="font-display text-foreground mb-4 text-2xl">{t("resetPasswordTitle")}</h1>
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
