import type { ElementType } from "react";
import {
  Home,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  CalendarRange,
  CalendarHeart,
  Youtube,
  Info,
  Phone,
  User,
  Shield,
  Menu,
  PanelLeft,
  ClipboardList,
  Megaphone,
  HandHeart,
} from "lucide-react";

export type SidebarItemType = "primary-nav" | "utility" | "mode-toggle";
export type SidebarLabelNamespace = "nav" | "sidebar" | "auth" | "common";

export type SidebarItem = {
  id: string;
  type: SidebarItemType;
  labelKey: string;
  labelNamespace?: SidebarLabelNamespace;
  subKey?: string;
  icon: ElementType;
  href?: string;
  sectionId?: string; // ID della sezione in section_visibility (per controllo visibilità dinamica)
  activeMatch?: "exact" | "startsWith";
  comingSoon?: boolean;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresGuest?: boolean;
  actionId?: "openLogin" | "openRegister" | "openMobileMenu" | "toggleDock";
};

export type SidebarSection = {
  id: string;
  labelKey: string;
  items: SidebarItem[];
};

export const primarySection: SidebarSection = {
  id: "primary",
  labelKey: "navigazione",
  items: [
    {
      id: "home",
      type: "primary-nav",
      labelKey: "home",
      icon: Home,
      href: "/",
      activeMatch: "exact",
    },
    {
      id: "orari",
      type: "primary-nav",
      labelKey: "orari",
      subKey: "subOrari",
      icon: Clock,
      href: "/#orari",
      sectionId: "orari",
    },
    {
      id: "calendario",
      type: "primary-nav",
      labelKey: "calendario",
      subKey: "subCalendario",
      icon: CalendarRange,
      href: "/calendario",
      sectionId: "calendario",
      // "exact": su /calendario/feste è attiva solo la voce qui sotto.
      activeMatch: "exact",
    },
    {
      id: "calendario-feste",
      type: "primary-nav",
      labelKey: "calendarioFeste",
      subKey: "subCalendarioFeste",
      icon: CalendarHeart,
      href: "/calendario/feste",
      sectionId: "calendario",
    },
    {
      id: "preghiere",
      type: "primary-nav",
      labelKey: "preghiere",
      subKey: "subPreghiere",
      icon: BookOpen,
      href: "/preghiere",
      sectionId: "preghiere",
    },
    {
      id: "video-corsi",
      type: "primary-nav",
      labelKey: "videoCorsi",
      subKey: "subVideoCorsi",
      icon: Youtube,
      href: "/video-corsi",
      sectionId: "video-corsi",
    },
    {
      id: "icone",
      type: "primary-nav",
      labelKey: "icone",
      subKey: "subIcone",
      icon: ImageIcon,
      href: "/icone",
      sectionId: "icone",
    },
    {
      id: "libreria",
      type: "primary-nav",
      labelKey: "libreria",
      subKey: "subLibreria",
      icon: Library,
      href: "/libreria",
      sectionId: "libreria",
    },
    {
      id: "eventi",
      type: "primary-nav",
      labelKey: "eventi",
      subKey: "subEventi",
      icon: CalendarDays,
      href: "/eventi",
      sectionId: "eventi",
    },
  ],
};

export const infoSection: SidebarSection = {
  id: "info",
  labelKey: "informazioni",
  items: [
    {
      id: "avvisi",
      type: "primary-nav",
      labelKey: "avvisi",
      subKey: "subAvvisi",
      icon: Megaphone,
      href: "/avvisi",
    },
    {
      id: "richieste-preghiera",
      type: "primary-nav",
      labelKey: "richiestePreghiera",
      subKey: "subRichiestePreghiera",
      icon: HandHeart,
      href: "/richieste-preghiera",
    },
    {
      id: "chi-siamo",
      type: "primary-nav",
      labelKey: "chiSiamo",
      icon: Info,
      href: "/chi-siamo",
    },
    {
      id: "contatti",
      type: "primary-nav",
      labelKey: "contatti",
      subKey: "subContatti",
      icon: Phone,
      href: "/contatti",
    },
  ],
};

export const utilitySection: SidebarSection = {
  id: "utility",
  labelKey: "utility",
  items: [
    {
      id: "iscrizioni",
      type: "utility",
      labelKey: "iscrizioni",
      labelNamespace: "sidebar",
      subKey: "subIscrizioni",
      icon: ClipboardList,
      href: "/iscrizioni",
      requiresAuth: true,
    },
    {
      id: "profilo",
      type: "utility",
      labelKey: "profilo",
      labelNamespace: "nav",
      subKey: "subProfilo",
      icon: User,
      href: "/profilo",
      requiresAuth: true,
    },
    {
      id: "admin",
      type: "utility",
      labelKey: "pannelloAdmin",
      labelNamespace: "nav",
      subKey: "subPannelloAdmin",
      icon: Shield,
      href: "/admin",
      requiresAdmin: true,
    },
    {
      id: "login",
      type: "utility",
      labelKey: "userMenuLogin",
      labelNamespace: "auth",
      icon: User,
      actionId: "openLogin",
      requiresGuest: true,
    },
    {
      id: "register",
      type: "utility",
      labelKey: "userMenuRegister",
      labelNamespace: "auth",
      icon: User,
      actionId: "openRegister",
      requiresGuest: true,
    },
  ],
};

export const modeToggleItems: SidebarItem[] = [
  {
    id: "dock-compact",
    type: "mode-toggle",
    labelKey: "dockCompatto",
    labelNamespace: "sidebar",
    icon: PanelLeft,
    actionId: "toggleDock",
  },
];

/**
 * Ultima voce del dock su telefono: apre la sidebar con tutte le sezioni.
 * Le altre voci del dock sono scelte in base alla visibilità (dock-items.ts).
 */
export const mobileDockMenuItem: SidebarItem = {
  id: "menu",
  type: "utility",
  labelKey: "menu",
  labelNamespace: "sidebar",
  icon: Menu,
  actionId: "openMobileMenu",
};
