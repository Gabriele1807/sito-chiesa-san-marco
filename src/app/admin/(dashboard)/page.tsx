import Link from "next/link";
import {
  Library,
  Image as ImageIcon,
  BookOpen,
  CalendarDays,
  Clock,
  FolderLock,
} from "lucide-react";
import {
  getLibri,
  getIcone,
  getPreghiere,
  getEventi,
  getFilePrivati,
} from "@/lib/data/store";

export default function AdminDashboardPage() {
  const libri = getLibri();
  const icone = getIcone();
  const preghiere = getPreghiere();
  const eventiAll = getEventi();
  const eventiFuturi = eventiAll.filter((e) => new Date(e.data) > new Date());
  const filePriv = getFilePrivati();

  const stats = [
    { label: "Libri / PDF", value: libri.length, icon: Library, href: "/admin/libreria", color: "bg-blue-500" },
    { label: "Icone", value: icone.length, icon: ImageIcon, href: "/admin/icone", color: "bg-amber-500" },
    { label: "Preghiere", value: preghiere.length, icon: BookOpen, href: "/admin/preghiere", color: "bg-green-500" },
    { label: "Eventi futuri", value: eventiFuturi.length, icon: CalendarDays, href: "/admin/eventi", color: "bg-purple-500" },
    { label: "File privati", value: filePriv.length, icon: FolderLock, href: "/admin/libreria-privata", color: "bg-rose-500" },
  ];

  const quickLinks = [
    { label: "Gestione Libreria", href: "/admin/libreria", icon: Library },
    { label: "Gestione Icone", href: "/admin/icone", icon: ImageIcon },
    { label: "Gestione Orari", href: "/admin/orari", icon: Clock },
    { label: "Gestione Eventi", href: "/admin/eventi", icon: CalendarDays },
    { label: "Gestione Preghiere", href: "/admin/preghiere", icon: BookOpen },
    { label: "Libreria Privata", href: "/admin/libreria-privata", icon: FolderLock },
  ];

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
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Gestione rapida</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-[#D4AF37] hover:shadow-sm transition-all"
              >
                <Icon className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
