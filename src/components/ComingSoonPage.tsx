"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthContext";
import { Rocket, Lock } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function ComingSoonPage({ title, description, children }: ComingSoonPageProps) {
  const t = useTranslations("common");
  const { type } = useAuth();
  const isAdmin = type === "admin";

  // Se admin, mostra il contenuto
  if (isAdmin && children) {
    return <>{children}</>;
  }

  // Altrimenti, mostra COMING SOON
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
            {description || t("comingSoonDescription")}
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
