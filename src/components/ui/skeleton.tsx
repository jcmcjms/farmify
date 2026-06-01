import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Single skeleton block for shimmer loading state.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  )
}

/**
 * Product card skeleton for the marketplace grid.
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton for admin/list pages.
 */
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={i === 0 ? 'h-4 w-8' : i === 1 ? 'h-4 w-32' : 'h-4 w-24'} />
        </td>
      ))}
    </tr>
  )
}

/**
 * Dashboard stat card skeleton.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="size-12 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-20 mt-4" />
    </div>
  )
}

/**
 * Detail page skeleton.
 */
export function DetailPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
