"use client";

import { useAuth } from "./AuthContext";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface GuestGateProps {
  children: React.ReactNode;
  /** Messaggio da mostrare quando la sezione è bloccata */
  message?: string;
}

/**
 * Wrapper che scurisce e disabilita il contenuto per utenti ospiti (non autenticati).
 * Mostra un overlay con un messaggio e un click apre la modal di login.
 */
export default function GuestGate({
  children,
  message,
}: GuestGateProps) {
  const t = useTranslations("auth");
  const { type, loading, setShowLoginModal } = useAuth();
  const resolvedMessage = message ?? t("guestGateMessage");

  // Se l'utente è autenticato (user o admin), mostra il contenuto normalmente
  if (loading || type === "user" || type === "admin") {
    return <>{children}</>;
  }

  // Ospite: mostra contenuto scurito con overlay
  return (
    <div className="relative">
      {/* Contenuto scurito */}
      <div className="opacity-30 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay cliccabile */}
      <div
        onClick={() => setShowLoginModal(true)}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer bg-background/60 rounded-xl backdrop-blur-[2px] transition-colors hover:bg-background/70 animate-fade-in border border-border"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowLoginModal(true);
          }
        }}
      >
        <div className="flex flex-col items-center gap-3 p-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <p className="text-foreground/80 text-sm font-medium text-center max-w-xs">
            {resolvedMessage}
          </p>
          <span className="text-accent text-xs font-semibold uppercase tracking-wider">
            {t("guestGateCta")}
          </span>
        </div>
      </div>
    </div>
  );
}
