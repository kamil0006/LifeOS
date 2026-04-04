import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { queryClient } from '../lib/queryClient'

interface User {
  id: string
  email: string
}

const DEMO_SESSION_KEY = 'lifeos_demo_session'

const TOKEN_KEY = 'lifeos_token'
const USER_KEY = 'lifeos_user'

function getStorage(rememberMe: boolean) {
  return rememberMe ? localStorage : sessionStorage
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  enterDemoMode: () => void
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const ENV_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (localStorage.getItem(DEMO_SESSION_KEY) === 'true') {
      return { id: 'demo', email: 'demo@lifeos.app' }
    }
    const fromLocal = localStorage.getItem(USER_KEY)
    if (fromLocal) return JSON.parse(fromLocal)
    const fromSession = sessionStorage.getItem(USER_KEY)
    return fromSession ? JSON.parse(fromSession) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  })
  const [demoSession, setDemoSession] = useState(() => localStorage.getItem(DEMO_SESSION_KEY) === 'true')

  const isDemoMode = ENV_DEMO_MODE || demoSession

  const [storageMode, setStorageMode] = useState<'local' | 'session'>(
    () => (localStorage.getItem(TOKEN_KEY) ? 'local' : sessionStorage.getItem(TOKEN_KEY) ? 'session' : 'local')
  )

  useEffect(() => {
    if (token && user) {
      const store = storageMode === 'local' ? localStorage : sessionStorage
      store.setItem(TOKEN_KEY, token)
      store.setItem(USER_KEY, JSON.stringify(user))
      if (storageMode === 'local') {
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
      localStorage.removeItem(DEMO_SESSION_KEY)
    } else if (demoSession) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.setItem(DEMO_SESSION_KEY, 'true')
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.removeItem(DEMO_SESSION_KEY)
    }
  }, [token, user, demoSession, storageMode])

  const login = async (email: string, password: string, rememberMe = true) => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    const { authApi } = await import('../lib/api')
    const { token: t, user: u } = await authApi.login(email, password)
    queryClient.clear()
    setStorageMode(rememberMe ? 'local' : 'session')
    const store = getStorage(rememberMe)
    store.setItem(TOKEN_KEY, t)
    store.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const register = async (email: string, password: string, rememberMe = true) => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    const { authApi } = await import('../lib/api')
    const { token: t, user: u } = await authApi.register(email, password)
    queryClient.clear()
    setStorageMode(rememberMe ? 'local' : 'session')
    const store = getStorage(rememberMe)
    store.setItem(TOKEN_KEY, t)
    store.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const enterDemoMode = () => {
    queryClient.clear()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser({ id: 'demo', email: 'demo@lifeos.app' })
    setDemoSession(true)
  }

  const logout = () => {
    queryClient.clear()
    setToken(null)
    setUser(null)
    setDemoSession(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        enterDemoMode,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
