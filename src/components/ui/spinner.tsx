import { cn } from '@/lib/utils'

interface PageSpinnerProps {
  className?: string
}

/**
 * Full-page centered loading spinner using shadcn styling.
 */
export function PageSpinner({ className }: PageSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
