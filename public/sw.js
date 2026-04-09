const CACHE_NAME = 'pecuaria-360-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html', '/manifest.json'])
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

const API_CACHE_NAME = 'pecuaria-360-api-v1'

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  const isApi = event.request.url.includes('/api/') || event.request.url.includes('/backend/')

  if (isApi) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response
          const responseToCache = response.clone()
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse
            return new Response(
              JSON.stringify({ code: 503, message: 'Offline content unavailable.' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          })
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {})

      if (cachedResponse) {
        return cachedResponse
      }

      return fetchPromise.catch(() => {
        return new Response('Offline content unavailable.', { status: 503 })
      })
    }),
  )
})
