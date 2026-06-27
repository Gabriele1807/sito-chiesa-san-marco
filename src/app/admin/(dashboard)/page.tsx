import Link from "next/link";
import { headers } from "next/headers";
import {
  LayoutDashboard,
  Library,
  Image as ImageIcon,
  BookOpen,
  CalendarDays,
  Clock,
  Youtube,
  FolderLock,
  Plus,
  MapPin,
  Users,
  UsersRound,
  ChevronRight,
  Eye,
  Lock,
} from "lucide-react";
import {
  getLibri,
  getIcone,
  getPreghiere,
  getEventi,
  getOrari,
  getFilePrivati,
} from "@/lib/mongo/content";
import { getVideoCorsi } from "@/lib/db";

// Map day index (0=Sun) to Italian day names used in orari
const giorniMap: Record<number, string> = {
  0: "Domenica",
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
};

export default async function AdminDashboardPage() {
  const headerList = await headers();
  const ruolo = headerList.get("x-admin-ruolo") ?? "";
  const isSuperAdmin = ruolo === "superadmin";

  const [libri, icone, preghiere, videoCorsi, eventiAll, orari, filePriv] = await Promise.all([
    getLibri(),
    getIcone(),
    getPreghiere(),
    getVideoCorsi(),
    getEventi(),
    getOrari(),
    getFilePrivati(),
  ]);
  const now = new Date();
  const eventiFuturi = eventiAll
    .filter((e) => new Date(e.data) > now)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  // Today's schedule
  const oggi = giorniMap[now.getDay()];
  const orarioOggi = orari.find((o) => o.giorno === oggi);

  const stats = [
    { label: "Libri / PDF", value: libri.length, icon: Library, href: "/admin/libreria", bgColor: "bg-gold/10", textColor: "text-gold" },
    { label: "Icone", value: icone.length, icon: ImageIcon, href: "/admin/icone", bgColor: "bg-gold/10", textColor: "text-gold" },
    { label: "Preghiere", value: preghiere.length, icon: BookOpen, href: "/admin/preghiere", bgColor: "bg-gold/10", textColor: "text-gold" },
    { label: "Video / Corsi", value: videoCorsi.length, icon: Youtube, href: "/admin/video-corsi", bgColor: "bg-red-100", textColor: "text-red-600" },
    { label: "Eventi futuri", value: eventiFuturi.length, icon: CalendarDays, href: "/admin/eventi", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    { label: "File privati", value: filePriv.length, icon: FolderLock, href: "/admin/libreria-privata", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  ];

  const quickActions = [
    { label: "Nuovo Evento", href: "/admin/eventi", icon: CalendarDays, color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { label: "Nuovo Libro / PDF", href: "/admin/libreria", icon: Library, color: "text-gold bg-gold/5 border-gold/20 hover:bg-gold/10" },
    { label: "Nuova Preghiera", href: "/admin/preghiere", icon: BookOpen, color: "text-gold bg-gold/5 border-gold/20 hover:bg-gold/10" },
    { label: "Nuovo Video / Corso", href: "/admin/video-corsi", icon: Youtube, color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100" },
    { label: "Nuova Icona", href: "/admin/icone", icon: ImageIcon, color: "text-gold bg-gold/5 border-gold/20 hover:bg-gold/10" },
  ];

  const managementSections = [
    {
      label: "Dashboard",
      description: "Panoramica operativa con statistiche, eventi in arrivo e accessi rapidi.",
      href: "/admin",
      icon: LayoutDashboard,
      tone: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
    },
    {
      label: "Gestione Libreria",
      description: "Libri, PDF e contenuti spirituali pubblici.",
      href: "/admin/libreria",
      icon: Library,
      tone: "bg-gold/5 text-gold border-gold/20 hover:bg-gold/10",
    },
    {
      label: "Gestione Icone",
      description: "Schede icone, QR code e contenuti collegati.",
      href: "/admin/icone",
      icon: ImageIcon,
      tone: "bg-gold/5 text-gold border-gold/20 hover:bg-gold/10",
    },
    {
      label: "Gestione Orari",
      description: "Celebrazioni e programmazione liturgica settimanale.",
      href: "/admin/orari",
      icon: Clock,
      tone: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    {
      label: "Gestione Eventi",
      description: "Eventi, date, capienza e pubblicazione.",
      href: "/admin/eventi",
      icon: CalendarDays,
      tone: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    {
      label: "Iscrizioni Eventi",
      description: "Partecipanti, export e controllo registrazioni.",
      href: "/admin/iscrizioni",
      icon: Users,
      tone: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
    },
    {
      label: "Gestione Preghiere",
      description: "Testi, PDF e contenuti della sezione preghiere.",
      href: "/admin/preghiere",
      icon: BookOpen,
      tone: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    },
    {
      label: "Video e Corsi",
      description: "Contenuti video separati dalla sezione preghiere.",
      href: "/admin/video-corsi",
      icon: Youtube,
      tone: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
    {
      label: "Libreria Privata",
      description: "Documenti riservati e materiali ad accesso protetto.",
      href: "/admin/libreria-privata",
      icon: FolderLock,
      tone: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
    {
      label: "Gestione Sezioni",
      description: "Visibilita` e permessi delle sezioni del sito.",
      href: "/admin/gestione-sezioni",
      icon: Eye,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Gestione Utenti",
            description: "Anagrafica utenti, ruoli comunitari e stato account.",
            href: "/admin/utenti",
            icon: UsersRound,
            tone: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
          },
          {
            label: "Gestione Admin",
            description: "Amministratori attivi e ruoli del pannello.",
            href: "/admin/gestione-admin",
            icon: Users,
            tone: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
          },
          {
            label: "Gestione Permessi",
            description: "Permessi avanzati e configurazioni superadmin.",
            href: "/admin/gestione-permessi",
            icon: Lock,
            tone: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
          },
        ]
      : []),
  ];

  // Format event date nicely
  function formatEventDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  function formatEventTime(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Panoramica del sito della Chiesa di San Marco</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${s.textColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sezioni di gestione</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tutte le aree operative disponibili nel pannello admin sono accessibili da qui.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`group rounded-xl border p-5 transition-all hover:shadow-md ${section.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{section.label}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-current transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-column: Prossimi eventi + Celebrazioni di oggi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prossimi eventi */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Prossimi eventi</h2>
            <Link
              href="/admin/eventi"
              className="text-xs font-medium text-gold hover:text-gold-light flex items-center gap-1 transition-colors"
            >
              Vedi tutti <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {eventiFuturi.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nessun evento in programma</p>
          ) : (
            <div className="space-y-3">
              {eventiFuturi.slice(0, 4).map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Date badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-blue-700 leading-none">
                      {new Date(evento.data).getDate()}
                    </span>
                    <span className="text-[10px] text-blue-500 uppercase font-medium">
                      {new Date(evento.data).toLocaleDateString("it-IT", { month: "short" })}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{evento.titolo}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatEventDate(evento.data)} · {formatEventTime(evento.data)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {evento.luogo}
                      </span>
                      {evento.postiDisponibili != null && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {evento.postiDisponibili} posti
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Celebrazioni di oggi */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Oggi</h2>
            <span className="text-xs font-medium text-gray-400">{oggi}</span>
          </div>

          {!orarioOggi || orarioOggi.celebrazioni.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nessuna celebrazione oggi</p>
          ) : (
            <div className="space-y-3">
              {orarioOggi.celebrazioni.map((cel, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{cel.tipo}</p>
                    <p className="text-xs text-gray-500">{cel.orario}</p>
                    {cel.note && (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">{cel.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/admin/orari"
            className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
          >
            Gestisci orari <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Azioni rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-all ${action.color}`}
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-center">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
