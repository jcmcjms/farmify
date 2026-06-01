import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { NaturalFoodIcon } from '@hugeicons/core-free-icons'

/**
 * 404 page displayed for unknown routes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 animate-fade-in">
      <HugeiconsIcon icon={NaturalFoodIcon} className="size-16 text-muted-foreground/20 mb-4" />
      <h1 className="text-7xl font-bold tracking-tight text-muted-foreground/30 font-display">
        404
      </h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
