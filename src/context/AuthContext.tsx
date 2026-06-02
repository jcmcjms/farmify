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

/**
 * If the user has the driver flag set in localStorage,
 * override their role from 'buyer' (backend value) to 'driver' (frontend value).
 * The backend doesn't support a 'driver' role, so we track it client-side.
 */
function applyDriverOverride(user: User): User {
  if (localStorage.getItem('farmify_is_driver') === 'true') {
    return { ...user, role: 'driver' }
  }
  return user
}

/**
 * Auth provider — manages user authentication state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  /**
   * On mount, check for existing token and validate it.
   */
  useEffect(() => {
    const token = localStorage.getItem('farmify_token')
    if (!token) {
      setLoading(false)
      return
    }

    // Try to restore user from cache first (with driver override)
    const cached = localStorage.getItem('farmify_user')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        // Invalid cache, ignore
      }
    }

    // Verify token with backend
    authApi
      .getMe()
      .then((res) => {
        if (res.data) {
          const enriched = applyDriverOverride(res.data)
          setUser(enriched)
          localStorage.setItem('farmify_user', JSON.stringify(enriched))
        }
      })
      .catch(() => {
        // Token invalid — clear
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
      const enriched = applyDriverOverride(res.data.user)
      localStorage.setItem('farmify_user', JSON.stringify(enriched))
      setUser(enriched)
    }
  }, [])

  /**
   * Register — stores token and user data.
   */
  const register = useCallback(async (body: RegisterBody) => {
    const res = await authApi.register(body)
    if (res.data) {
      localStorage.setItem('farmify_token', res.data.token)
      const enriched = applyDriverOverride(res.data.user)
      localStorage.setItem('farmify_user', JSON.stringify(enriched))
      setUser(enriched)
    }
  }, [])

  /**
   * Logout — clears all stored data.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('farmify_token')
    localStorage.removeItem('farmify_user')
    localStorage.removeItem('farmify_is_driver')
    setUser(null)
  }, [])

  /**
   * Update profile — updates user data in state and cache.
   */
  const updateProfile = useCallback(async (body: UpdateProfileBody) => {
    const res = await authApi.updateProfile(body)
    if (res.data) {
      setUser(res.data)
      localStorage.setItem('farmify_user', JSON.stringify(res.data))
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
