"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Libro {
  id: string;
  slug: string;
  titolo: string;
  autore: string;
  tipo: string;
  descrizione: string;
  urlPDF: string;
  copertina: string;
  iconeCorrelate: string[];
}

const tipi = ["Liturgia", "Patristica", "Vangelo", "Catechismo", "Sinassario", "Altro"];

const emptyForm: Omit<Libro, "id"> = {
  slug: "", titolo: "", autore: "", tipo: "Liturgia", descrizione: "",
  urlPDF: "", copertina: "", iconeCorrelate: [],
};

export default function AdminLibreriaPage() {
  const [libri, setLibri] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Libro | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/admin/libreria");
    setLibri(await res.json());
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

  function openEdit(libro: Libro) {
    setEditId(libro.id);
    setForm({ slug: libro.slug, titolo: libro.titolo, autore: libro.autore, tipo: libro.tipo, descrizione: libro.descrizione, urlPDF: libro.urlPDF, copertina: libro.copertina, iconeCorrelate: libro.iconeCorrelate });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.titolo);
      const payload = { ...form, slug };

      if (editId) {
        const res = await fetch("/api/admin/libreria", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Libro modificato con successo");
      } else {
        const res = await fetch("/api/admin/libreria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Libro aggiunto con successo");
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
      const res = await fetch(`/api/admin/libreria?id=${deleteTarget.id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold text-gray-900">Gestione Libreria</h1>
          <p className="text-sm text-gray-500 mt-1">{libri.length} libri/testi sacri</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> Aggiungi libro
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">{editId ? "Modifica libro" : "Nuovo libro"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Titolo</label>
              <input type="text" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} required placeholder="Titolo del libro" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Autore</label>
              <input type="text" value={form.autore} onChange={(e) => setForm({ ...form, autore: e.target.value })} required placeholder="Autore" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold">
                {tipi.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generato dal titolo" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descrizione</label>
            <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={3} placeholder="Descrizione breve" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">URL PDF</label>
              <input type="text" value={form.urlPDF} onChange={(e) => setForm({ ...form, urlPDF: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
              <p className="text-xs text-gray-400 mt-1">Link Google Drive del PDF</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Immagine copertina</label>
              <input type="text" value={form.copertina} onChange={(e) => setForm({ ...form, copertina: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold" />
              <p className="text-xs text-gray-400 mt-1">Link Google Drive dell&apos;immagine</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
              {saving ? "Salvando..." : editId ? "Salva modifiche" : "Aggiungi"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Titolo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Autore</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {libri.map((libro, i) => (
              <tr key={libro.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{libro.titolo}</td>
                <td className="px-4 py-3 text-gray-600">{libro.tipo}</td>
                <td className="px-4 py-3 text-gray-600">{libro.autore}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(libro)} className="p-1.5 text-gray-400 hover:text-gold transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(libro)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {libri.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nessun libro presente</p>}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina libro"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.titolo}"? Questa azione non è reversibile.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
