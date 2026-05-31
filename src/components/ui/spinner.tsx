import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
  text?: string
}

/**
 * Loading spinner component.
 */
export function Spinner({ size = 24, className, text }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

/**
 * Full page spinner for loading states.
 */
export function PageSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={32} text={text} />
    </div>
  )
}
