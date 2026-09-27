/**
 * Svuota le copie offline delle pagine salvate dal service worker
 * (cache "sm-pages-*", vedi public/sw.js). Chiamata al logout: alcune
 * sezioni cambiano contenuto in base al ruolo e non devono restare
 * consultabili offline dopo l'uscita.
 */
export async function clearOfflinePageCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith("sm-pages-")).map((name) => caches.delete(name))
    );
  } catch {
    // cache non accessibile (es. navigazione privata): niente da pulire
  }
}
