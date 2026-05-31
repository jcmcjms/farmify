import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageSpinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'farmer' | 'buyer' | 'admin'
}

/**
 * Route wrapper that requires authentication.
 * Optionally restricts access by role.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <PageSpinner text="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
