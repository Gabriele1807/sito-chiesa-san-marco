"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { Rocket, Lock } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function ComingSoonPage({ title, description, children }: ComingSoonPageProps) {
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20">
          <Rocket className="w-8 h-8 text-accent" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-foreground/60 text-lg max-w-md mx-auto">
            Questa sezione sarà disponibile a breve. Torna presto per scoprire tutte le novità!
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-foreground/50 pt-4">
          <Lock className="w-4 h-4" />
          <span>Disponibile solo per gli amministratori</span>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
          >
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  );
}
