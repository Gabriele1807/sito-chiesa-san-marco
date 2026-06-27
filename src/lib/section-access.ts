/**
 * Utilità server-side per controllare l'accesso alle sezioni
 * Determina il ruolo dell'utente e verifica i permessi di visibilità
 */

import { cookies } from "next/headers";
import type { RoleAccessType, SystemRole } from "@/types";
import { validateSession } from "@/lib/auth/session";
import { getUserFromSessionToken } from "@/lib/mongo/sessions";
import { getSectionVisibility } from "@/lib/mongo/visibility";

/**
 * Determina il ruolo dell'utente dal lato server
 * Legge dalla sessione utente memorizzata nei cookie
 */
export async function getUserRoleServer(): Promise<
  "guest" | "credente" | "madre" | "padre" | "ospite_chiesa" | "admin" | "superadmin"
> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    const adminSessionToken = cookieStore.get("admin_session")?.value;

    if (adminSessionToken) {
      const adminUser = await validateSession(adminSessionToken);
      if (adminUser?.attivo) {
        return adminUser.ruolo;
      }
    }

    if (!sessionToken) {
      return "guest";
    }

    // Legge l'utente dalla sessione
    const user = await getUserFromSessionToken(sessionToken);

    if (!user) {
      return "guest";
    }

    const validRoles: SystemRole[] = ["guest", "credente", "madre", "padre", "ospite_chiesa", "admin", "superadmin"];
    return validRoles.includes(user.role as SystemRole) ? (user.role as SystemRole) : "guest";
  } catch (error) {
    console.error("[getUserRoleServer] Errore:", error);
    return "guest";
  }
}

/**
 * Verifica l'accesso di un utente a una sezione
 * Ritorna il livello di accesso: "full", "coming_soon", o "hidden"
 */
export async function getSectionAccess(sectionId: string): Promise<RoleAccessType> {
  try {
    // Carica la configurazione di visibilità della sezione
    const visibility = await getSectionVisibility(sectionId);

    if (!visibility) {
      // Se non trovata, assume accesso completo (fallback)
      return "full";
    }

    // Se la sezione è globalmente disattivata, nega accesso
    if (!visibility.isActive) {
      return "hidden";
    }

    // Determina il ruolo dell'utente
    const userRole = await getUserRoleServer();

    // Legge l'accesso per il ruolo
    const roleAccess = visibility.roleConfig[userRole as keyof typeof visibility.roleConfig];

    // Se il ruolo non ha una configurazione esplicita, nega accesso
    return roleAccess || "hidden";
  } catch (error) {
    console.error("[getSectionAccess] Errore:", error);
    // In caso di errore, consenti l'accesso completo (fallback safe)
    return "full";
  }
}
