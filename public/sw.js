const CACHE_NAME = 'match-play-golf-v2'
const APP_SHELL = ['/birdie-six/', '/birdie-six/index.html', '/birdie-six/manifest.webmanifest', '/birdie-six/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put('/birdie-six/index.html', copy))
      return response
    }).catch(() => caches.match('/birdie-six/index.html')))
    return
  }

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)))
})
