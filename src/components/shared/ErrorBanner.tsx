import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  if (onRetry) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>{message}</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
      {message}
    </div>
  )
}
