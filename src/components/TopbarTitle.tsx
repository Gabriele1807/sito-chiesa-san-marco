"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  Info,
} from "lucide-react";

const titles: Record<string, { icon: React.ElementType; label: string }> = {
  "/": { icon: LayoutDashboard, label: "DASHBOARD" },
  "/orari": { icon: Clock, label: "ORARI" },
  "/preghiere": { icon: BookOpen, label: "PREGHIERE" },
  "/icone": { icon: ImageIcon, label: "ICONE SACRE" },
  "/libreria": { icon: Library, label: "LIBRERIA" },
  "/eventi": { icon: CalendarDays, label: "EVENTI" },
  "/chi-siamo": { icon: Info, label: "CHI SIAMO" },
};

export default function TopbarTitle() {
  const pathname = usePathname();

  // Match the most specific path first
  const match =
    titles[pathname] ||
    Object.entries(titles).find(
      ([key]) => key !== "/" && pathname.startsWith(key)
    )?.[1] ||
    titles["/"];

  const Icon = match.icon;

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Icon className="w-5 h-5 text-accent" />
      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        {match.label}
      </span>
    </div>
  );
}
