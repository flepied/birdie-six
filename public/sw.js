const CACHE_NAME = 'match-play-golf-v1'
const APP_SHELL = ['/birdie-six/', '/birdie-six/index.html', '/birdie-six/manifest.webmanifest', '/birdie-six/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)))
})
