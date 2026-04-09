import PocketBase from 'pocketbase'
import { addToOfflineQueue } from '@/lib/offline-sync'

const originalFetch = window.fetch
window.fetch = async (input, init) => {
  try {
    return await originalFetch(input, init)
  } catch (error) {
    if (!navigator.onLine && init?.method && init.method !== 'GET') {
      let urlStr = ''
      if (typeof input === 'string') urlStr = input
      else if (input instanceof URL) urlStr = input.toString()
      else if (input instanceof Request) urlStr = input.url

      if (urlStr.includes(import.meta.env.VITE_POCKETBASE_URL)) {
        addToOfflineQueue({
          url: urlStr,
          method: init.method,
          headers: (init.headers as Record<string, string>) || {},
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

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
