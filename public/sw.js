// Service worker minimo e estavel.
// Nesta fase ele nao intercepta fetch nem tenta limpar caches ou recarregar clients.
// O objetivo e evitar loops de atualizacao/reload em mobile ate a fase futura de PWA completo.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
