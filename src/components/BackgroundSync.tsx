import { useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export function BackgroundSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const syncCheck = async () => {
      try {
        await pb.collection('users').getOne(user.id, { fields: 'id' })
        console.log(`[Sync] Heartbeat check successful at ${new Date().toISOString()}`)
      } catch (error) {
        console.error('[Sync] Heartbeat check failed:', error)
      }
    }

    syncCheck()
    const interval = setInterval(syncCheck, 3600000) // 60 minutes

    return () => clearInterval(interval)
  }, [user])

  return null
}
