"use client";

import { useState, useEffect } from "react";
import type { SectionVisibility, RoleAccessType } from "@/types";
import { AlertTriangle, Check, X, Clock } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  guest: "Ospite",
  credente: "Credente",
  madre: "Madre",
  padre: "Padre",
  ospite_chiesa: "Ospite altra chiesa",
  admin: "Admin",
  superadmin: "SuperAdmin",
};

const ACCESS_OPTIONS: { value: RoleAccessType; label: string; icon: React.ComponentType<{ className: string }> }[] = [
  { value: "full", label: "Accesso completo", icon: Check },
  { value: "coming_soon", label: "Coming Soon", icon: Clock },
  { value: "hidden", label: "Nessun accesso", icon: X },
];

interface SuperAdminSectionVisibilityManagerProps {
  sections?: SectionVisibility[];
}

export default function SuperAdminSectionVisibilityManager({
  sections: initialSections,
}: SuperAdminSectionVisibilityManagerProps) {
  const [sections, setSections] = useState<SectionVisibility[]>(initialSections || []);
  const [loading, setLoading] = useState(!initialSections);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialSections) return;
    
    async function fetchSections() {
      try {
        const res = await fetch("/api/admin/section-visibility");
        const data = await res.json();
        if (data.success) {
          setSections(data.data);
        } else {
          setError("Errore nel caricamento delle sezioni");
        }
      } catch (err) {
        setError("Errore di connessione");
      } finally {
        setLoading(false);
      }
    }
    
    fetchSections();
  }, [initialSections]);

  async function handleAccessChange(sectionId: string, role: string, access: RoleAccessType) {
    setSaving(sectionId);
    setError("");
    
    try {
      const res = await fetch(`/api/admin/section-visibility/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleConfig: {
            [role]: access,
          },
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSections((prev) =>
          prev.map((s) => (s.sectionId === sectionId ? data.data : s))
        );
        setSuccess("Configurazione aggiornata con successo!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Errore nell'aggiornamento");
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-gray-600">Caricamento sezioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-3">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <div className="grid gap-6">
        {sections.map((section) => (
          <div key={section.sectionId} className="border border-gray-200 rounded-lg p-6 bg-white">
            {/* Header della sezione */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.sectionLabel}</h3>
                <p className="text-sm text-gray-600 mt-1">ID: {section.sectionId}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                section.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {section.isActive ? "Attivo" : "Disattivo"}
              </div>
            </div>

            {/* Tabella permessi per ruolo */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Ruolo</th>
                    {ACCESS_OPTIONS.map((opt) => (
                      <th key={opt.value} className="text-center py-2 px-3 font-semibold text-gray-700">
                        {opt.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <tr key={role} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{label}</td>
                      {ACCESS_OPTIONS.map((opt) => {
                        const currentAccess = section.roleConfig[role as keyof typeof section.roleConfig];
                        const isSelected = currentAccess === opt.value;
                        const Icon = opt.icon;
                        
                        return (
                          <td key={opt.value} className="text-center py-3 px-3">
                            <button
                              onClick={() => handleAccessChange(section.sectionId, role, opt.value)}
                              disabled={saving === section.sectionId}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded transition-all ${
                                isSelected
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              } ${
                                saving === section.sectionId ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title={opt.label}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Ultimo aggiornamento: {new Date(section.updatedAt).toLocaleString("it-IT")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
