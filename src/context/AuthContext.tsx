import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Session } from '../services/AuthService'
import { useServices } from './ServiceContext'

interface AuthContextValue {
  session: Session | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices()
  const [session, setSession] = useState<Session | null>(() => auth.getSession())

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await auth.login(username, password)
      setSession(result)
    },
    [auth],
  )

  const logout = useCallback(() => {
    auth.logout()
    setSession(null)
  }, [auth])

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
