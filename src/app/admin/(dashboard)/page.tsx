import Link from "next/link";
import { getAdminSession } from "@/lib/auth/session";
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
  Users,
  UsersRound,
  ChevronRight,
  Eye,
  Lock,
} from "lucide-react";
import { getEventi, getOrari } from "@/lib/mongo/content";

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
  const adminUser = await getAdminSession();
  const isSuperAdmin = adminUser?.ruolo === "superadmin";

  const [eventiAll, orari] = await Promise.all([
    getEventi(),
    getOrari(),
  ]);
  const now = new Date();
  const eventiFuturi = eventiAll
    .filter((e) => new Date(e.data) > now)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  // Today's schedule
  const oggi = giorniMap[now.getDay()];
  const orarioOggi = orari.find((o) => o.giorno === oggi);

  const quickActions = [
    { label: "Nuovo Evento", href: "/admin/eventi", icon: CalendarDays },
    { label: "Nuovo Libro / PDF", href: "/admin/libreria", icon: Library },
    { label: "Nuova Preghiera", href: "/admin/preghiere", icon: BookOpen },
    { label: "Nuovo Video / Corso", href: "/admin/video-corsi", icon: Youtube },
  ];

  const managementSections = [
    {
      label: "Gestione Libreria",
      description: "Libri, PDF e contenuti spirituali pubblici.",
      href: "/admin/libreria",
      icon: Library,
    },
    {
      label: "Gestione Icone",
      description: "Schede icone, QR code e contenuti collegati.",
      href: "/admin/icone",
      icon: ImageIcon,
    },
    {
      label: "Gestione Orari",
      description: "Celebrazioni e programmazione liturgica settimanale.",
      href: "/admin/orari",
      icon: Clock,
    },
    {
      label: "Gestione Eventi",
      description: "Eventi, date, capienza e pubblicazione.",
      href: "/admin/eventi",
      icon: CalendarDays,
    },
    {
      label: "Iscrizioni Eventi",
      description: "Partecipanti, export e controllo registrazioni.",
      href: "/admin/iscrizioni",
      icon: Users,
    },
    {
      label: "Gestione Preghiere",
      description: "Testi, PDF e contenuti della sezione preghiere.",
      href: "/admin/preghiere",
      icon: BookOpen,
    },
    {
      label: "Video e Corsi",
      description: "Contenuti video separati dalla sezione preghiere.",
      href: "/admin/video-corsi",
      icon: Youtube,
    },
    {
      label: "Libreria Privata",
      description: "Documenti riservati e materiali ad accesso protetto.",
      href: "/admin/libreria-privata",
      icon: FolderLock,
    },
    {
      label: "Gestione Sezioni",
      description: "Visibilità e permessi delle sezioni del sito.",
      href: "/admin/gestione-sezioni",
      icon: Eye,
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Gestione Utenti",
            description: "Anagrafica utenti, ruoli comunitari e stato account.",
            href: "/admin/utenti",
            icon: UsersRound,
          },
          {
            label: "Gestione Admin",
            description: "Amministratori attivi e ruoli del pannello.",
            href: "/admin/gestione-admin",
            icon: Users,
          },
          {
            label: "Gestione Permessi",
            description: "Permessi avanzati e configurazioni superadmin.",
            href: "/admin/gestione-permessi",
            icon: Lock,
          },
        ]
      : []),
  ];

  const shortcutSections = managementSections.filter((section) =>
    ["/admin/eventi", "/admin/libreria", "/admin/iscrizioni", "/admin/gestione-sezioni"].includes(section.href)
  );

  const cardSections = managementSections.filter(
    (section) => !shortcutSections.some((shortcut) => shortcut.href === section.href)
  );

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
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-200">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Pannello operativo
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ciao, amministratore</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Dai un’occhiata ai contenuti più importanti, ai prossimi eventi e alle azioni che richiedono attenzione oggi.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Oggi</p>
            <p className="mt-1 text-lg font-semibold">{oggi}</p>
            <p className="text-sm text-slate-300">
              {orarioOggi?.celebrazioni[0]?.orario ?? "Nessuna celebrazione programmata"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Azioni rapide</h2>
              <p className="mt-1 text-sm text-slate-500">Apri subito le funzioni più usate.</p>
            </div>
            <Plus className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:border-gold/40 hover:bg-gold/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm text-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sezioni chiave</h2>
              <p className="mt-1 text-sm text-slate-500">Accesso diretto alle aree principali.</p>
            </div>
            <Link href="/admin/gestione-sezioni" className="text-sm font-medium text-gold transition-colors hover:text-gold/80">
              Tutte
            </Link>
          </div>
          <div className="space-y-3">
            {shortcutSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all hover:border-gold/40 hover:bg-gold/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                      <p className="text-xs text-slate-500">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Prossimi eventi</h2>
              <p className="mt-1 text-sm text-slate-500">Elenco breve degli eventi imminenti.</p>
            </div>
            <Link href="/admin/eventi" className="text-sm font-medium text-gold transition-colors hover:text-gold/80">
              Vedi tutto
            </Link>
          </div>
          {eventiFuturi.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nessun evento imminente
            </div>
          ) : (
            <div className="space-y-3">
              {eventiFuturi.slice(0, 3).map((evento) => (
                <Link
                  key={evento.id}
                  href={`/admin/eventi`}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all hover:border-gold/40 hover:bg-gold/5"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50">
                    <span className="text-sm font-semibold text-blue-700 leading-none">
                      {new Date(evento.data).getDate()}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-blue-500">
                      {new Date(evento.data).toLocaleDateString("it-IT", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{evento.titolo}</p>
                    <p className="mt-1 text-xs text-slate-500">{evento.luogo}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Celebrazioni di oggi</h2>
            <span className="text-sm font-medium text-slate-500">{oggi}</span>
          </div>

          {!orarioOggi || orarioOggi.celebrazioni.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
              Nessuna celebrazione oggi
            </div>
          ) : (
            <div className="space-y-3">
              {orarioOggi.celebrazioni.map((cel, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Clock className="h-4 w-4 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{cel.tipo}</p>
                    <p className="text-xs text-slate-500">{cel.orario}</p>
                    {cel.note && <p className="mt-1 text-[11px] italic text-slate-400">{cel.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/admin/orari" className="mt-4 flex items-center gap-1 text-sm font-medium text-gold transition-colors hover:text-gold/80">
            Gestisci orari <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Altre sezioni</h2>
            <p className="mt-1 text-sm text-slate-500">Seleziona l’area di lavoro che ti serve.</p>
          </div>
          <Link href="/admin/gestione-sezioni" className="text-sm font-medium text-gold transition-colors hover:text-gold/80">
            Gestione visibilità
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cardSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-gold/40 hover:bg-gold/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
