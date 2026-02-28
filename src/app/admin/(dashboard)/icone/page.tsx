"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Icona {
  id: string;
  slug: string;
  nome: string;
  nomeSanto: string;
  descrizione: string;
  descrizioneEstesa: string;
  posizione: string;
  categoria: string;
  immagini: string[];
  tecnica: string;
  autore: string;
  anno: string;
  testiCorrelati: string[];
  iconeCorrelate: string[];
}

const categorie = ["Santi", "Vergine Maria", "Angeli", "Profeti", "Padri della Chiesa", "Altro"];

const emptyForm: Omit<Icona, "id"> = {
  slug: "", nome: "", nomeSanto: "", descrizione: "", descrizioneEstesa: "",
  posizione: "", categoria: "Santi", immagini: [], tecnica: "", autore: "", anno: "",
  testiCorrelati: [], iconeCorrelate: [],
};

export default function AdminIconePage() {
  const [icone, setIcone] = useState<Icona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Icona | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [immaginiStr, setImmaginiStr] = useState("");

  async function fetchData() {
    const res = await fetch("/api/admin/icone");
    setIcone(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setImmaginiStr("");
    setShowForm(true);
  }

  function openEdit(icona: Icona) {
    setEditId(icona.id);
    setForm({ ...icona });
    setImmaginiStr(icona.immagini.join(", "));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.nomeSanto);
      const immagini = immaginiStr.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = { ...form, slug, immagini };

      if (editId) {
        const res = await fetch("/api/admin/icone", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Icona modificata con successo");
      } else {
        const res = await fetch("/api/admin/icone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Icona aggiunta con successo");
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
      const res = await fetch(`/api/admin/icone?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore server");
      showToast("Eliminata con successo");
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
          <h1 className="text-2xl font-bold text-gray-900">Gestione Icone</h1>
          <p className="text-sm text-gray-500 mt-1">{icone.length} icone nella galleria</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white text-sm font-semibold rounded-lg hover:bg-[#C5A028] transition-colors">
          <Plus className="w-4 h-4" /> Aggiungi icona
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">{editId ? "Modifica icona" : "Nuova icona"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nome Santo/a</label>
              <input type="text" value={form.nomeSanto} onChange={(e) => setForm({ ...form, nomeSanto: e.target.value, nome: `Icona di ${e.target.value}` })} required placeholder="San Marco Evangelista" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generato" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Posizione in chiesa</label>
              <input type="text" value={form.posizione} onChange={(e) => setForm({ ...form, posizione: e.target.value })} placeholder="Altare principale" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]">
                {categorie.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tecnica</label>
              <input type="text" value={form.tecnica} onChange={(e) => setForm({ ...form, tecnica: e.target.value })} placeholder="Tempera su legno" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Autore</label>
              <input type="text" value={form.autore} onChange={(e) => setForm({ ...form, autore: e.target.value })} placeholder="Iconografo copto" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Anno</label>
              <input type="text" value={form.anno} onChange={(e) => setForm({ ...form, anno: e.target.value })} placeholder="2024" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Immagini (URLs separati da virgola)</label>
              <input type="text" value={immaginiStr} onChange={(e) => setImmaginiStr(e.target.value)} placeholder="/images/icone/nome.jpg" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descrizione breve</label>
            <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={2} placeholder="Breve descrizione" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Storia completa</label>
            <textarea value={form.descrizioneEstesa} onChange={(e) => setForm({ ...form, descrizioneEstesa: e.target.value })} rows={5} placeholder="Testo completo della storia dell'icona" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#D4AF37] text-white text-sm font-semibold rounded-lg hover:bg-[#C5A028] transition-colors disabled:opacity-50">
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Posizione</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {icone.map((icona, i) => (
              <tr key={icona.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{icona.nomeSanto}</td>
                <td className="px-4 py-3 text-gray-600">{icona.posizione}</td>
                <td className="px-4 py-3 text-gray-600">{icona.categoria}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(icona)} className="p-1.5 text-gray-400 hover:text-[#D4AF37] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(icona)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {icone.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nessuna icona presente</p>}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina icona"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.nomeSanto}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
