import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (data: any) => Promise<{ error: any }>
  signIn: (loginOrEmail: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  serverError: boolean
  retryConnection: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

let globalInitDone = false

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const retryConnection = () => {
    setLoading(true)
    setServerError(false)
    globalInitDone = false
    setRetryCount((c) => c + 1)
  }

  useEffect(() => {
    let mounted = true

    const validateSession = async () => {
      if (globalInitDone) {
        if (mounted) setLoading(false)
        return
      }
      globalInitDone = true

      if (pb.authStore.isValid && pb.authStore.token) {
        try {
          let isExpired = false
          try {
            const tokenParts = pb.authStore.token.split('.')
            if (tokenParts.length === 3) {
              let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
              while (base64.length % 4) {
                base64 += '='
              }
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join(''),
              )
              const payload = JSON.parse(jsonPayload)
              // Avoid redundant token refreshes and audit spam by using a tight 5-minute buffer
              isExpired = payload.exp * 1000 < Date.now() + 300000
            }
          } catch (e) {
            isExpired = true
          }

          if (isExpired) {
            const authData = await Promise.race([
              pb.collection('users').authRefresh(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000),
              ),
            ])

            if (mounted && authData?.record) {
              pb.authStore.save(pb.authStore.token, authData.record)
              setUser(authData.record)
            }
          } else {
            if (mounted) setUser(pb.authStore.record)
          }
        } catch (err: any) {
          if (
            err.status === 0 ||
            err.message === 'Timeout' ||
            err.message === 'Failed to fetch' ||
            err.name === 'TypeError'
          ) {
            if (mounted) setServerError(true)
          } else {
            pb.authStore.clear()
          }
        }
      } else {
        pb.authStore.clear()
      }
      if (mounted) {
        setLoading(false)
      }
    }

    validateSession()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (mounted) {
        setUser(pb.authStore.isValid ? record : null)
        setIsAuthenticated(pb.authStore.isValid)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [retryCount])

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
      const authData = await pb.collection('users').authWithPassword(loginOrEmail, password)

      if (authData.record) {
        setUser(authData.record)
        setIsAuthenticated(true)
      }

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
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        loading,
        serverError,
        retryConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
