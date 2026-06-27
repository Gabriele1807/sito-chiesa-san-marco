"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthContext";
import { Rocket, Lock } from "lucide-react";

interface AdminGateProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

/**
 * Wrapper che mostra COMING SOON se l'utente non è admin.
 * Se è admin, mostra il contenuto normalmente.
 */
export default function AdminGate({
  children,
  title,
  description,
}: AdminGateProps) {
  const t = useTranslations("common");
  const { type, loading } = useAuth();
  const isAdmin = type === "admin";

  // Se ancora sta caricando, mostra placeholder vuoto
  if (loading) {
    return <div className="min-h-[40vh]" />;
  }

  // Se admin, mostra il contenuto
  if (isAdmin) {
    return <>{children}</>;
  }

  // Non admin: mostra COMING SOON
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20">
          <Rocket className="w-8 h-8 text-accent" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-foreground/60 text-lg max-w-md mx-auto">
            {description ?? t("comingSoonDescription")}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-foreground/50 pt-4">
          <Lock className="w-4 h-4" />
          <span>{t("adminOnly")}</span>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
