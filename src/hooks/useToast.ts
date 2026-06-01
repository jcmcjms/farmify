import { useContext } from 'react'
import { ToastContext } from '@/context/ToastContext'

/**
 * Hook to show toast notifications.
 *
 * @example
 * ```tsx
 * const { success, error } = useToast()
 * success('Profile saved!')
 * error('Something went wrong', 'Please try again')
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
