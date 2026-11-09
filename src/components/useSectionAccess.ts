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
 * Funzione che dà l'accesso del visitatore a una sezione, calcolato nel
 * browser con la stessa logica della sidebar (`/api/public/section-visibility`
 * + ruolo). Restituisce `null` finché non è noto; se il database non risponde
 * entro `SECTION_ACCESS_TIMEOUT_MS` dà "full", come `getSectionAccess` in caso
 * di errore. Una sola richiesta per pagina, anche con più sezioni.
 */
export function useSectionAccessResolver(): (sectionId: string) => RoleAccessType | null {
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

  const ready = expired || (visibilities !== null && !loading);
  const role = viewerRole(type, user, admin);
  return (sectionId) => (ready ? accessForRole(visibilities ?? [], sectionId, role) : null);
}

/** Accesso del visitatore a una sezione (vedi `useSectionAccessResolver`). */
export function useSectionAccess(sectionId: string): RoleAccessType | null {
  return useSectionAccessResolver()(sectionId);
}
