"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HandHeart,
  Loader2,
  Check,
  Archive,
  RotateCcw,
  Trash2,
  Mail,
  BookOpenCheck,
  Printer,
} from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

type Stato = "nuova" | "letta" | "archiviata";

interface Richiesta {
  id: string;
  tipo: string;
  intenzione: string;
  nome?: string;
  email?: string;
  leggibileInLiturgia: boolean;
  stato: Stato;
  locale: "it" | "ar";
  createdAt: string;
}

const TIPI: Record<string, string> = {
  malati: "Per un malato",
  defunti: "Per un defunto",
  famiglia: "Per la famiglia",
  ringraziamento: "Ringraziamento",
  altro: "Altra intenzione",
};

const TABS: { value: Stato; label: string }[] = [
  { value: "nuova", label: "Da leggere" },
  { value: "letta", label: "Lette" },
  { value: "archiviata", label: "Archiviate" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRichiestePreghieraPage() {
  const [tab, setTab] = useState<Stato>("nuova");
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [counts, setCounts] = useState<Record<Stato, number>>({
    nuova: 0,
    letta: 0,
    archiviata: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Richiesta | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch(`/api/admin/richieste-preghiera?stato=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setRichieste(data.richieste);
      setCounts(data.counts);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStato(richiesta: Richiesta, stato: Stato) {
    const res = await adminFetch("/api/admin/richieste-preghiera", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: richiesta.id, stato }),
    });
    if (res.ok) {
      showToast(
        stato === "archiviata"
          ? "Richiesta archiviata"
          : stato === "letta"
            ? "Segnata come letta"
            : "Richiesta riaperta"
      );
      load();
    } else {
      showToast("Errore nell'aggiornamento", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await adminFetch(
      `/api/admin/richieste-preghiera?id=${encodeURIComponent(deleteTarget.id)}`,
      {
        method: "DELETE",
      }
    );
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      showToast("Richiesta eliminata");
      load();
    } else {
      showToast("Errore nell'eliminazione", "error");
    }
  }

  const liturgiche = richieste.filter((r) => r.leggibileInLiturgia);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Richieste di preghiera</h1>
          <p className="text-foreground/60 mt-1 max-w-2xl text-sm">
            Intenzioni inviate dal sito (pagina &quot;Richieste di preghiera&quot;). Visibili solo
            agli admin. Le richieste archiviate vengono cancellate automaticamente dopo 90 giorni.
          </p>
        </div>
        {tab !== "archiviata" && liturgiche.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="border-border text-foreground/80 hover:bg-background inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm print:hidden"
            title="Stampa l'elenco delle intenzioni da leggere in liturgia"
          >
            <Printer className="h-4 w-4" /> Stampa per la liturgia
          </button>
        )}
      </div>

      <div
        className="border-border bg-surface flex gap-1 rounded-xl border p-1 print:hidden"
        role="tablist"
      >
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === value ? "bg-gold text-white" : "text-foreground/60 hover:bg-background"
            }`}
          >
            {label}
            <span
              className={`ms-1.5 text-xs ${tab === value ? "text-white/80" : "text-foreground/40"}`}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="text-foreground/40 h-6 w-6 animate-spin" />
        </div>
      ) : richieste.length === 0 ? (
        <div className="border-border bg-surface text-foreground/60 rounded-xl border py-16 text-center text-sm">
          <HandHeart className="text-foreground/30 mx-auto mb-3 h-8 w-8" />
          {tab === "nuova" ? "Nessuna nuova richiesta." : "Nessuna richiesta in questo elenco."}
        </div>
      ) : (
        <ul className="space-y-3">
          {richieste.map((r) => (
            <li
              key={r.id}
              className={`bg-surface print:border-foreground/30 rounded-xl border p-4 print:break-inside-avoid ${
                r.stato === "nuova" ? "border-gold/40" : "border-border"
              } ${!r.leggibileInLiturgia ? "print:hidden" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-gold/10 text-gold rounded-full px-2 py-0.5 font-semibold">
                      {TIPI[r.tipo] ?? r.tipo}
                    </span>
                    {r.leggibileInLiturgia && (
                      <span className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold">
                        <BookOpenCheck className="h-3 w-3" /> Leggibile in liturgia
                      </span>
                    )}
                    {r.locale === "ar" && (
                      <span className="bg-foreground/5 text-foreground/60 rounded-full px-2 py-0.5">
                        Arabo
                      </span>
                    )}
                    <span className="text-foreground/45">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-foreground text-sm whitespace-pre-line" dir="auto">
                    {r.intenzione}
                  </p>
                  <p className="text-foreground/55 text-xs">
                    {r.nome ? `Da: ${r.nome}` : "Anonima"}
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="text-gold ms-2 inline-flex items-center gap-1 hover:underline print:hidden"
                      >
                        <Mail className="h-3 w-3" /> {r.email}
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 print:hidden">
                  {r.stato === "nuova" && (
                    <button
                      onClick={() => setStato(r, "letta")}
                      className="text-success hover:bg-success/10 rounded-lg p-2"
                      title="Segna come letta"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {r.stato !== "archiviata" ? (
                    <button
                      onClick={() => setStato(r, "archiviata")}
                      className="text-foreground/60 hover:bg-background hover:text-foreground rounded-lg p-2"
                      title="Archivia (cancellata dopo 90 giorni)"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setStato(r, "letta")}
                      className="text-foreground/60 hover:bg-background hover:text-foreground rounded-lg p-2"
                      title="Riapri"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="text-danger/70 hover:bg-danger/10 hover:text-danger rounded-lg p-2"
                    title="Elimina subito"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Eliminare la richiesta?"
        message="La richiesta verrà cancellata definitivamente."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
