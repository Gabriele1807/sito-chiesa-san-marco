"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Evento {
  id: string;
  slug: string;
  titolo: string;
  data: string;
  dataFine?: string;
  descrizione: string;
  luogo: string;
  postiDisponibili?: number;
  immagine?: string;
}

const emptyForm: Omit<Evento, "id"> = {
  slug: "", titolo: "", data: "", dataFine: "", descrizione: "",
  luogo: "", postiDisponibili: undefined, immagine: "",
};

export default function AdminEventiPage() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/admin/eventi");
    setEventi(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(ev: Evento) {
    setEditId(ev.id);
    setForm({
      slug: ev.slug, titolo: ev.titolo, data: ev.data.slice(0, 16),
      dataFine: ev.dataFine?.slice(0, 16) || "", descrizione: ev.descrizione,
      luogo: ev.luogo, postiDisponibili: ev.postiDisponibili, immagine: ev.immagine || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.titolo);
      const payload = { ...form, slug, postiDisponibili: form.postiDisponibili ? Number(form.postiDisponibili) : undefined };

      if (editId) {
        const res = await fetch("/api/admin/eventi", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Evento modificato con successo");
      } else {
        const res = await fetch("/api/admin/eventi", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Evento aggiunto con successo");
      }
      setShowForm(false);
      fetchData();
    } catch {
      showToast("Errore nel salvataggio", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/eventi?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore server");
      showToast("Eliminato con successo");
      setDeleteTarget(null);
      fetchData();
    } catch {
      showToast("Errore nell'eliminazione", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Eventi</h1>
          <p className="text-sm text-gray-500 mt-1">{eventi.length} eventi</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors">
          <Plus className="w-4 h-4" /> Aggiungi evento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">{editId ? "Modifica evento" : "Nuovo evento"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Titolo</label>
              <input type="text" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} required placeholder="Titolo evento" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Luogo</label>
              <input type="text" value={form.luogo} onChange={(e) => setForm({ ...form, luogo: e.target.value })} required placeholder="Chiesa di San Marco, Milano" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Data inizio</label>
              <input type="datetime-local" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Data fine (opzionale)</label>
              <input type="datetime-local" value={form.dataFine} onChange={(e) => setForm({ ...form, dataFine: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Posti disponibili</label>
              <input type="number" value={form.postiDisponibili ?? ""} onChange={(e) => setForm({ ...form, postiDisponibili: e.target.value ? Number(e.target.value) : undefined })} placeholder="Illimitati" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Immagine (URL)</label>
              <input type="text" value={form.immagine} onChange={(e) => setForm({ ...form, immagine: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
              <p className="text-xs text-gray-400 mt-1">Link Google Drive dell&apos;immagine</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descrizione</label>
            <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={3} placeholder="Descrizione dell'evento" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50">
              {saving ? "Salvando..." : editId ? "Salva modifiche" : "Aggiungi"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">Annulla</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Titolo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Luogo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Posti</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {eventi.map((ev, i) => (
              <tr key={ev.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{ev.titolo}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(ev.data).toLocaleDateString("it-IT")}</td>
                <td className="px-4 py-3 text-gray-600">{ev.luogo}</td>
                <td className="px-4 py-3 text-gray-600">{ev.postiDisponibili ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(ev)} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(ev)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {eventi.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nessun evento presente</p>}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina evento"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.titolo}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
