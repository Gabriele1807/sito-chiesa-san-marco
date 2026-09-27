"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Megaphone, Languages } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

type Livello = "info" | "importante" | "urgente";

interface Avviso {
  id: string;
  titolo: string;
  messaggio: string;
  titoloAr?: string;
  messaggioAr?: string;
  livello: Livello;
  link?: string;
  inizio?: string;
  scadenza?: string;
  pubblicato: boolean;
  createdAt: string;
  pushSentAt?: string;
}

const LIVELLI: { value: Livello; label: string; hint: string }[] = [
  {
    value: "info",
    label: "Informazione",
    hint: "Compare nella bacheca in home e nella pagina Avvisi.",
  },
  {
    value: "importante",
    label: "Importante",
    hint: "Come Informazione, evidenziato in arancione.",
  },
  {
    value: "urgente",
    label: "Urgente",
    hint: "In più, una striscia rossa in cima a tutte le pagine del sito.",
  },
];

const emptyForm = {
  titolo: "",
  messaggio: "",
  titoloAr: "",
  messaggioAr: "",
  livello: "info" as Livello,
  link: "",
  inizio: "",
  scadenza: "",
  pubblicato: true,
};

/** ISO → valore di <input type="datetime-local"> nell'ora locale del browser. */
function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localInputToIso(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusOf(avviso: Avviso, now: number): { label: string; className: string } {
  if (!avviso.pubblicato)
    return { label: "Bozza", className: "bg-foreground/5 text-foreground/60" };
  if (avviso.scadenza && new Date(avviso.scadenza).getTime() <= now) {
    return { label: "Scaduto", className: "bg-foreground/5 text-foreground/50" };
  }
  if (avviso.inizio && new Date(avviso.inizio).getTime() > now) {
    return { label: `Dal ${formatDate(avviso.inizio)}`, className: "bg-sage/10 text-sage" };
  }
  return { label: "Visibile", className: "bg-success/10 text-success" };
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none bg-surface";
const labelClass = "mb-1 block text-xs font-semibold uppercase text-foreground/70";

export default function AdminAvvisiPage() {
  const [avvisi, setAvvisi] = useState<Avviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showArabic, setShowArabic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Avviso | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  async function fetchData() {
    const res = await adminFetch("/api/admin/avvisi");
    if (res.ok) setAvvisi(await res.json());
    setNow(Date.now());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowArabic(false);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(avviso: Avviso) {
    setEditId(avviso.id);
    setForm({
      titolo: avviso.titolo,
      messaggio: avviso.messaggio,
      titoloAr: avviso.titoloAr ?? "",
      messaggioAr: avviso.messaggioAr ?? "",
      livello: avviso.livello,
      link: avviso.link ?? "",
      inizio: isoToLocalInput(avviso.inizio),
      scadenza: isoToLocalInput(avviso.scadenza),
      pubblicato: avviso.pubblicato,
    });
    setShowArabic(Boolean(avviso.titoloAr || avviso.messaggioAr));
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        inizio: localInputToIso(form.inizio),
        scadenza: localInputToIso(form.scadenza),
      };
      const res = await adminFetch("/api/admin/avvisi", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Errore nel salvataggio");
        return;
      }
      showToast(editId ? "Avviso aggiornato" : "Avviso pubblicato");
      setShowForm(false);
      fetchData();
    } catch {
      setFormError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(avviso: Avviso) {
    const res = await adminFetch("/api/admin/avvisi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: avviso.id, pubblicato: !avviso.pubblicato }),
    });
    if (res.ok) {
      showToast(avviso.pubblicato ? "Avviso nascosto" : "Avviso pubblicato");
      fetchData();
    } else {
      showToast("Errore nell'aggiornamento", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/avvisi?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("Avviso eliminato");
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
        <Loader2 className="text-foreground/40 h-6 w-6 animate-spin" />
      </div>
    );
  }

  const livelloHint = LIVELLI.find((l) => l.value === form.livello)?.hint;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Avvisi e notifiche</h1>
          <p className="text-foreground/60 mt-1 text-sm">
            Comunicazioni brevi per la comunità: variazioni di orario, chiusure, appuntamenti.
            Spariscono da sole alla scadenza.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gold hover:bg-gold-light inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuovo avviso
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-border bg-surface space-y-4 rounded-xl border p-6"
        >
          <h3 className="text-foreground text-lg font-bold">
            {editId ? "Modifica avviso" : "Nuovo avviso"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
            <div>
              <label className={labelClass}>Titolo *</label>
              <input
                type="text"
                value={form.titolo}
                onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                required
                maxLength={160}
                placeholder="Liturgia di domenica spostata alle 10:00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Livello</label>
              <select
                value={form.livello}
                onChange={(e) => setForm({ ...form, livello: e.target.value as Livello })}
                className={inputClass}
              >
                {LIVELLI.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {livelloHint && <p className="text-foreground/50 -mt-2 text-xs">{livelloHint}</p>}

          <div>
            <label className={labelClass}>Messaggio *</label>
            <textarea
              value={form.messaggio}
              onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
              required
              maxLength={2000}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowArabic((v) => !v)}
              className="text-gold inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              <Languages className="h-4 w-4" />
              {showArabic ? "Nascondi traduzione araba" : "Aggiungi traduzione araba (opzionale)"}
            </button>
            {showArabic && (
              <div className="mt-3 grid grid-cols-1 gap-4" dir="rtl">
                <input
                  type="text"
                  value={form.titoloAr}
                  onChange={(e) => setForm({ ...form, titoloAr: e.target.value })}
                  maxLength={160}
                  placeholder="العنوان"
                  className={inputClass}
                />
                <textarea
                  value={form.messaggioAr}
                  onChange={(e) => setForm({ ...form, messaggioAr: e.target.value })}
                  maxLength={2000}
                  rows={3}
                  placeholder="الرسالة"
                  className={inputClass}
                />
                <p className="text-foreground/50 text-xs" dir="ltr">
                  Senza traduzione, chi usa il sito in arabo vede il testo italiano.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Link (opzionale)</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="/eventi oppure https://…"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Visibile dal (opzionale)</label>
              <input
                type="datetime-local"
                value={form.inizio}
                onChange={(e) => setForm({ ...form, inizio: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Scade il (opzionale)</label>
              <input
                type="datetime-local"
                value={form.scadenza}
                onChange={(e) => setForm({ ...form, scadenza: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className="text-foreground/80 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pubblicato}
              onChange={(e) => setForm({ ...form, pubblicato: e.target.checked })}
              className="h-4 w-4 accent-[#B45309]"
            />
            Pubblicato (togli la spunta per salvarlo come bozza)
          </label>

          {formError && <p className="text-danger text-sm">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-gold hover:bg-gold-light rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : editId ? "Salva modifiche" : "Pubblica avviso"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border-border text-foreground/80 hover:bg-background rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {avvisi.length === 0 ? (
        <div className="border-border bg-surface text-foreground/60 rounded-xl border py-16 text-center text-sm">
          <Megaphone className="text-foreground/30 mx-auto mb-3 h-8 w-8" />
          Nessun avviso. Creane uno per comunicare variazioni o appuntamenti.
        </div>
      ) : (
        <ul className="space-y-3">
          {avvisi.map((avviso) => {
            const status = statusOf(avviso, now);
            return (
              <li key={avviso.id} className="border-border bg-surface rounded-xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          avviso.livello === "urgente"
                            ? "bg-danger/10 text-danger"
                            : avviso.livello === "importante"
                              ? "bg-gold/10 text-gold"
                              : "bg-foreground/5 text-foreground/60"
                        }`}
                      >
                        {LIVELLI.find((l) => l.value === avviso.livello)?.label}
                      </span>
                      {(avviso.titoloAr || avviso.messaggioAr) && (
                        <span className="bg-foreground/5 text-foreground/60 rounded-full px-2 py-0.5 text-xs">
                          IT + AR
                        </span>
                      )}
                      {avviso.scadenza && (
                        <span className="text-foreground/50 text-xs">
                          scade {formatDate(avviso.scadenza)}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground font-semibold">{avviso.titolo}</p>
                    <p className="text-foreground/70 line-clamp-2 text-sm whitespace-pre-line">
                      {avviso.messaggio}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <button
                      onClick={() => togglePublished(avviso)}
                      className="text-foreground/60 hover:bg-background hover:text-foreground rounded-lg p-2"
                      title={avviso.pubblicato ? "Nascondi (bozza)" : "Pubblica"}
                    >
                      {avviso.pubblicato ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(avviso)}
                      className="text-foreground/60 hover:bg-background hover:text-foreground rounded-lg p-2"
                      title="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(avviso)}
                      className="text-danger/70 hover:bg-danger/10 hover:text-danger rounded-lg p-2"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Eliminare l'avviso?"
        message={deleteTarget ? `"${deleteTarget.titolo}" verrà rimosso dal sito.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
