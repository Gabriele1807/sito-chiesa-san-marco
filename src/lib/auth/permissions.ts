/**
 * Sistema di permessi basato su ruoli per l'area admin.
 *
 * Ruoli disponibili:
 *   - superadmin: accesso completo + gestione altri admin
 *   - admin: accesso ai contenuti, nessuna gestione admin
 */

export type AdminRuolo = "superadmin" | "admin";

/**
 * Lista completa dei permessi del sistema.
 */
export const PERMISSIONS = {
  // Gestione contenuti
  "libreria.read": "Visualizzare la libreria",
  "libreria.write": "Creare/modificare/eliminare libri",
  "icone.read": "Visualizzare le icone",
  "icone.write": "Creare/modificare/eliminare icone",
  "orari.read": "Visualizzare gli orari",
  "orari.write": "Creare/modificare/eliminare orari",
  "eventi.read": "Visualizzare gli eventi",
  "eventi.write": "Creare/modificare/eliminare eventi",
  "iscrizioni.read": "Visualizzare le iscrizioni agli eventi",
  "iscrizioni.write": "Gestire/eliminare le iscrizioni agli eventi",
  "preghiere.read": "Visualizzare le preghiere",
  "preghiere.write": "Creare/modificare/eliminare preghiere",
  "libreria-privata.read": "Visualizzare la libreria privata",
  "libreria-privata.write": "Caricare/eliminare file privati",

  // Gestione admin (solo superadmin)
  "admin.read": "Visualizzare la lista admin",
  "admin.write": "Creare/modificare/eliminare admin",
  "admin.toggle": "Attivare/disattivare admin",
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Mappa ruolo → permessi concessi.
 */
const ROLE_PERMISSIONS: Record<AdminRuolo, Permission[]> = {
  superadmin: Object.keys(PERMISSIONS) as Permission[], // Tutti i permessi

  admin: [
    "libreria.read",
    "libreria.write",
    "icone.read",
    "icone.write",
    "orari.read",
    "orari.write",
    "eventi.read",
    "eventi.write",
    "iscrizioni.read",
    "iscrizioni.write",
    "preghiere.read",
    "preghiere.write",
    "libreria-privata.read",
    "libreria-privata.write",
  ],
};

/**
 * Verifica se un ruolo ha un determinato permesso.
 */
export function hasPermission(
  ruolo: string,
  permission: Permission
): boolean {
  const perms = ROLE_PERMISSIONS[ruolo as AdminRuolo];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Verifica se un ruolo è superadmin.
 */
export function isSuperAdmin(ruolo: string): boolean {
  return ruolo === "superadmin";
}
