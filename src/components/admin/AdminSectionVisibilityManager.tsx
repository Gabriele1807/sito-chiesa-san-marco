"use client";

import { useState, useEffect } from "react";
import type { SectionVisibility } from "@/types";
import { AlertTriangle, Check } from "lucide-react";

interface AdminSectionVisibilityManagerProps {
  sections?: SectionVisibility[];
}

export default function AdminSectionVisibilityManager({
  sections: initialSections,
}: AdminSectionVisibilityManagerProps) {
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

  async function handleToggle(sectionId: string, isActive: boolean) {
    setSaving(sectionId);
    setError("");
    
    try {
      const res = await fetch(`/api/admin/section-visibility/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSections((prev) =>
          prev.map((s) => (s.sectionId === sectionId ? data.data : s))
        );
        setSuccess("Stato aggiornato!");
        setTimeout(() => setSuccess(""), 2000);
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
    <div className="space-y-4">
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

      <div className="grid gap-3">
        {sections.map((section) => (
          <div
            key={section.sectionId}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div>
              <h4 className="font-medium text-gray-900">{section.sectionLabel}</h4>
              <p className="text-xs text-gray-500 mt-0.5">ID: {section.sectionId}</p>
            </div>
            
            <button
              onClick={() => handleToggle(section.sectionId, !section.isActive)}
              disabled={saving === section.sectionId}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                section.isActive
                  ? "bg-green-600 focus:ring-green-500"
                  : "bg-gray-300 focus:ring-gray-500"
              } ${
                saving === section.sectionId ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  section.isActive ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
