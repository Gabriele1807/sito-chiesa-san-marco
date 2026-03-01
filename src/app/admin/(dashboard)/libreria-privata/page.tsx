"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface FilePrivato {
  id: string;
  nome: string;
  descrizione: string;
  tipo: string;
  url: string;
  dataCaricamento: string;
}

const tipiFile = ["PDF", "Immagine", "Documento", "Altro"];

export default function AdminLibreriaPrivataPage() {
  const [files, setFiles] = useState<FilePrivato[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", descrizione: "", tipo: "PDF", url: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FilePrivato | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/admin/libreria-privata");
    setFiles(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/libreria-privata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dataCaricamento: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Errore server");
      showToast("File caricato con successo");
      setShowForm(false);
      setForm({ nome: "", descrizione: "", tipo: "PDF", url: "" });
      fetchData();
    } catch {
      showToast("Errore nel caricamento", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/libreria-privata?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore server");
      showToast("File eliminato con successo");
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
          <h1 className="text-2xl font-bold text-gray-900">Libreria Privata</h1>
          <p className="text-sm text-gray-500 mt-1">{files.length} file privati — visibili solo all&apos;admin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white text-sm font-semibold rounded-lg hover:bg-[#C5A028] transition-colors">
          <Plus className="w-4 h-4" /> Carica file
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Nuovo file privato</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nome / Titolo</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Nome del file" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]">
                {tipiFile.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descrizione (opzionale)</label>
            <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={2} placeholder="Breve descrizione" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">URL / Link Google Drive</label>
            <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://drive.google.com/file/d/.../view" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#D4AF37]" />
            <p className="text-xs text-gray-400 mt-1">Incolla il link di condivisione di Google Drive</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#D4AF37] text-white text-sm font-semibold rounded-lg hover:bg-[#C5A028] transition-colors disabled:opacity-50">
              {saving ? "Caricando..." : "Carica"}
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Data caricamento</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{f.nome}</p>
                  {f.descrizione && <p className="text-xs text-gray-500 mt-0.5">{f.descrizione}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{f.tipo}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(f.dataCaricamento).toLocaleDateString("it-IT")}</td>
                <td className="px-4 py-3 text-right">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#D4AF37] transition-colors inline-block"><Download className="w-4 h-4" /></a>
                  <button onClick={() => setDeleteTarget(f)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {files.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nessun file privato caricato</p>}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina file"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.nome}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
