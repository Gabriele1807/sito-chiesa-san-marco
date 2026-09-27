"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Loader2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";

interface AuditEntry {
  _id: string;
  at: string;
  adminUsername: string;
  adminNome: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Creazione",
  update: "Modifica",
  delete: "Eliminazione",
  login: "Accesso",
  logout: "Uscita",
  approve: "Approvazione",
  reject: "Rifiuto",
  revoke: "Revoca",
  send: "Invio",
};

const ACTION_STYLES: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-gold/10 text-gold",
  delete: "bg-danger/10 text-danger",
  revoke: "bg-danger/10 text-danger",
  reject: "bg-danger/10 text-danger",
  approve: "bg-success/10 text-success",
  send: "bg-sage/10 text-sage",
};

const ENTITY_LABELS: Record<string, string> = {
  eventi: "Eventi",
  icone: "Icone",
  libreria: "Libreria",
  preghiere: "Preghiere",
  "video-corsi": "Video & corsi",
  orari: "Orari",
  "libreria-privata": "Libreria privata",
  iscrizioni: "Iscrizioni",
  utenti: "Utenti",
  admin: "Account admin",
  "richieste-admin": "Richieste admin",
  "richieste-superadmin": "Richieste superadmin",
  sezioni: "Sezioni",
  accesso: "Accessi",
  avvisi: "Avvisi",
  "richieste-preghiera": "Richieste di preghiera",
  notifiche: "Notifiche push",
};

const PAGE_SIZE = 50;
const emptyFilters = { entity: "", action: "", admin: "", from: "", to: "" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRegistroPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState<{ entities: string[]; admins: string[] }>({
    entities: [],
    admins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }
      const res = await adminFetch(`/api/admin/registro?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(
          res.status === 403
            ? "Solo i superadmin possono consultare il registro."
            : data.error || "Errore"
        );
        setEntries([]);
        return;
      }
      setEntries(data.entries);
      setTotal(data.total);
      setOptions(data.options);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilter(key: keyof typeof emptyFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Object.values(filters).some(Boolean);
  const selectClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Registro attività</h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Chi ha modificato cosa e quando nel pannello admin. Le voci vengono conservate per 12
          mesi.
        </p>
      </div>

      <div className="border-border bg-surface grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-foreground/60 space-y-1 text-xs font-semibold uppercase">
          Area
          <select
            value={filters.entity}
            onChange={(e) => updateFilter("entity", e.target.value)}
            className={selectClass}
          >
            <option value="">Tutte</option>
            {options.entities.map((entity) => (
              <option key={entity} value={entity}>
                {ENTITY_LABELS[entity] ?? entity}
              </option>
            ))}
          </select>
        </label>
        <label className="text-foreground/60 space-y-1 text-xs font-semibold uppercase">
          Azione
          <select
            value={filters.action}
            onChange={(e) => updateFilter("action", e.target.value)}
            className={selectClass}
          >
            <option value="">Tutte</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-foreground/60 space-y-1 text-xs font-semibold uppercase">
          Admin
          <select
            value={filters.admin}
            onChange={(e) => updateFilter("admin", e.target.value)}
            className={selectClass}
          >
            <option value="">Tutti</option>
            {options.admins.map((admin) => (
              <option key={admin} value={admin}>
                @{admin}
              </option>
            ))}
          </select>
        </label>
        <label className="text-foreground/60 space-y-1 text-xs font-semibold uppercase">
          Dal
          <input
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter("from", e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="text-foreground/60 space-y-1 text-xs font-semibold uppercase">
          Al
          <input
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter("to", e.target.value)}
            className={selectClass}
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFilters(emptyFilters);
              setPage(1);
            }}
            className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1.5 justify-self-start text-sm sm:col-span-2 lg:col-span-5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Azzera filtri
          </button>
        )}
      </div>

      {error ? (
        <p className="border-danger/20 bg-danger/10 text-danger rounded-xl border p-4 text-sm">
          {error}
        </p>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="text-foreground/40 h-6 w-6 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="border-border bg-surface text-foreground/60 rounded-xl border py-16 text-center text-sm">
          <History className="text-foreground/30 mx-auto mb-3 h-8 w-8" />
          {hasFilters
            ? "Nessuna attività con questi filtri."
            : "Nessuna attività registrata finora."}
        </div>
      ) : (
        <div className="border-border bg-surface overflow-hidden rounded-xl border">
          <ul className="divide-border divide-y">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <time
                  className="text-foreground/50 shrink-0 text-xs tabular-nums sm:w-36"
                  dateTime={entry.at}
                >
                  {formatDateTime(entry.at)}
                </time>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    ACTION_STYLES[entry.action] ?? "bg-foreground/5 text-foreground/70"
                  }`}
                >
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="text-foreground min-w-0 flex-1 text-sm">
                  <span className="text-foreground/50">
                    {ENTITY_LABELS[entry.entity] ?? entry.entity} ·{" "}
                  </span>
                  {entry.summary}
                </span>
                <span className="text-foreground/60 shrink-0 text-xs" title={entry.adminNome}>
                  @{entry.adminUsername}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!error && total > PAGE_SIZE && (
        <div className="text-foreground/60 flex items-center justify-between text-sm">
          <span>
            {total} attività · pagina {page} di {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-border inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Precedente
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-border inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              Successiva <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
