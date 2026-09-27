"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarDays,
  HandHeart,
  BellRing,
  Loader2,
  MailCheck,
  RefreshCw,
} from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import StatTile from "@/components/admin/charts/StatTile";
import ColumnChart from "@/components/admin/charts/ColumnChart";
import BarList from "@/components/admin/charts/BarList";
import EventRegistrations, { type EventRow } from "@/components/admin/charts/EventRegistrations";

interface Statistics {
  generatedAt: string;
  utenti: {
    totale: number;
    ultimi30Giorni: number;
    emailVerificate: number;
    perMese: { mese: string; nuovi: number }[];
    perFasciaEta: { fascia: string; utenti: number }[];
    perRuolo: { ruolo: string; utenti: number }[];
  };
  eventi: { inProgramma: number; personeIscritteInProgramma: number; dettaglio: EventRow[] };
  richiestePreghiera: { nuova: number; letta: number; archiviata: number };
  notifiche: { dispositivi: number };
  avvisiAttivi: number;
}

const ROLE_LABELS: Record<string, string> = {
  credente: "Credenti",
  madre: "Madri",
  padre: "Padri",
  ospite_chiesa: "Ospiti da altra chiesa",
  prete: "Preti",
};

function monthLabels(mese: string) {
  const [year, month] = mese.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return {
    label: date.toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" }).replace(".", ""),
    fullLabel: date.toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

function Card({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  table?: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <h2 className="text-foreground font-bold">{title}</h2>
      {subtitle && <div className="text-foreground/55 mt-0.5 text-xs">{subtitle}</div>}
      <div className="mt-4">{children}</div>
      {table && (
        <details className="mt-4 text-sm">
          <summary className="text-gold cursor-pointer text-xs font-semibold">
            Mostra come tabella
          </summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      )}
    </section>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-border text-foreground/60 border-b">
          {head.map((h) => (
            <th key={h} className="py-1.5 pe-3 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-border/60 border-b">
            {row.map((cell, j) => (
              <td
                key={j}
                className={`py-1.5 pe-3 ${typeof cell === "number" ? "tabular-nums" : ""}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminStatistichePage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await adminFetch("/api/admin/statistiche");
      if (!res.ok) throw new Error();
      setStats(await res.json());
      setError("");
    } catch {
      setError("Impossibile caricare le statistiche.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && !stats) {
    return (
      <p className="border-danger/20 bg-danger/10 text-danger rounded-xl border p-4 text-sm">
        {error}
      </p>
    );
  }
  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="text-foreground/40 h-6 w-6 animate-spin" />
      </div>
    );
  }

  const { utenti, eventi } = stats;
  const verifiedShare = utenti.totale
    ? Math.round((utenti.emailVerificate / utenti.totale) * 100)
    : 0;
  const monthly = utenti.perMese.map((m) => ({ ...monthLabels(m.mese), value: m.nuovi }));

  return (
    <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Statistiche</h1>
          <p className="text-foreground/60 mt-1 text-sm">
            Solo numeri aggregati, nessun dato personale. Aggiornate al{" "}
            {new Date(stats.generatedAt).toLocaleString("it-IT", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            load();
          }}
          className="border-border text-foreground/80 hover:bg-background inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Aggiorna
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Users}
          label="Utenti registrati"
          value={utenti.totale}
          detail={`${utenti.ultimi30Giorni} negli ultimi 30 giorni`}
        />
        <StatTile
          icon={CalendarDays}
          label="Persone iscritte agli eventi in programma"
          value={eventi.personeIscritteInProgramma}
          detail={`${eventi.inProgramma} ${eventi.inProgramma === 1 ? "evento" : "eventi"} in programma`}
        />
        <StatTile
          icon={HandHeart}
          label="Richieste di preghiera da leggere"
          value={stats.richiestePreghiera.nuova}
          detail={`${stats.richiestePreghiera.letta} lette · ${stats.richiestePreghiera.archiviata} archiviate`}
        />
        <StatTile
          icon={BellRing}
          label="Dispositivi con notifiche"
          value={stats.notifiche.dispositivi}
          detail={`${stats.avvisiAttivi} ${stats.avvisiAttivi === 1 ? "avviso visibile" : "avvisi visibili"} sul sito`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card
          title="Nuovi utenti per mese"
          subtitle="Registrazioni degli ultimi 12 mesi"
          table={
            <SimpleTable
              head={["Mese", "Nuovi utenti"]}
              rows={monthly.map((m) => [m.fullLabel, m.value])}
            />
          }
        >
          <ColumnChart
            data={monthly}
            unit="nuovi utenti"
            title="Nuovi utenti per mese, ultimi 12 mesi"
          />
        </Card>

        <Card
          title="Iscrizioni agli eventi"
          subtitle="Prossimi eventi e quelli degli ultimi 90 giorni"
          table={
            <SimpleTable
              head={["Evento", "Data", "Persone", "Iscrizioni", "Pagate", "Posti"]}
              rows={eventi.dettaglio.map((e) => [
                e.titolo,
                e.data.slice(0, 10),
                e.persone,
                e.iscrizioni,
                e.pagate,
                e.postiDisponibili ?? "—",
              ])}
            />
          }
        >
          {eventi.dettaglio.length ? (
            <EventRegistrations events={eventi.dettaglio} />
          ) : (
            <p className="text-foreground/55 text-sm">Nessun evento recente o in programma.</p>
          )}
        </Card>

        <Card title="Utenti per fascia d'età">
          <BarList
            data={utenti.perFasciaEta.map((f) => ({ label: f.fascia, value: f.utenti }))}
            unit="utenti"
          />
        </Card>

        <Card
          title="Utenti per ruolo"
          subtitle={
            <span className="inline-flex items-center gap-1">
              <MailCheck className="h-3.5 w-3.5" /> Email confermata: {utenti.emailVerificate} su{" "}
              {utenti.totale} ({verifiedShare}%)
            </span>
          }
        >
          <BarList
            data={utenti.perRuolo.map((r) => ({
              label: ROLE_LABELS[r.ruolo] ?? r.ruolo,
              value: r.utenti,
            }))}
            unit="utenti"
          />
        </Card>
      </div>
    </div>
  );
}
