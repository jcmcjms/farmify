import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowLeft01Icon, Cancel01Icon, CheckmarkBadge01Icon, DashboardSquare01Icon, Logout01Icon, Menu01Icon, NaturalFoodIcon, Shield01Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: DashboardSquare01Icon, exact: true },
  { href: '/admin/users', label: 'Users', icon: UserMultipleIcon },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield01Icon },
  { href: '/admin/verifications', label: 'Verifications', icon: CheckmarkBadge01Icon },
]

interface AdminSidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

/**
 * Collapsible admin sidebar with navigation links and user info.
 */
export function AdminSidebar({ onCollapse }: AdminSidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    onCollapse?.(collapsed)
  }, [collapsed, onCollapse])
  const [profileOpen, setProfileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          to="/admin"
          className={cn(
            'flex items-center gap-2 font-bold text-primary transition-all',
            collapsed && 'lg:justify-center'
          )}
        >
          <HugeiconsIcon icon={NaturalFoodIcon} className="size-7 shrink-0" />
          <span className={cn('truncate transition-opacity', collapsed && 'lg:hidden')}>
            Farmify
          </span>
        </Link>
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Close button (mobile only) */}
      <button
        onClick={() => setMobileOpen(false)}
        className="absolute right-3 top-3 lg:hidden p-1 text-muted-foreground hover:text-foreground"
        aria-label="Close sidebar"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'lg:justify-center lg:px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <HugeiconsIcon icon={item.icon} className="size-5 shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Profile section */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            title="Logout"
          >
            <HugeiconsIcon icon={Logout01Icon} className="size-5" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 truncate text-left">
                <p className="truncate font-medium text-foreground text-sm">
                  {user?.name || 'Admin'}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {user?.role || 'admin'}
                </p>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} className={cn('size-4 transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="ml-11 space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  User Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-destructive hover:bg-muted transition-colors"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 lg:hidden flex size-9 items-center justify-center rounded-md border border-border bg-white shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open admin menu"
      >
        <HugeiconsIcon icon={Menu01Icon} className="size-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (overlay) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-20 bg-white border-r border-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
