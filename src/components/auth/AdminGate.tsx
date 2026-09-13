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
        <div className="icon-box mx-auto h-16 w-16">
          <Rocket className="w-8 h-8 text-accent" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">
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
          <Link href="/" className="btn-primary">
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
