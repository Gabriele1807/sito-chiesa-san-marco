/**
 * SectionVisibilityGate - Server Component
 * Verifica l'accesso alla sezione e mostra:
 * - Contenuto se accesso è "full"
 * - Coming Soon se accesso è "coming_soon"  
 * - Accesso negato se accesso è "hidden"
 */

import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getSectionAccess } from "@/lib/section-access";
import ComingSoonPage from "@/components/ComingSoonPage";

interface SectionVisibilityGateProps {
  sectionId: string;
  title: string;
  children: ReactNode;
}

export default async function SectionVisibilityGate({
  sectionId,
  title,
  children,
}: SectionVisibilityGateProps) {
  const tCommon = await getTranslations("common");

  // Verifica l'accesso dell'utente a questa sezione
  const access = await getSectionAccess(sectionId);

  // Se accesso negato completamente
  if (access === "hidden") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-border text-2xl">🔒</div>
          <h1 className="font-display text-2xl text-foreground mb-2">{tCommon("accessDenied")}</h1>
          <p className="text-foreground/60">{tCommon("noPermission")}</p>
        </div>
      </div>
    );
  }

  // Se accesso coming soon
  if (access === "coming_soon") {
    return <ComingSoonPage title={title} description={tCommon("comingSoonDescription")} />;
  }

  // Se accesso completo, mostra il contenuto
  return <>{children}</>;
}
