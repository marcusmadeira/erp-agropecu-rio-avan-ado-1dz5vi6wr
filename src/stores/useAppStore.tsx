import React, { createContext, useContext, useState } from 'react'
import { initialData } from './mockData'
import { AppState, Role } from './types'

type AppContextType = {
  state: AppState
  dispatch: (updater: (s: AppState) => AppState) => void
  setRole: (role: number) => void
}

const AppContext = createContext<AppContextType | null>(null)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialData)
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
