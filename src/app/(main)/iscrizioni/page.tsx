"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthContext";
import { CalendarDays, MapPin, ClipboardList, LogIn } from "lucide-react";
import Link from "next/link";

interface IscrizioneArricchita {
  _id?: string;
  eventoId: string;
  eventoTitolo: string;
  eventoData: string | null;
  eventoLuogo: string | null;
  eventoReferente?: string | null;
  nome: string;
  cognome: string;
  padreNome: string;
  padreCognome: string;
  telefono: string;
  email?: string;
  note?: string;
  createdAt?: string;
}

export default function IscrizioniPage() {
  const t = useTranslations("iscrizioni");
  const tAuth = useTranslations("auth");
  const { type, loading: authLoading } = useAuth();
  const isAuthenticated = type === "user" || type === "admin";

  const [iscrizioni, setIscrizioni] = useState<IscrizioneArricchita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    async function fetchIscrizioni() {
      try {
        const res = await fetch("/api/auth/iscrizioni");
        const data = await res.json();
        if (data.success) {
          setIscrizioni(data.iscrizioni ?? []);
        } else {
          setError(t("erroreCaricamento"));
        }
      } catch {
        setError(t("erroreCaricamento"));
      } finally {
        setLoading(false);
      }
    }

    fetchIscrizioni();
  }, [isAuthenticated, authLoading, t]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatCreatedAt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Stato non loggato
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-fade-in-up">
            {t("titolo")}
          </h1>
          <p className="text-foreground/60 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
            {t("sottotitolo")}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up [animation-delay:200ms]">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <LogIn className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("accessoNecessario")}</h2>
          <p className="text-foreground/60 max-w-sm leading-relaxed mb-6">
            {t("messaggioAccesso")}
          </p>
          <Link
            href="/eventi"
            className="btn-secondary text-sm"
          >
            {tAuth("userMenuLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-fade-in-up">
          {t("titolo")}
        </h1>
        <p className="text-foreground/60 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
          {t("sottotitolo")}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-foreground/50">{t("caricamento")}</p>
          </div>
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center animate-fade-in">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Nessuna iscrizione */}
      {!loading && !error && iscrizioni.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up [animation-delay:200ms]">
          <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="w-9 h-9 text-foreground/30" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t("nessunaIscrizione")}</h2>
          <p className="text-foreground/50 text-sm max-w-sm leading-relaxed mb-6">
            {t("nessunaIscrizioneDesc")}
          </p>
          <Link href="/eventi" className="btn-primary text-sm">
            {t("scopriEventi")}
          </Link>
        </div>
      )}

      {/* Lista iscrizioni */}
      {!loading && !error && iscrizioni.length > 0 && (
        <div className="grid gap-4 animate-fade-in-up [animation-delay:150ms]">
          {iscrizioni.map((isc, index) => (
            <div
              key={isc._id ?? index}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Header card evento */}
              <div className="bg-primary px-5 py-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-base truncate pr-4">
                  {isc.eventoTitolo}
                </h3>
                {isc.createdAt && (
                  <span className="text-white/60 text-xs shrink-0">
                    {t("iscrittoIl")} {formatCreatedAt(isc.createdAt)}
                  </span>
                )}
              </div>

              {/* Dettagli */}
              <div className="px-5 py-4 space-y-3">
                {/* Info evento */}
                <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                  {isc.eventoData && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-accent" />
                      {formatDate(isc.eventoData)}
                    </span>
                  )}
                  {isc.eventoLuogo && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      {isc.eventoLuogo}
                    </span>
                  )}
                </div>

                {/* Dati iscrizione */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                      {t("partecipante")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {isc.nome} {isc.cognome}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                      {t("padre")}
                    </p>
                    <p className="text-sm font-medium text-foreground/70">
                      {isc.padreNome} {isc.padreCognome}
                    </p>
                  </div>
                </div>

                {isc.eventoReferente && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">
                      {t("referenteLabel")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-amber-950">
                      {isc.eventoReferente}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                      {t("referentePagamentoInfo", { referente: isc.eventoReferente })}
                    </p>
                  </div>
                )}

                {/* Telefono ed email se presenti */}
                {(isc.telefono || isc.email) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                    {isc.telefono && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {t("telefono")}
                        </p>
                        <p className="text-sm text-foreground/70">{isc.telefono}</p>
                      </div>
                    )}
                    {isc.email && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {t("email")}
                        </p>
                        <p className="text-sm text-foreground/70 break-all">{isc.email}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Note se presenti */}
                {isc.note && (
                  <div className="bg-surface-alt rounded-lg px-3 py-2">
                    <p className="text-xs text-foreground/60 italic">{isc.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
