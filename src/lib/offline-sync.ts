interface SyncAction {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  timestamp: number
}

export const getOfflineQueue = (): SyncAction[] => {
  try {
    return JSON.parse(localStorage.getItem('offline_sync_queue') || '[]')
  } catch {
    return []
  }
}

export const addToOfflineQueue = (action: Omit<SyncAction, 'id' | 'timestamp'>) => {
  const queue = getOfflineQueue()
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  localStorage.setItem('offline_sync_queue', JSON.stringify(queue))
}

export const clearOfflineQueue = () => {
  localStorage.removeItem('offline_sync_queue')
}

export const processOfflineQueue = async () => {
  if (!navigator.onLine) return
  const queue = getOfflineQueue()
  if (queue.length === 0) return

  console.log(`[Offline Sync] Processing ${queue.length} queued actions...`)
  const remaining: SyncAction[] = []

  for (const action of queue) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      })
      console.log(`[Offline Sync] Successfully synced action ${action.id}`)
    } catch (e) {
      console.error(`[Offline Sync] Failed to sync action ${action.id}`, e)
      remaining.push(action)
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem('offline_sync_queue', JSON.stringify(remaining))
  } else {
    clearOfflineQueue()
  }
}
