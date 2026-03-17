import React, { createContext, useContext, useState, useEffect } from 'react'
import { initialData } from './mockData'
import { AppState, Role } from './types'

type AppContextType = {
  state: AppState
  dispatch: (updater: (s: AppState) => AppState) => void
  setRole: (role: number) => void
}

const AppContext = createContext<AppContextType | null>(null)
const LOCAL_STORAGE_KEY = 'agro_erp_state_v2'

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...parsed, isOnline: navigator.onLine }
      }
    } catch (e) {
      console.error('Failed to parse local storage state', e)
    }
    return { ...initialData, isOnline: navigator.onLine }
  })

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }))
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const setRole = (role: number) => setState((s) => ({ ...s, userRole: role as Role }))

  return (
    <AppContext.Provider value={{ state, dispatch: setState, setRole }}>
      {children}
    </AppContext.Provider>
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
