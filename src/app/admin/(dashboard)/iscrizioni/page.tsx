"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Users,
  Search,
  FileSpreadsheet,
  FileText,
  Trash2,
  Pencil,
  ChevronLeft,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  Inbox,
  X,
  Save,
} from "lucide-react";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface EventoRiepilogo {
  id: string;
  titolo: string;
  data: string;
  luogo: string;
  postiDisponibili?: number;
  iscritti: number;
}

interface Iscrizione {
  _id: string;
  eventoId: string;
  nome: string;
  cognome: string;
  padreNome: string;
  padreCognome: string;
  telefono: string;
  email?: string;
  note?: string;
  createdAt?: string;
}

interface DettaglioEvento {
  id: string;
  titolo: string;
  data: string;
  luogo: string;
  postiDisponibili?: number;
}

function normalize(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default function AdminIscrizioniPage() {
  const [eventi, setEventi] = useState<EventoRiepilogo[]>([]);
  const [loadingEventi, setLoadingEventi] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evento, setEvento] = useState<DettaglioEvento | null>(null);
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([]);
  const [postiTotali, setPostiTotali] = useState<number | null>(null);
  const [postiRimasti, setPostiRimasti] = useState<number | null>(null);
  const [loadingDettaglio, setLoadingDettaglio] = useState(false);

  const [search, setSearch] = useState("");
  
  // Stati per Eliminazione
  const [deleteTarget, setDeleteTarget] = useState<Iscrizione | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stati per Modifica
  const [editTarget, setEditTarget] = useState<Iscrizione | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Iscrizione>>({});

  async function fetchEventi() {
    setLoadingEventi(true);
    try {
      const res = await fetch("/api/admin/iscrizioni");
      const data = await res.json();
      if (data.success) setEventi(data.eventi);
    } catch {
      showToast("Errore nel caricamento eventi", "error");
    } finally {
      setLoadingEventi(false);
    }
  }

  async function fetchDettaglio(eventoId: string) {
    setLoadingDettaglio(true);
    try {
      const res = await fetch(`/api/admin/iscrizioni?eventoId=${encodeURIComponent(eventoId)}`);
      const data = await res.json();
      if (data.success) {
        setEvento(data.evento);
        setIscrizioni(data.iscrizioni);
        setPostiTotali(data.postiTotali);
        setPostiRimasti(data.postiRimasti);
      } else {
        showToast(data.error || "Errore nel caricamento", "error");
      }
    } catch {
      showToast("Errore nel caricamento iscrizioni", "error");
    } finally {
      setLoadingDettaglio(false);
    }
  }

  useEffect(() => {
    fetchEventi();
  }, []);

  function openEvento(id: string) {
    setSelectedId(id);
    setSearch("");
    fetchDettaglio(id);
  }

  function backToList() {
    setSelectedId(null);
    setEvento(null);
    setIscrizioni([]);
    fetchEventi();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/iscrizioni?id=${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      showToast("Iscrizione eliminata");
      setDeleteTarget(null);
      if (selectedId) fetchDettaglio(selectedId);
    } catch {
      showToast("Errore nell'eliminazione", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(iscrizione: Iscrizione) {
    setEditTarget(iscrizione);
    setEditForm({ ...iscrizione });
  }

  async function handleUpdate() {
    if (!editTarget || !editTarget._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/iscrizioni?id=${editTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      showToast("Iscrizione aggiornata");
      setEditTarget(null);
      if (selectedId) fetchDettaglio(selectedId);
    } catch {
      showToast("Errore nell'aggiornamento", "error");
    } finally {
      setSaving(false);
    }
  }

  function exportFile(format: "excel" | "pdf") {
    if (!selectedId) return;
    const url = `/api/admin/iscrizioni/export?eventoId=${encodeURIComponent(selectedId)}&format=${format}`;
    window.open(url, "_blank");
  }

  // Raggruppamento per famiglia (stesso nome+cognome del padre)
  const famiglie = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of iscrizioni) {
      const key = `${normalize(i.padreNome)}|${normalize(i.padreCognome)}`;
      if (!map.has(key)) map.set(key, `${i.padreNome} ${i.padreCognome}`.trim());
    }
    return map;
  }, [iscrizioni]);

  function familyKeyOf(i: Iscrizione): string {
    return `${normalize(i.padreNome)}|${normalize(i.padreCognome)}`;
  }

  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of iscrizioni) {
      const k = familyKeyOf(i);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [iscrizioni]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return iscrizioni;
    return iscrizioni.filter((i) => {
      const haystack = normalize(
        `${i.nome} ${i.cognome} ${i.padreNome} ${i.padreCognome} ${i.telefono} ${i.email ?? ""}`
      );
      return haystack.includes(q);
    });
  }, [iscrizioni, search]);

  function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ====================== VISTA LISTA EVENTI ======================
  if (!selectedId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Iscrizioni Eventi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seleziona un evento per vedere la lista delle persone iscritte.
          </p>
        </div>

        {loadingEventi ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : eventi.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <Inbox className="w-8 h-8 mx-auto mb-2" />
            Nessun evento presente
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {eventi.map((ev) => {
              const limitato = typeof ev.postiDisponibili === "number" && ev.postiDisponibili > 0;
              const rimasti = limitato ? Math.max(0, (ev.postiDisponibili as number) - ev.iscritti) : null;
              return (
                <button
                  key={ev.id}
                  onClick={() => openEvento(ev.id)}
                  className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-gold hover:shadow-sm transition-all"
                >
                  <h3 className="font-bold text-gray-900">{ev.titolo}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(ev.data).toLocaleDateString("it-IT")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {ev.luogo}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      {ev.iscritti} iscritti
                    </span>
                    {limitato && (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          rimasti === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                        }`}
                      >
                        {rimasti === 0 ? "Posti esauriti" : `${rimasti} posti rimasti`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ====================== VISTA DETTAGLIO EVENTO ======================
  return (
    <div className="space-y-6">
      <button
        onClick={backToList}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Tutti gli eventi
      </button>

      {loadingDettaglio ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Intestazione evento + statistiche */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{evento?.titolo}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(evento?.data)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {evento?.luogo}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportFile("excel")}
                disabled={iscrizioni.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={() => exportFile("pdf")}
                disabled={iscrizioni.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          {/* Indicatori */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Iscritti</p>
              <p className="text-2xl font-bold text-gray-900">{iscrizioni.length}</p>
            </div>
            {postiTotali !== null && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Posti totali</p>
                  <p className="text-2xl font-bold text-gray-900">{postiTotali}</p>
                </div>
                <div
                  className={`rounded-xl border px-5 py-3 ${
                    postiRimasti === 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  }`}
                >
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Posti rimasti</p>
                  <p
                    className={`text-2xl font-bold ${
                      postiRimasti === 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {postiRimasti}
                  </p>
                </div>
              </>
            )}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Famiglie</p>
              <p className="text-2xl font-bold text-gray-900">{famiglie.size}</p>
            </div>
          </div>

          {/* Ricerca */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, padre, telefono..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          {/* Tabella iscritti */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Partecipante</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Padre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contatti</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Note</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Iscritto il</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, idx) => {
                  const fk = familyKeyOf(i);
                  const isFamily = familyCounts[fk] > 1;
                  return (
                    <tr key={i._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {i.nome} {i.cognome}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>
                            {i.padreNome} {i.padreCognome}
                          </span>
                          {isFamily && (
                            <span
                              title="Stessa famiglia di altre iscrizioni"
                              className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold"
                            >
                              famiglia ×{familyCounts[fk]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {i.telefono}
                          </span>
                          {i.email && (
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {i.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={i.note}>
                        {i.note || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(i.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(i)}
                            className="p-1.5 text-gray-400 hover:text-gold transition-colors"
                            title="Modifica iscrizione"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(i)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Elimina iscrizione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-10 text-gray-400 text-sm">
                {iscrizioni.length === 0 ? "Nessuna iscrizione per questo evento" : "Nessun risultato per la ricerca"}
              </p>
            )}
          </div>
        </>
      )}

      {/* Modal Modifica */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">Modifica Iscrizione</h3>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome</label>
                  <input
                    type="text"
                    value={editForm.nome || ""}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cognome</label>
                  <input
                    type="text"
                    value={editForm.cognome || ""}
                    onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Padre</label>
                  <input
                    type="text"
                    value={editForm.padreNome || ""}
                    onChange={(e) => setEditForm({ ...editForm, padreNome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cognome Padre</label>
                  <input
                    type="text"
                    value={editForm.padreCognome || ""}
                    onChange={(e) => setEditForm({ ...editForm, padreCognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Telefono</label>
                <input
                  type="text"
                  value={editForm.telefono || ""}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note</label>
                <textarea
                  value={editForm.note || ""}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold outline-none resize-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setEditTarget(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Elimina iscrizione"
        message={`Sei sicuro di voler eliminare l'iscrizione di "${deleteTarget?.nome} ${deleteTarget?.cognome}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
