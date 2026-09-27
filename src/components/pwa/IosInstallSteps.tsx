"use client";

import { useTranslations } from "next-intl";
import { Share, SquarePlus } from "lucide-react";

/** Passaggi per installare la PWA da Safari su iPhone/iPad (nessun prompt automatico su iOS). */
export default function IosInstallSteps({ notSafari = false }: { notSafari?: boolean }) {
  const t = useTranslations("pwa");
  const iconClass = "mx-0.5 inline h-4 w-4 align-[-3px] text-accent";

  if (notSafari) {
    return <p className="text-foreground/75 text-sm leading-relaxed">{t("iosNotSafari")}</p>;
  }

  return (
    <ol className="text-foreground/75 list-decimal space-y-1.5 ps-5 text-sm leading-relaxed">
      <li>
        {t.rich("iosStep1", { icon: () => <Share className={iconClass} aria-label="Condividi" /> })}
      </li>
      <li>
        {t.rich("iosStep2", { icon: () => <SquarePlus className={iconClass} aria-hidden /> })}
      </li>
      <li>{t("iosStep3")}</li>
    </ol>
  );
}
