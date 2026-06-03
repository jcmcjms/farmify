import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '@/lib/api'
import type { User, LoginBody, RegisterBody, UpdateProfileBody } from '@/types'

/**
 * Auth context shape.
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (body: LoginBody) => Promise<void>
  register: (body: RegisterBody) => Promise<void>
  logout: () => void
  updateProfile: (body: UpdateProfileBody) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

function setUserData(setUser: (u: User | null) => void, user: User | null): void {
  setUser(user)
  if (user) {
    localStorage.setItem('farmify_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('farmify_user')
  }
}

/**
 * Auth provider — manages user authentication state.
 *
 * The backend now supports 'driver' as a first-class role alongside
 * 'farmer', 'buyer', and 'admin' — no client-side role overrides needed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  /**
   * On mount, restore token and validate with backend.
   */
  useEffect(() => {
    const token = localStorage.getItem('farmify_token')
    if (!token) {
      setLoading(false)
      return
    }

    // Quick-render from cache
    const cached = localStorage.getItem('farmify_user')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        // ignore
      }
    }

    // Verify token with backend
    authApi
      .getMe()
      .then((res) => {
        if (res.data) {
          setUserData(setUser, res.data)
        }
      })
      .catch(() => {
        localStorage.removeItem('farmify_token')
        localStorage.removeItem('farmify_user')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /**
   * Login — stores token and user data.
   */
  const login = useCallback(async (body: LoginBody) => {
    const res = await authApi.login(body)
    if (res.data) {
      localStorage.setItem('farmify_token', res.data.token)
      setUserData(setUser, res.data.user)
    }
  }, [])

  /**
   * Register — stores token and user data.
   */
  const register = useCallback(async (body: RegisterBody) => {
    const res = await authApi.register(body)
    if (res.data) {
      localStorage.setItem('farmify_token', res.data.token)
      setUserData(setUser, res.data.user)
    }
  }, [])

  /**
   * Logout — clears all stored data.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('farmify_token')
    localStorage.removeItem('farmify_user')
    setUser(null)
  }, [])

  /**
   * Update profile — updates user data in state and cache.
   */
  const updateProfile = useCallback(async (body: UpdateProfileBody) => {
    const res = await authApi.updateProfile(body)
    if (res.data) {
      setUserData(setUser, res.data)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
