"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  Info,
  Phone,
  User,
} from "lucide-react";

// FIX [3] — Changed DASHBOARD to HOME, changed icon from LayoutDashboard to Home, added i18n
const titlesConfig: Record<string, { icon: React.ElementType; key: string }> = {
  "/": { icon: Home, key: "dashboard" },
  "/orari": { icon: Clock, key: "orari" },
  "/preghiere": { icon: BookOpen, key: "preghiere" },
  "/icone": { icon: ImageIcon, key: "icone" },
  "/libreria": { icon: Library, key: "libreria" },
  "/eventi": { icon: CalendarDays, key: "eventi" },
  "/chi-siamo": { icon: Info, key: "chiSiamo" },
  "/contatti": { icon: Phone, key: "contatti" },
  "/profilo": { icon: User, key: "profilo" },
};

export default function TopbarTitle() {
  const pathname = usePathname();
  const t = useTranslations("topbar");

  // Match the most specific path first
  const match =
    titlesConfig[pathname] ||
    Object.entries(titlesConfig).find(
      ([key]) => key !== "/" && pathname.startsWith(key)
    )?.[1] ||
    titlesConfig["/"];

  const Icon = match.icon;

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Icon className="w-5 h-5 text-accent" />
      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        {t(match.key as Parameters<typeof t>[0])}
      </span>
    </div>
  );
}
