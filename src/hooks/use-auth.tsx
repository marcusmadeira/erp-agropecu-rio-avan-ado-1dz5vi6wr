import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (data: any) => Promise<{ error: any }>
  signIn: (loginOrEmail: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
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

  useEffect(() => {
    let mounted = true

    const validateSession = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch (err: any) {
          if (err.status !== 0) {
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
    const attemptsStr = localStorage.getItem('login_attempts')
    const attempts = attemptsStr ? JSON.parse(attemptsStr) : { count: 0, lockUntil: null }

    if (attempts.lockUntil && new Date().getTime() < attempts.lockUntil) {
      const remainingMinutes = Math.ceil((attempts.lockUntil - new Date().getTime()) / 60000)
      return {
        error: new Error(
          `Muitas tentativas falhas. Acesso bloqueado por segurança. Tente novamente em ${remainingMinutes} minutos.`,
        ),
      }
    }

    try {
      const res = await pb.send('/backend/v1/autenticar_usuario', {
        method: 'POST',
        body: JSON.stringify({ login: loginOrEmail, password }),
        headers: { 'Content-Type': 'application/json' },
      })
      pb.authStore.save(res.token, res.record)
      localStorage.removeItem('login_attempts')
      return { error: null }
    } catch (error) {
      attempts.count += 1
      if (attempts.count >= 5) {
        attempts.lockUntil = new Date().getTime() + 15 * 60 * 1000 // 15 minutes block
      }
      localStorage.setItem('login_attempts', JSON.stringify(attempts))
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
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
