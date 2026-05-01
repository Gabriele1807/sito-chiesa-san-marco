"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Image as ImageIcon,
  Clock,
  CalendarDays,
  BookOpen,
  FolderLock,
  Users,
} from "lucide-react";

const titleMap: Record<string, { label: string; icon: React.ElementType }> = {
  "/admin": { label: "Dashboard", icon: LayoutDashboard },
  "/admin/libreria": { label: "Gestione Libreria", icon: Library },
  "/admin/icone": { label: "Gestione Icone", icon: ImageIcon },
  "/admin/orari": { label: "Gestione Orari", icon: Clock },
  "/admin/eventi": { label: "Gestione Eventi", icon: CalendarDays },
  "/admin/preghiere": { label: "Gestione Preghiere", icon: BookOpen },
  "/admin/libreria-privata": { label: "Libreria Privata", icon: FolderLock },
  "/admin/gestione-admin": { label: "Gestione Amministratori", icon: Users },
};

export default function AdminTopbarTitle() {
  const pathname = usePathname();
  const entry = titleMap[pathname] ?? { label: "Admin", icon: LayoutDashboard };
  const Icon = entry.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-[#D97706]" />
      <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
        {entry.label}
      </span>
    </div>
  );
}
