"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Youtube } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface VideoCorso {
  id: string;
  titolo: string;
  descrizione: string;
  urlVideo: string;
  categoria: string;
  thumbnail?: string;
}

const categorie = ["Canti liturgici", "Corsi di preghiera", "Meditazioni", "Altro"];

const emptyForm: Omit<VideoCorso, "id"> = {
  titolo: "",
  descrizione: "",
  urlVideo: "",
  categoria: "Canti liturgici",
  thumbnail: "",
};

export default function AdminVideoCorsiPage() {
  const [items, setItems] = useState<VideoCorso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoCorso | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/admin/video-corsi");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: VideoCorso) {
    setEditId(item.id);
    setForm({
      titolo: item.titolo,
      descrizione: item.descrizione,
      urlVideo: item.urlVideo,
      categoria: item.categoria,
      thumbnail: item.thumbnail || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };

      if (editId) {
        const res = await fetch("/api/admin/video-corsi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Video modificato con successo");
      } else {
        const res = await fetch("/api/admin/video-corsi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore server");
        showToast("Video aggiunto con successo");
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
      const res = await fetch(`/api/admin/video-corsi?id=${deleteTarget.id}`, { method: "DELETE" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Video & Corsi</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} contenuti video</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4" /> Aggiungi video
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">{editId ? "Modifica video" : "Nuovo video"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Titolo</label>
              <input
                type="text"
                value={form.titolo}
                onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                required
                placeholder="Titolo video"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-background text-foreground"
              >
                {categorie.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">URL video</label>
              <input
                type="text"
                value={form.urlVideo}
                onChange={(e) => setForm({ ...form, urlVideo: e.target.value })}
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Thumbnail (opzionale)</label>
              <input
                type="text"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descrizione</label>
            <textarea
              value={form.descrizione}
              onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
              rows={3}
              placeholder="Descrizione del contenuto video"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "Salvando..." : editId ? "Salva modifiche" : "Aggiungi"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Titolo</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Categoria</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">Link</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground/70">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-surface/50"}>
                <td className="px-4 py-3 font-medium text-foreground">{item.titolo}</td>
                <td className="px-4 py-3 text-foreground/70">{item.categoria}</td>
                <td className="px-4 py-3 text-foreground/70 truncate max-w-[240px]">{item.urlVideo}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-foreground/40 hover:text-accent transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-foreground/30 text-sm">Nessun video presente</p>}
      </div>

      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <Youtube className="w-3.5 h-3.5 text-accent" />
        I contenuti qui modificati vengono pubblicati nella sezione pubblica Preghiere & Testi.
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina video"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.titolo}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}