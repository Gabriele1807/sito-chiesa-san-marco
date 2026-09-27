"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Smartphone, X } from "lucide-react";
import { canOfferInstall, promptInstall, useInstallState } from "./install-store";
import IosInstallSteps from "./IosInstallSteps";

/**
 * Link "Installa l'app" sempre raggiungibile (footer), anche dopo aver
 * chiuso l'invito automatico. Non compare se il browser non permette
 * l'installazione o se l'app è già aperta come installata.
 */
export default function InstallAppButton({ className }: { className?: string }) {
  const t = useTranslations("pwa");
  const install = useInstallState();
  const [showIos, setShowIos] = useState(false);

  if (!canOfferInstall(install)) return null;

  const isIos = install.platform === "ios-safari" || install.platform === "ios-other";

  return (
    <>
      <button
        type="button"
        onClick={() => (isIos ? setShowIos(true) : promptInstall())}
        className={
          className ?? "hover:text-accent inline-flex items-center gap-1.5 transition-colors"
        }
      >
        <Smartphone className="h-3.5 w-3.5" aria-hidden />
        {t("installButton")}
      </button>
      {showIos && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => setShowIos(false)}
        >
          <div
            className="border-border bg-surface w-full max-w-md rounded-2xl border p-5 text-start shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p id="ios-install-title" className="text-foreground font-bold">
                {t("iosTitle")}
              </p>
              <button
                type="button"
                onClick={() => setShowIos(false)}
                className="text-foreground/50 hover:text-foreground rounded-full p-1"
                aria-label={t("installClose")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <IosInstallSteps notSafari={install.platform === "ios-other"} />
          </div>
        </div>
      )}
    </>
  );
}
