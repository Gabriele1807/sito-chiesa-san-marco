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
  Youtube,
  Info,
  Phone,
  User,
  ClipboardList,
  Megaphone,
  HandHeart,
  ShieldCheck,
  FileText,
} from "lucide-react";

// FIX [3] — Changed DASHBOARD to HOME, changed icon from LayoutDashboard to Home, added i18n
const titlesConfig: Record<string, { icon: React.ElementType; key: string }> = {
  "/": { icon: Home, key: "dashboard" },
  "/orari": { icon: Clock, key: "orari" },
  "/preghiere": { icon: BookOpen, key: "preghiere" },
  "/video-corsi": { icon: Youtube, key: "videoCorsi" },
  "/icone": { icon: ImageIcon, key: "icone" },
  "/libreria": { icon: Library, key: "libreria" },
  "/eventi": { icon: CalendarDays, key: "eventi" },
  "/chi-siamo": { icon: Info, key: "chiSiamo" },
  "/contatti": { icon: Phone, key: "contatti" },
  "/profilo": { icon: User, key: "profilo" },
  "/iscrizioni": { icon: ClipboardList, key: "iscrizioni" },
  "/avvisi": { icon: Megaphone, key: "avvisi" },
  "/richieste-preghiera": { icon: HandHeart, key: "richiestePreghiera" },
  "/privacy": { icon: ShieldCheck, key: "privacy" },
  "/termini": { icon: FileText, key: "termini" },
};

interface TopbarTitleProps {
  className?: string;
}

export default function TopbarTitle({ className }: TopbarTitleProps) {
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
    <div className={`flex items-center gap-2 min-w-0 ${className ?? ""}`}>
      <Icon className="w-5 h-5 text-accent shrink-0" />
      {/* Su telefono niente maiuscolo spaziato: in ~120px restava solo "H…". */}
      <span className="min-w-0 truncate text-center font-display text-sm font-semibold text-foreground sm:text-xs sm:uppercase sm:tracking-[0.3em]">
        {t(match.key as Parameters<typeof t>[0])}
      </span>
    </div>
  );
}
