import Link from "next/link";
import {
  Library,
  Image as ImageIcon,
  BookOpen,
  CalendarDays,
  Clock,
  FolderLock,
  Plus,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  getLibri,
  getIcone,
  getPreghiere,
  getEventi,
  getOrari,
} from "@/lib/supabase/content";
import { getFilePrivati } from "@/lib/data/store";

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
  const [libri, icone, preghiere, eventiAll, orari] = await Promise.all([
    getLibri(),
    getIcone(),
    getPreghiere(),
    getEventi(),
    getOrari(),
  ]);
  const now = new Date();
  const eventiFuturi = eventiAll
    .filter((e) => new Date(e.data) > now)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const filePriv = getFilePrivati();
  
  // Today's schedule
  const oggi = giorniMap[now.getDay()];
  const orarioOggi = orari.find((o) => o.giorno === oggi);

  const stats = [
    { label: "Libri / PDF", value: libri.length, icon: Library, href: "/admin/libreria", bgColor: "bg-amber-100", textColor: "text-amber-600" },
    { label: "Icone", value: icone.length, icon: ImageIcon, href: "/admin/icone", bgColor: "bg-amber-100", textColor: "text-amber-600" },
    { label: "Preghiere", value: preghiere.length, icon: BookOpen, href: "/admin/preghiere", bgColor: "bg-amber-100", textColor: "text-amber-600" },
    { label: "Eventi futuri", value: eventiFuturi.length, icon: CalendarDays, href: "/admin/eventi", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    { label: "File privati", value: filePriv.length, icon: FolderLock, href: "/admin/libreria-privata", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  ];

  const quickActions = [
    { label: "Nuovo Evento", href: "/admin/eventi", icon: CalendarDays, color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { label: "Nuovo Libro / PDF", href: "/admin/libreria", icon: Library, color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" },
    { label: "Nuova Preghiera", href: "/admin/preghiere", icon: BookOpen, color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" },
    { label: "Nuova Icona", href: "/admin/icone", icon: ImageIcon, color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Two-column: Prossimi eventi + Celebrazioni di oggi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prossimi eventi */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Prossimi eventi</h2>
            <Link
              href="/admin/eventi"
              className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
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
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
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
            className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
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
