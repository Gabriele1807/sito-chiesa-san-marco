"use client";

import { useAuth } from "./AuthContext";
import { Lock } from "lucide-react";

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
  message = "Per accedere a questa sezione registrati o accedi",
}: GuestGateProps) {
  const { type, loading, setShowLoginModal } = useAuth();

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
        className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer bg-gray-900/40 rounded-xl backdrop-blur-[2px] transition-colors hover:bg-gray-900/50 animate-fade-in"
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
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/70" />
          </div>
          <p className="text-white/90 text-sm font-medium text-center max-w-xs">
            {message}
          </p>
          <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">
            Accedi o Registrati
          </span>
        </div>
      </div>
    </div>
  );
}
