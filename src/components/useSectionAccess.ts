"use client";

import { useEffect, useState } from "react";
import type { RoleAccessType, SectionVisibility } from "@/types";
import { useAuth } from "@/components/auth/AuthContext";
import { accessForRole, viewerRole } from "@/lib/section-access-client";

/** Oltre questo tempo (database lento o giù) la sezione si considera visibile. */
export const SECTION_ACCESS_TIMEOUT_MS = 1500;

let request: Promise<SectionVisibility[]> | null = null;

/** Una sola richiesta per pagina, condivisa fra i componenti che la usano. */
function loadVisibilities(): Promise<SectionVisibility[]> {
  request ??= fetch("/api/public/section-visibility", {
    signal:
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(SECTION_ACCESS_TIMEOUT_MS)
        : undefined,
  })
    .then((res) => res.json())
    .then((data) => (data?.success && Array.isArray(data.data) ? data.data : []))
    .catch(() => {
      request = null; // riprova alla prossima visita della pagina
      return [];
    });
  return request;
}

/**
 * Accesso del visitatore a una sezione, calcolato nel browser con la
 * stessa logica della sidebar (`/api/public/section-visibility` + ruolo).
 * `null` finché non è noto; se il database non risponde entro
 * `SECTION_ACCESS_TIMEOUT_MS` restituisce "full", come `getSectionAccess`
 * in caso di errore.
 */
export function useSectionAccess(sectionId: string): RoleAccessType | null {
  const { type, user, admin, loading } = useAuth();
  const [visibilities, setVisibilities] = useState<SectionVisibility[] | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let alive = true;
    loadVisibilities().then((list) => {
      if (alive) setVisibilities(list);
    });
    const timer = setTimeout(() => {
      if (alive) setExpired(true);
    }, SECTION_ACCESS_TIMEOUT_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  if (!expired && (visibilities === null || loading)) return null;
  return accessForRole(visibilities ?? [], sectionId, viewerRole(type, user, admin));
}
