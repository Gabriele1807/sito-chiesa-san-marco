"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 400) {
        setError(t("forgotPasswordInvalidEmail"));
        return;
      }
      if (!res.ok) {
        setError(t("passwordResetGenericError"));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("passwordResetGenericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow text-accent mb-2">{t("passwordResetEyebrow")}</p>
      <h1 className="font-display text-foreground mb-4 text-2xl">{t("loginForgotPassword")}</h1>

      {submitted ? (
        <div
          role="status"
          className="border-border bg-surface text-foreground/80 rounded-lg border p-4 text-sm"
        >
          {t("forgotPasswordSent")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-foreground/60 text-sm">{t("forgotPasswordIntro")}</p>
          <div>
            <label htmlFor="email" className="text-foreground/80 mb-1 block text-sm">
              {t("forgotPasswordEmailLabel")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          {error && (
            <p role="alert" className="badge-danger">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? t("forgotPasswordSubmitting") : t("forgotPasswordSubmit")}
          </button>
        </form>
      )}

      <Link
        href="/?login=1"
        className="text-foreground/60 hover:text-accent mt-6 text-center text-sm"
      >
        {t("passwordResetBackToLogin")}
      </Link>
    </div>
  );
}
