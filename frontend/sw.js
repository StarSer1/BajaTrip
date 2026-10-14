// Service worker de BajaTrip (Práctica 4). Al compilar, vite.config.js reemplaza los dos
// marcadores de abajo por la huella de la compilación y la lista de archivos generados.
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = `bajatrip-shell-${VERSION}`;
const FONTS = 'bajatrip-fuentes';
const precached = new Set(PRECACHE);

// Instalación: guarda la aplicación completa (HTML, JS, CSS e ilustraciones) antes de usarla.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

// Activación: borra las cachés de compilaciones anteriores y toma el control de las pestañas abiertas.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith('bajatrip-shell-') && key !== SHELL)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else if (url.origin === self.location.origin && precached.has(url.pathname)) event.respondWith(cacheFirst(request));
  else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(staleWhileRevalidate(request));
  // Lo demás (las fotografías de Unsplash) va directo a la red.
});

// Páginas: primero la red para recibir la versión más reciente; sin conexión, el index.html
// guardado. React Router decide después qué vista mostrar (/guias, /catalogo, etc.).
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('/index.html', { cacheName: SHELL, ignoreVary: true })) ?? Response.error();
  }
}

// Archivos de la compilación: su nombre incluye un hash y nunca cambian, así que la caché basta.
// ignoreVary: el servidor responde con «Vary: Origin» y los scripts de módulo se piden con un
// encabezado Origin que la copia guardada en la instalación no tenía; sin esto no coincidirían.
async function cacheFirst(request) {
  return (await caches.match(request, { cacheName: SHELL, ignoreVary: true })) ?? fetch(request);
}

// Fuentes: se responde con la copia guardada y se actualiza en segundo plano.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(request);
  const update = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached ?? Response.error());
  return cached ?? update;
}
