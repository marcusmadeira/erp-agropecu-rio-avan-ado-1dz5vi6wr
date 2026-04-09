import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
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
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password, name })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
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
      await pb.collection('users').authWithPassword(email, password)
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

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
