import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (data: any) => Promise<{ error: any }>
  signIn: (loginOrEmail: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  serverError: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState(false)

  useEffect(() => {
    let mounted = true

    const validateSession = async () => {
      try {
        await pb.send('/api/health', { method: 'GET' })
      } catch (err: any) {
        if (err.status === 0 || err.message === 'Failed to fetch') {
          if (mounted) {
            setServerError(true)
            setLoading(false)
          }
          return
        }
      }

      if (pb.authStore.isValid) {
        try {
          await Promise.race([
            pb.collection('users').authRefresh(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
          ])
        } catch (err: any) {
          if (err.status === 0 || err.message === 'Timeout' || err.message === 'Failed to fetch') {
            if (mounted) setServerError(true)
          } else {
            pb.authStore.clear()
          }
        }
      }
      if (mounted) {
        setLoading(false)
      }
    }

    validateSession()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (mounted) {
        setUser(record)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const signUp = async (data: any) => {
    try {
      await pb.send('/backend/v1/criar_usuario', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (loginOrEmail: string, password: string) => {
    try {
      setServerError(false)
      await pb.collection('users').authWithPassword(loginOrEmail, password)
      return { error: null }
    } catch (error: any) {
      if (error.status === 0 || error.message === 'Failed to fetch') {
        setServerError(true)
      }
      return { error }
    }
  }

  const signOut = async () => {
    if (pb.authStore.isValid) {
      try {
        await pb.send('/backend/v1/audit/logout', { method: 'POST' })
      } catch (e) {
        console.error('Logout audit error', e)
      }
    }
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading, serverError }}>
      {children}
    </AuthContext.Provider>
  )
}
