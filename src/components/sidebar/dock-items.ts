/**
 * Voci del dock in basso su telefono, scelte in base alle sezioni a cui il
 * visitatore può accedere.
 *
 * Le voci vengono dalla navigazione principale (stessi href e sectionId della
 * sidebar), in ordine di priorità: Home, Orari e Calendario prima di tutto,
 * poi le altre sezioni. Si mostrano le prime `DOCK_SLOTS` aperte; l'ultimo
 * posto è sempre "Menu", che apre la sidebar con tutte le voci.
 */

import type { RoleAccessType } from "@/types";
import { infoSection, primarySection, type SidebarItem } from "./nav-config";

export const DOCK_PRIORITY = [
  "home",
  "orari",
  "calendario",
  "preghiere",
  "eventi",
  "video-corsi",
  "icone",
  "libreria",
  "avvisi",
  "contatti",
] as const;

/** Voci di sezione nel dock, oltre a "Menu". */
export const DOCK_SLOTS = 5;

export function dockCandidates(): SidebarItem[] {
  const all = [...primarySection.items, ...infoSection.items];
  return DOCK_PRIORITY.map((id) => all.find((item) => item.id === id)).filter(
    (item): item is SidebarItem => item !== undefined
  );
}

/**
 * Prime `slots` voci aperte. `accessOf` restituisce null finché la
 * visibilità non è nota: in quel caso la voce resta, per non far saltare il
 * dock durante il caricamento. Le sezioni "in arrivo" non entrano nel dock.
 */
export function pickDockItems(
  candidates: readonly SidebarItem[],
  accessOf: (sectionId: string) => RoleAccessType | null,
  slots = DOCK_SLOTS
): SidebarItem[] {
  return candidates
    .filter((item) => {
      if (!item.sectionId) return true;
      const access = accessOf(item.sectionId);
      return access === null || access === "full";
    })
    .slice(0, slots);
}
