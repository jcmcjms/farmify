import { useState, type ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Admin layout with persistent sidebar and content area.
 * Replaces the global Layout for admin routes.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar onCollapse={setSidebarCollapsed} />
      {/* Main content — offset by sidebar width on desktop */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="min-h-screen animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
