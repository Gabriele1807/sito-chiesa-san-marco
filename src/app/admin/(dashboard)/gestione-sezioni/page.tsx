import { Metadata } from "next";
import AdminSectionVisibilityManager from "@/components/admin/AdminSectionVisibilityManager";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";
import type { SectionVisibility } from "@/types";

export const metadata: Metadata = {
  title: "Gestione Sezioni | Admin",
  description: "Attiva o disattiva le sezioni del sito",
};

export default async function AdminSectionsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Gestione Sezioni</h1>
        <p className="text-gray-600 mt-2">
          Attiva o disattiva le sezioni del sito. Le sezioni disattivate non saranno visibili ai visitatori.
        </p>
      </div>

      {/* Manager Component */}
      <div>
        <AdminSectionVisibilityManager sections={sections} />
      </div>
    </div>
  );
}
