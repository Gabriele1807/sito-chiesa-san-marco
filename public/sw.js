/**
 * Service worker della PWA — Chiesa Copta Ortodossa di San Marco.
 *
 * Strategie di cache (solo richieste GET dello stesso sito):
 *  - /_next/static/*  (file con hash, immutabili)      → cache-first
 *  - immagini e font                                   → stale-while-revalidate, max 80 voci
 *  - pagine pubbliche (elenco PUBLIC_PAGE)             → network-first; copia in cache per l'offline
 *  - tutto il resto (API, admin, profilo, reset…)      → solo rete, mai in cache
 * Senza rete: la copia salvata della pagina, altrimenti /offline.html.
 *
 * Le pagine personali e le API non vengono mai salvate. La cache delle
 * pagine viene svuotata al logout (messaggio CLEAR_PAGE_CACHE), perché
 * alcune sezioni mostrano contenuti diversi in base al ruolo.
 *
 * `ignoreVary`: Next.js risponde con `Vary: RSC, Accept-Encoding…`; le copie
 * sono salvate con una chiave URL senza intestazioni, quindi il confronto
 * delle intestazioni farebbe fallire ogni ricerca.
 *
 * Aggiornamenti: la nuova versione resta "in attesa" finché la pagina non
 * manda SKIP_WAITING (pulsante "Aggiorna" mostrato da PwaManager).
 * Cambiando la logica di questo file aumentare CACHE_VERSION.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `sm-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `sm-images-${CACHE_VERSION}`;
const PAGE_CACHE = `sm-pages-${CACHE_VERSION}`;
const PRECACHE = `sm-precache-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE, PRECACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/logo-san-marco.png",
  "/manifest.webmanifest",
];

const MAX_PAGES = 40;
const MAX_IMAGES = 80;
const NAVIGATION_TIMEOUT_MS = 5000;

// Pagine con contenuto pubblico, uguale per tutti: le uniche salvate per l'offline.
const PUBLIC_PAGE =
  /^\/(?:$|avvisi\/?$|eventi\/?$|orari\/?$|preghiere\/?$|video-corsi\/?$|chi-siamo\/?$|contatti\/?$|privacy\/?$|termini\/?$|icone(?:\/[^/]+)?\/?$|libreria(?:\/[^/]+)?\/?$)/;

// Mai intercettate: sessioni, dati personali, pannello admin, sviluppo.
const BYPASS = /^\/(?:api\/|admin(?:\/|$)|_next\/webpack-hmr|__nextjs)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      // La home è utile offline ma non deve bloccare l'installazione se la rete è lenta.
      await cache.add("/").catch(() => undefined);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("sm-") && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => undefined);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (type === "CLEAR_PAGE_CACHE") {
    event.waitUntil(caches.delete(PAGE_CACHE));
  }
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // cache.keys() restituisce le voci in ordine di inserimento: si eliminano le più vecchie.
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

function isCacheableResponse(response) {
  return response && response.ok && response.type === "basic" && !response.redirected;
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(request, response.clone());
        await trimCache(IMAGE_CACHE, MAX_IMAGES);
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function offlineFallback(request) {
  const url = new URL(request.url);
  const cachedPage =
    (await caches.match(request, {
      ignoreSearch: true,
      ignoreVary: true,
      cacheName: PAGE_CACHE,
    })) ||
    (url.pathname === "/"
      ? await caches.match("/", { ignoreVary: true, cacheName: PRECACHE })
      : undefined);
  return cachedPage || (await caches.match(OFFLINE_URL, { ignoreVary: true })) || Response.error();
}

async function handleNavigation(event) {
  const request = event.request;
  const url = new URL(request.url);
  const cacheable = PUBLIC_PAGE.test(url.pathname);

  const network = (async () => {
    const preloaded = await event.preloadResponse;
    return preloaded || fetch(request);
  })();

  try {
    // Con una copia salvata non si aspetta una rete lentissima all'infinito;
    // senza copia si aspetta comunque la rete.
    const hasCopy =
      cacheable &&
      (await caches.match(request, {
        ignoreSearch: true,
        ignoreVary: true,
        cacheName: PAGE_CACHE,
      }));
    const response = hasCopy ? await withTimeout(network, NAVIGATION_TIMEOUT_MS) : await network;
    if (cacheable && isCacheableResponse(response)) {
      const copy = response.clone();
      event.waitUntil(
        caches.open(PAGE_CACHE).then(async (cache) => {
          // Chiave senza query string (?source=pwa ecc.): una copia per pagina.
          await cache.put(url.origin + url.pathname, copy);
          await trimCache(PAGE_CACHE, MAX_PAGES);
        })
      );
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || BYPASS.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  // Payload RSC delle navigazioni client-side di Next.js: variano per
  // sessione e intestazioni, non si mettono in cache (offline Next.js
  // ripiega su una navigazione completa, gestita sopra).
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

// ---------------- Notifiche push ----------------

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Chiesa di San Marco";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: payload.tag || "san-marco",
    renotify: Boolean(payload.tag),
    lang: payload.lang || "it",
    dir: payload.lang === "ar" ? "rtl" : "auto",
    data: { url: payload.url || "/avvisi" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    self.location.origin
  );
  // Solo pagine di questo sito: il payload viene dal server, ma un URL
  // esterno in una notifica sarebbe comunque fuori luogo.
  const url = target.origin === self.location.origin ? target.href : self.location.origin + "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url).catch(() => undefined);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

// Il browser può rinnovare l'iscrizione push (chiavi scadute o ruotate):
// la nuova va registrata sul server, altrimenti le notifiche smettono di arrivare.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription && event.oldSubscription.options;
      const subscription =
        event.newSubscription ||
        (options ? await self.registration.pushManager.subscribe(options).catch(() => null) : null);
      if (!subscription) return;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          previousEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : undefined,
        }),
      }).catch(() => undefined);
    })()
  );
});
