"use client";

/**
 * Wrapper su fetch per le chiamate client-side verso /api/admin/*.
 * Se la sessione è scaduta/assente (401), reindirizza al login invece
 * di lasciare che la pagina mostri tabelle vuote o errori silenziosi.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
  return response;
}
