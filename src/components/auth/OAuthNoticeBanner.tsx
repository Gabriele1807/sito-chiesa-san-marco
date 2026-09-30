"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info, X } from "lucide-react";

const NOTICES: Record<string, "oauthNoticeAlreadyRegistered"> = {
  already_registered: "oauthNoticeAlreadyRegistered",
};

/**
 * Avviso dopo un accesso con Google/Facebook (?oauthNotice=<codice>), per
 * ora solo "eri già registrato": chi sceglie "Registrati con Google" con un
 * account già registrato entra nell'account esistente e deve capire perché
 * non vede il modulo di registrazione. Il parametro viene tolto dall'URL.
 */
export default function OAuthNoticeBanner() {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const [notice, setNotice] = useState<(typeof NOTICES)[string] | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("oauthNotice");
    if (!code) return;
    url.searchParams.delete("oauthNotice");
    window.history.replaceState(window.history.state, "", url.toString());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- parametro letto una volta dall'URL
    setNotice(NOTICES[code] ?? null);
  }, [pathname]);

  if (!notice) return null;

  return (
    <div
      role="status"
      className="border-primary/20 bg-primary/[0.05] mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
    >
      <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="text-foreground/85 min-w-0 flex-1">{t(notice)}</p>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label={t("oauthNoticeClose")}
        className="text-foreground/60 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-gold -me-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
