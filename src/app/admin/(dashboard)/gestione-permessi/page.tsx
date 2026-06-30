import { Metadata } from "next";
import SuperAdminSectionVisibilityManager from "@/components/admin/SuperAdminSectionVisibilityManager";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";
import type { SectionVisibility } from "@/types";

export const metadata: Metadata = {
  title: "Gestione Permessi Sezioni | Admin",
  description: "Gestione avanzata dei permessi di accesso per sezione e ruolo",
};

export default async function SuperAdminPermissionsPage() {
  // Carica i dati lato server
  let sections: SectionVisibility[] = [];
  try {
    sections = await getAllSectionVisibilities();
  } catch (error) {
    console.error("Errore nel caricamento sezioni:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione Permessi Sezioni</h1>
        <p className="text-gray-600 mt-2">
          Configura i permessi di accesso per ogni sezione e ruolo. Puoi decidere quale ruolo avrà accesso completo, visualizzerà &quot;Coming Soon&quot; o non avrà accesso.
        </p>
      </div>

      {/* Manager Component */}
      <div>
        <SuperAdminSectionVisibilityManager sections={sections} />
      </div>
    </div>
  );
}
