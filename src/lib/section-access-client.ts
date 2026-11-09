/**
 * Visibilità delle sezioni calcolata nel browser.
 *
 * Stessa logica di `getSectionAccess` (server) e di `SidebarDock`, ma come
 * funzioni pure: servono alle pagine statiche (la home è ISR e non può
 * leggere i cookie) che devono nascondere un collegamento a una sezione.
 */

import type { RoleAccessType, SectionVisibility, SystemRole } from "@/types";

/** Ruolo del visitatore a partire dallo stato di `useAuth()`. */
export function viewerRole(
  type: "guest" | "user" | "admin",
  user: { role?: SystemRole } | null,
  admin: { ruolo?: string } | null
): SystemRole {
  if (type === "admin") return admin?.ruolo === "superadmin" ? "superadmin" : "admin";
  if (type === "user" && user?.role) return user.role;
  return "guest";
}

/** Accesso del ruolo alla sezione; "full" se la sezione non è configurata. */
export function accessForRole(
  visibilities: readonly SectionVisibility[],
  sectionId: string,
  role: SystemRole
): RoleAccessType {
  const visibility = visibilities.find((v) => v.sectionId === sectionId);
  if (!visibility) return "full";
  if (!visibility.isActive) return "hidden";
  return visibility.roleConfig[role as keyof typeof visibility.roleConfig] || "hidden";
}
