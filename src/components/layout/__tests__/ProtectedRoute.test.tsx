import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

const mockedUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated and no requiredRole', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', role: 'buyer' },
      loading: false,
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when authenticated with correct role', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, name: 'Farmer User', role: 'farmer' },
      loading: false,
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="farmer">
          <div>Farmer content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Farmer content')).toBeInTheDocument()
  })

  it('redirects to /dashboard when wrong role', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, name: 'Buyer User', role: 'buyer' },
      loading: false,
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute requiredRole="admin">
          <div>Admin content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('allows admin to access any role-restricted route', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, name: 'Admin User', role: 'admin' },
      loading: false,
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="farmer">
          <div>Farmer content (accessible by admin)</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Farmer content (accessible by admin)')).toBeInTheDocument()
  })
})
