import PocketBase from 'pocketbase'
import { addToOfflineQueue } from '../offline-sync'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL
const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

const originalFetch = window.fetch
window.fetch = async (input, init) => {
  try {
    const response = await originalFetch(input, init)
    return response
  } catch (error) {
    if (
      !navigator.onLine &&
      init &&
      init.method &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase())
    ) {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url.includes('/api/') || url.includes('/backend/')) {
        const headers: Record<string, string> = {}
        if (init.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((val, key) => {
              headers[key] = val
            })
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, val]) => {
              headers[key] = val
            })
          } else {
            Object.assign(headers, init.headers)
          }
        }

        if (pb.authStore.token && !headers['Authorization'] && !headers['authorization']) {
          headers['Authorization'] = pb.authStore.token
        }

        addToOfflineQueue({
          url,
          method: init.method.toUpperCase(),
          headers,
          body: typeof init.body === 'string' ? init.body : null,
        })

        return new Response(JSON.stringify({ id: 'offline-' + Date.now(), offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    throw error
  }
}

export default pb
