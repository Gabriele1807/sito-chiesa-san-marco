/**
 * SectionVisibilityGate - Server Component
 * Verifica l'accesso alla sezione e mostra:
 * - Contenuto se accesso è "full"
 * - Coming Soon se accesso è "coming_soon"  
 * - Accesso negato se accesso è "hidden"
 */

import { ReactNode } from "react";
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
  // Verifica l'accesso dell'utente a questa sezione
  const access = await getSectionAccess(sectionId);

  // Se accesso negato completamente
  if (access === "hidden") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Accesso Negato</h1>
          <p className="text-foreground/60">Non hai i permessi per visualizzare questa sezione.</p>
        </div>
      </div>
    );
  }

  // Se accesso coming soon
  if (access === "coming_soon") {
    return <ComingSoonPage title={title} description="Questa sezione sarà disponibile a breve. Torna presto per scoprire tutte le novità!" />;
  }

  // Se accesso completo, mostra il contenuto
  return <>{children}</>;
}
