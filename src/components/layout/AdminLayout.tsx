import { type ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Admin layout with persistent sidebar and content area.
 * Replaces the global Layout for admin routes.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 lg:pl-64 transition-all duration-300">
        <div className="min-h-screen animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
