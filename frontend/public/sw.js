const CACHE_NAME = "elevoni-app-shell-v5";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
  "/icons/elevoni-192.png",
  "/icons/elevoni-512.png",
  "/icons/elevoni-512-maskable.png",
];

function isCacheable(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname === "/sw.js") return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return false;
  if (url.pathname.toLowerCase().includes("paystack")) return false;
  return true;
}

async function cacheUrl(cache, url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) await cache.put(url, response.clone());
  } catch {
    // A missing optional asset must not fail the whole install.
  }
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(APP_SHELL.map((url) => cacheUrl(cache, url)));

  try {
    const response = await fetch("/index.html", { cache: "no-store" });
    if (!response.ok) return;

    const html = await response.clone().text();
    await cache.put("/index.html", response.clone());

    const matches = html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g);
    const assetUrls = [...new Set([...matches].map((match) => match[1]))];
    await Promise.all(assetUrls.map((url) => cacheUrl(cache, url)));
  } catch {
    // The online navigation handler will populate the shell on the next visit.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("elevoni-app-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (!isCacheable(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/index.html", response.clone());
        }
        return response;
      } catch {
        const cached = (await caches.match("/index.html")) || (await caches.match("/"));
        return cached || new Response("Elevoni is unavailable offline. Reconnect and try again.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/apple-splash-") ||
    ["style", "script", "image", "font", "manifest"].includes(request.destination);

  if (isStaticAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      return cached || new Response("", { status: 504, statusText: "Offline" });
    }
  })());
});
