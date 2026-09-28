/**
 * Test di public/sw.js: il file viene eseguito così com'è in un contesto
 * `vm` con Cache Storage, rete e client finti.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const ORIGIN = "https://sanmarco.test";
const SW_SOURCE = readFileSync(resolve(__dirname, "../../../public/sw.js"), "utf8");

type Handler = (event: FakeEvent) => void;

interface FakeRequest {
  url: string;
  method: string;
  mode: string;
  destination: string;
  headers: Headers;
}

interface FakeEvent {
  request?: FakeRequest;
  data?: unknown;
  notification?: { data?: { url?: string }; close: () => void };
  preloadResponse?: Promise<Response | undefined>;
  respondWith?: (p: Promise<Response>) => void;
  waitUntil: (p: Promise<unknown>) => void;
}

function keyOf(input: string | FakeRequest, ignoreSearch = false): string {
  const url = new URL(typeof input === "string" ? input : input.url, ORIGIN);
  return ignoreSearch ? url.origin + url.pathname : url.href;
}

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: string | FakeRequest, opts: { ignoreSearch?: boolean } = {}) {
    if (opts.ignoreSearch) {
      const wanted = keyOf(input, true);
      for (const [key, value] of this.entries)
        if (keyOf(key, true) === wanted) return value.clone();
      return undefined;
    }
    return this.entries.get(keyOf(input))?.clone();
  }
  async put(input: string | FakeRequest, response: Response) {
    this.entries.set(keyOf(input), response.clone());
  }
  async add(url: string) {
    const response = await sandbox.fetch({
      url: new URL(url, ORIGIN).href,
      method: "GET",
      mode: "cors",
      destination: "",
      headers: new Headers(),
    });
    if (!response.ok) throw new Error("add failed");
    await this.put(url, response);
  }
  async addAll(urls: string[]) {
    for (const url of urls) await this.add(url);
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }
  async delete(input: string | { url: string }) {
    return this.entries.delete(keyOf(typeof input === "string" ? input : input.url));
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(
    input: string | FakeRequest,
    opts: { cacheName?: string; ignoreSearch?: boolean } = {}
  ) {
    const names = opts.cacheName ? [opts.cacheName] : [...this.stores.keys()];
    for (const name of names) {
      const hit = await this.stores.get(name)?.match(input, opts);
      if (hit) return hit;
    }
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sandbox: any;
let handlers: Record<string, Handler[]>;
let network: { online: boolean; hits: string[] };
let shownNotifications: { title: string; options: Record<string, unknown> }[];
let openedWindows: string[];

/** Come una risposta di rete reale dello stesso sito: `type` "basic" (le Response costruite a mano sono "default"). */
function page(body: string) {
  const response = new Response(body, { status: 200, headers: { "content-type": "text/html" } });
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

function loadWorker() {
  handlers = {};
  network = { online: true, hits: [] };
  shownNotifications = [];
  openedWindows = [];
  const caches = new FakeCacheStorage();
  const self = {
    location: { origin: ORIGIN },
    registration: {
      navigationPreload: null,
      showNotification: async (title: string, options: Record<string, unknown>) => {
        shownNotifications.push({ title, options });
      },
      pushManager: { subscribe: vi.fn() },
    },
    clients: {
      claim: async () => undefined,
      matchAll: async () => [],
      openWindow: async (url: string) => {
        openedWindows.push(url);
      },
    },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, handler: Handler) => {
      (handlers[type] ??= []).push(handler);
    },
  };
  sandbox = {
    self,
    caches,
    URL,
    Response,
    Headers,
    Promise,
    setTimeout,
    clearTimeout,
    console,
    fetch: async (request: FakeRequest | string) => {
      const url = typeof request === "string" ? new URL(request, ORIGIN).href : request.url;
      network.hits.push(new URL(url).pathname);
      if (!network.online) throw new TypeError("Failed to fetch");
      if (url.endsWith("/offline.html")) return page("OFFLINE PAGE");
      return page(`NETWORK ${new URL(url).pathname}`);
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox);
  return caches;
}

async function dispatch(type: string, init: Partial<FakeEvent> = {}) {
  const pending: Promise<unknown>[] = [];
  let response: Promise<Response> | undefined;
  const event: FakeEvent = {
    preloadResponse: Promise.resolve(undefined),
    ...init,
    respondWith: (p) => {
      response = p;
    },
    waitUntil: (p) => {
      pending.push(p);
    },
  };
  for (const handler of handlers[type] ?? []) handler(event);
  const result = response ? await response : undefined;
  await Promise.all(pending);
  return result;
}

function request(path: string, init: Partial<FakeRequest> = {}): FakeRequest {
  return {
    url: ORIGIN + path,
    method: "GET",
    mode: "cors",
    destination: "",
    headers: new Headers(),
    ...init,
  };
}

const navigate = (path: string) =>
  dispatch("fetch", { request: request(path, { mode: "navigate", destination: "document" }) });

describe("service worker", () => {
  let caches: FakeCacheStorage;

  beforeEach(async () => {
    caches = loadWorker();
    await dispatch("install");
    await dispatch("activate");
    network.hits = [];
  });

  it("precaches the offline page at install", async () => {
    expect(await caches.match("/offline.html")).toBeDefined();
  });

  it("never intercepts API, admin or non-GET requests", async () => {
    expect(await dispatch("fetch", { request: request("/api/auth/me") })).toBeUndefined();
    expect(await navigate("/admin/eventi")).toBeUndefined();
    expect(
      await dispatch("fetch", { request: request("/avvisi", { method: "POST" }) })
    ).toBeUndefined();
  });

  it("serves public pages from the network and keeps an offline copy", async () => {
    const online = await navigate("/eventi?source=pwa");
    expect(await online!.text()).toBe("NETWORK /eventi");

    network.online = false;
    const offline = await navigate("/eventi");
    expect(await offline!.text()).toBe("NETWORK /eventi");
  });

  it("does not keep personal pages and shows the offline page for them", async () => {
    await navigate("/profilo");
    await navigate("/iscrizioni");
    network.online = false;
    expect(await (await navigate("/profilo"))!.text()).toBe("OFFLINE PAGE");
    expect(await (await navigate("/preghiere"))!.text()).toBe("OFFLINE PAGE");
  });

  it("forgets cached pages when asked at logout", async () => {
    await navigate("/avvisi");
    await dispatch("message", { data: { type: "CLEAR_PAGE_CACHE" } });
    network.online = false;
    expect(await (await navigate("/avvisi"))!.text()).toBe("OFFLINE PAGE");
  });

  it("serves hashed static files from cache after the first download", async () => {
    await dispatch("fetch", {
      request: request("/_next/static/chunks/app.js", { destination: "script" }),
    });
    network.online = false;
    const cached = await dispatch("fetch", {
      request: request("/_next/static/chunks/app.js", { destination: "script" }),
    });
    expect(await cached!.text()).toBe("NETWORK /_next/static/chunks/app.js");
  });

  it("keeps the static cache bounded across deploys", async () => {
    for (let i = 0; i < 260; i++) {
      await dispatch("fetch", {
        request: request(`/_next/static/chunks/c${i}.js`, { destination: "script" }),
      });
    }
    await new Promise((r) => setTimeout(r, 50));
    const staticCache = (await caches.keys()).find((n) => n.startsWith("sm-static-"))!;
    const size = (await (await caches.open(staticCache)).keys()).length;
    expect(size).toBeLessThanOrEqual(250);
    expect(size).toBeGreaterThan(200);
  });

  it("does not cache React Server Component payloads", async () => {
    const headers = new Headers({ RSC: "1" });
    expect(await dispatch("fetch", { request: request("/eventi", { headers }) })).toBeUndefined();
  });

  it("activates the new version only when the page asks", async () => {
    expect(sandbox.self.skipWaiting).not.toHaveBeenCalled();
    await dispatch("message", { data: { type: "SKIP_WAITING" } });
    expect(sandbox.self.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it("removes caches of older versions on activate, leaving unrelated caches alone", async () => {
    await caches.open("sm-pages-v0");
    await caches.open("other-app-cache");
    await dispatch("activate");
    const names = await caches.keys();
    expect(names).not.toContain("sm-pages-v0");
    expect(names).toContain("other-app-cache");
  });

  it("shows push notifications with the announcement text", async () => {
    await dispatch("push", {
      data: {
        json: () => ({
          title: "Avviso",
          body: "Liturgia alle 10",
          url: "/avvisi",
          tag: "avviso-1",
          lang: "it",
        }),
      },
    });
    expect(shownNotifications).toHaveLength(1);
    expect(shownNotifications[0].title).toBe("Avviso");
    expect(shownNotifications[0].options).toMatchObject({
      body: "Liturgia alle 10",
      tag: "avviso-1",
      data: { url: "/avvisi" },
    });
  });

  it("opens only pages of this site when a notification is tapped", async () => {
    const close = vi.fn();
    await dispatch("notificationclick", { notification: { data: { url: "/avvisi" }, close } });
    await dispatch("notificationclick", {
      notification: { data: { url: "https://evil.example/phish" }, close },
    });
    expect(openedWindows).toEqual([`${ORIGIN}/avvisi`, `${ORIGIN}/`]);
    expect(close).toHaveBeenCalledTimes(2);
  });
});
