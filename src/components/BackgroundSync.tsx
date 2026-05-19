import { useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { processOfflineQueue } from '@/lib/offline-sync'

export function BackgroundSync() {
  const { user } = useAuth()

  useEffect(() => {
    // Ensure the token is fully ready before triggering background calls
    if (!user || !pb.authStore.isValid) return

    const syncCheck = async () => {
      try {
        // Use a common background resource for heartbeat instead of querying a specific user ID
        await pb.collection('configuracoes_sistema').getList(1, 1, { fields: 'id' })
        console.log(`[Sync] Heartbeat check successful at ${new Date().toISOString()}`)
        await processOfflineQueue()
      } catch (error: any) {
        // Defensive programming: Gracefully handle 404 missing resource or network errors
        if (error?.status === 404) {
          console.info('[Sync] Background resource not found (404), but connection is active.')
          try {
            // Connection is alive, proceed with offline queue
            await processOfflineQueue()
          } catch (qError) {
            // Silently handle queue error to keep console clean
          }
        } else if (error?.status === 0 || error?.isAbort) {
          // Network offline or aborted, ignore safely
        } else {
          console.warn('[Sync] Heartbeat check warning:', error?.message || error)
        }
      }
    }

    syncCheck()
    const interval = setInterval(syncCheck, 3600000) // 60 minutes

    const handleOnline = () => {
      console.log('[Sync] Device is online, processing offline queue...')
      processOfflineQueue().catch(() => {})
    }

    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [user])

  return null
}
