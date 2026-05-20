const APP_SHELL_CACHE = "sitio-ramos-app-shell-v4";
const RUNTIME_CACHE = "sitio-ramos-runtime-v4";
const APP_SHELL_ROUTES = ["/", "/diario", "/mapa", "/propriedade", "/ciclos", "/operacao", "/financeiro"];
const CORE_ASSETS = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

let shellAssetUrlsPromise = null;

async function buildShellAssetUrls() {
  if (!shellAssetUrlsPromise) {
    shellAssetUrlsPromise = (async () => {
      const response = await fetch("/", { cache: "no-store" });
      const html = await response.text();
      const matches = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
        .map((match) => match[1])
        .filter((value) => value.startsWith("/"));
      return Array.from(new Set(["/", ...CORE_ASSETS, ...matches]));
    })().catch(() => ["/", ...CORE_ASSETS]);
  }
  return shellAssetUrlsPromise;
}

async function cacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const shellAssetUrls = await buildShellAssetUrls();
  const uniqueUrls = Array.from(new Set([...APP_SHELL_ROUTES, ...shellAssetUrls]));
  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // Mantem o shell anterior se a rede falhar.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "WARM_APP_SHELL") {
    event.waitUntil?.(cacheAppShell());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put("/", networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return (
            (await cache.match(url.pathname)) ||
            (await cache.match("/")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || CORE_ASSETS.includes(url.pathname) || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const networkResponse = await fetch(request);
        if (networkResponse.ok) await cache.put(request, networkResponse.clone());
        return networkResponse;
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});
