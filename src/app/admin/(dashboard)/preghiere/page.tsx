"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Preghiera {
  id: string;
  slug: string;
  titolo: string;
  descrizione: string;
  urlPDF?: string;
  testoInline?: string;
  categoria: string;
}

const categorie = ["Preghiere fondamentali", "Agpeya", "Preghiere liturgiche", "Preghiere mariane", "Altro"];

const emptyForm: Omit<Preghiera, "id"> = {
  slug: "", titolo: "", descrizione: "", urlPDF: "", testoInline: "", categoria: "Preghiere fondamentali",
};

export default function AdminPreghierePage() {
  const [preghiere, setPreghiere] = useState<Preghiera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Preghiera | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    const res = await adminFetch("/api/admin/preghiere");
    setPreghiere(await res.json());
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

  function openEdit(p: Preghiera) {
    setEditId(p.id);
    setForm({ slug: p.slug, titolo: p.titolo, descrizione: p.descrizione, urlPDF: p.urlPDF || "", testoInline: p.testoInline || "", categoria: p.categoria });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.titolo);
      const payload = { ...form, slug };

      if (editId) {
        const res = await adminFetch("/api/admin/preghiere", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Preghiera modificata con successo");
      } else {
        const res = await adminFetch("/api/admin/preghiere", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Preghiera aggiunta con successo");
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
      const res = await adminFetch(`/api/admin/preghiere?id=${deleteTarget.id}`, { method: "DELETE" });
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-foreground/40" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Preghiere</h1>
          <p className="text-sm text-foreground/60 mt-1">{preghiere.length} preghiere</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> Aggiungi preghiera
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">{editId ? "Modifica preghiera" : "Nuova preghiera"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Titolo</label>
              <input type="text" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} required placeholder="Titolo preghiera" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold">
                {categorie.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generato" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold-light" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">URL PDF (opzionale)</label>
              <input type="text" value={form.urlPDF} onChange={(e) => setForm({ ...form, urlPDF: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold-light" />
              <p className="text-xs text-foreground/40 mt-1">Link Google Drive del PDF</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Descrizione</label>
            <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={2} placeholder="Breve descrizione" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold-light" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Testo preghiera (opzionale)</label>
            <textarea value={form.testoInline} onChange={(e) => setForm({ ...form, testoInline: e.target.value })} rows={5} placeholder="Testo completo della preghiera" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-gold-light" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? "Salvando..." : editId ? "Salva modifiche" : "Aggiungi"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-foreground/80 text-sm rounded-lg hover:bg-background transition-colors">Annulla</button>
          </div>
        </form>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Titolo</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Categoria</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Formato</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground/70">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {preghiere.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? "bg-surface" : "bg-background/50"}>
                <td className="px-4 py-3 font-medium text-foreground">{p.titolo}</td>
                <td className="px-4 py-3 text-foreground/70">{p.categoria}</td>
                <td className="px-4 py-3 text-foreground/70">{p.testoInline ? "Testo" : "PDF"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-foreground/40 hover:text-accent transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {preghiere.length === 0 && <p className="text-center py-8 text-foreground/40 text-sm">Nessuna preghiera presente</p>}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina preghiera"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.titolo}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
