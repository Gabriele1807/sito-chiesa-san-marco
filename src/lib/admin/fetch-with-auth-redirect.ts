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
    // La navigazione è asincrona: senza questo, il codice chiamante
    // continuerebbe subito dopo (es. `setEventi(await res.json())` con
    // il body { error: ... } al posto di un array) e andrebbe in crash
    // prima che il browser finisca di reindirizzare. La pagina sta
    // comunque per essere smontata, quindi una promise che non si
    // risolve mai non ha effetti collaterali visibili.
    return new Promise<Response>(() => {});
  }
  return response;
}
