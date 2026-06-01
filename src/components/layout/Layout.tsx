import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

interface LayoutProps {
  children: ReactNode
}

/**
 * Main layout wrapper with header, content area, and footer.
 *
 * For admin routes (/admin/*), the Header and Footer are skipped
 * because AdminLayout provides its own dedicated sidebar layout.
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Admin routes have their own layout (AdminLayout + sidebar)
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip to content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
