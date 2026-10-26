"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Cookie, X } from "lucide-react";
import { onOpenConsentPreferences, saveConsent, useConsent } from "@/lib/consent";

/**
 * Banner di consenso ai contenuti di terze parti.
 *
 * - Accetta e Rifiuta hanno lo stesso peso visivo (requisito del Garante).
 * - Nessuna casella pre-selezionata; chiudere con la X equivale a rifiutare.
 * - Si riapre dal link «Gestisci cookie» nel footer.
 */
export default function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const locale = useLocale();
  const pathname = usePathname();
  const consent = useConsent();

  const [reopened, setReopened] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);

  useEffect(
    () =>
      onOpenConsentPreferences(() => {
        setThirdParty(consent.thirdParty);
        setShowDetails(true);
        setReopened(true);
      }),
    [consent.thirdParty]
  );

  // L'area admin usa solo cookie tecnici: niente banner.
  if (pathname?.startsWith("/admin")) return null;
  if (consent.status === "unknown") return null;
  if (consent.status === "decided" && !reopened) return null;

  const decide = (value: boolean) => {
    saveConsent({ thirdParty: value });
    setReopened(false);
    setShowDetails(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-4 text-foreground shadow-2xl sm:bottom-5 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="cookie-banner-title" className="font-display text-lg leading-tight">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/75">
            {t("text")}{" "}
            <Link href="/cookie-policy" className="text-accent underline underline-offset-2">
              {t("policyLink")}
            </Link>
            {" · "}
            <Link href="/privacy" className="text-accent underline underline-offset-2">
              {t("privacyLink")}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => decide(false)}
          aria-label={t("close")}
          className="-m-1 rounded-lg p-2 text-foreground/55 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{t("necessaryTitle")}</p>
              <p className="text-foreground/65">{t("necessaryDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label={t("necessaryTitle")}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="consent-third-party" className="cursor-pointer">
              <span className="block font-semibold">{t("thirdPartyTitle")}</span>
              <span className="text-foreground/65">{t("thirdPartyDesc")}</span>
            </label>
            <input
              id="consent-third-party"
              type="checkbox"
              checked={thirdParty}
              onChange={(e) => setThirdParty(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => decide(false)} className="btn-primary min-h-11">
          {t("reject")}
        </button>
        {showDetails ? (
          <button type="button" onClick={() => decide(thirdParty)} className="btn-secondary min-h-11">
            {t("save")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setThirdParty(consent.thirdParty);
              setShowDetails(true);
            }}
            className="btn-secondary min-h-11"
          >
            {t("customize")}
          </button>
        )}
        <button type="button" onClick={() => decide(true)} className="btn-primary min-h-11">
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
