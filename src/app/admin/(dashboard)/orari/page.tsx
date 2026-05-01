"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Celebrazione {
  tipo: string;
  orario: string;
  note?: string;
}

interface Orario {
  giorno: string;
  celebrazioni: Celebrazione[];
}

const giorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

export default function AdminOrariPage() {
  const [orari, setOrari] = useState<Orario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGiorno, setEditGiorno] = useState<string | null>(null);
  const [celebrazioni, setCelebrazioni] = useState<Celebrazione[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGiorno, setNewGiorno] = useState("");

  async function fetchData() {
    const res = await fetch("/api/admin/orari");
    setOrari(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function startEdit(orario: Orario) {
    setEditGiorno(orario.giorno);
    setCelebrazioni([...orario.celebrazioni.map((c) => ({ ...c }))]);
  }

  function addCelebrazione() {
    setCelebrazioni([...celebrazioni, { tipo: "", orario: "", note: "" }]);
  }

  function removeCelebrazione(idx: number) {
    setCelebrazioni(celebrazioni.filter((_, i) => i !== idx));
  }

  function updateCel(idx: number, field: keyof Celebrazione, value: string) {
    const updated = [...celebrazioni];
    updated[idx] = { ...updated[idx], [field]: value };
    setCelebrazioni(updated);
  }

  async function handleSave() {
    if (!editGiorno) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giorno: editGiorno, celebrazioni }),
      });
      if (!res.ok) throw new Error("Errore server");
      showToast("Orari salvati con successo");
      setEditGiorno(null);
      fetchData();
    } catch {
      showToast("Errore nel salvataggio", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDay(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giorno: newGiorno, celebrazioni: [{ tipo: "", orario: "" }] }),
      });
      if (!res.ok) throw new Error("Errore server");
      showToast("Giorno aggiunto");
      setShowAddForm(false);
      setNewGiorno("");
      fetchData();
    } catch {
      showToast("Errore", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orari?giorno=${encodeURIComponent(deleteTarget)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore server");
      showToast("Giorno eliminato con successo");
      setDeleteTarget(null);
      fetchData();
    } catch {
      showToast("Errore nell'eliminazione", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const giorniDisponibili = giorniSettimana.filter((g) => !orari.find((o) => o.giorno === g));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Orari</h1>
          <p className="text-sm text-gray-500 mt-1">{orari.length} giorni configurati</p>
        </div>
        {giorniDisponibili.length > 0 && (
          <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors">
            <Plus className="w-4 h-4" /> Aggiungi giorno
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddDay} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Giorno</label>
            <select value={newGiorno} onChange={(e) => setNewGiorno(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">Seleziona...</option>
              {giorniDisponibili.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg">{saving ? "..." : "Aggiungi"}</button>
          <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg">Annulla</button>
        </form>
      )}

      <div className="space-y-4">
        {orari.map((orario) => (
          <div key={orario.giorno} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">{orario.giorno}</h3>
              <div className="flex gap-1">
                <button onClick={() => startEdit(orario)} className="p-1.5 text-gray-400 hover:text-gold transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(orario.giorno)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {editGiorno === orario.giorno ? (
              <div className="p-4 space-y-3">
                {celebrazioni.map((cel, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
                    <input type="text" value={cel.tipo} onChange={(e) => updateCel(idx, "tipo", e.target.value)} placeholder="Tipo celebrazione" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                    <input type="text" value={cel.orario} onChange={(e) => updateCel(idx, "orario", e.target.value)} placeholder="08:00 – 11:00" className="w-full sm:w-40 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                    <input type="text" value={cel.note || ""} onChange={(e) => updateCel(idx, "note", e.target.value)} placeholder="Note" className="w-full sm:w-48 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                    <button onClick={() => removeCelebrazione(idx)} className="p-2 text-red-400 hover:text-red-600 self-end sm:self-auto"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={addCelebrazione} className="text-sm text-gold font-medium hover:underline">+ Aggiungi riga</button>
                  <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-amber-600 text-white text-sm font-semibold rounded-lg">{saving ? "..." : "Salva"}</button>
                  <button onClick={() => setEditGiorno(null)} className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg">Annulla</button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orario.celebrazioni.map((cel, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex justify-between">
                    <span className="text-sm text-gray-900">{cel.tipo}</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">{cel.orario}</span>
                      {cel.note && <span className="text-xs text-gray-400 ml-2">({cel.note})</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina giorno"
        message={`Sei sicuro di voler eliminare tutti gli orari di "${deleteTarget}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
