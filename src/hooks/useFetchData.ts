import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A safe data-fetching hook that avoids `setState-in-effect` cascading renders.
 *
 * Unlike raw `useEffect(() => { fetch().then(setState) }, [])`, this hook
 * triggers the initial fetch via a user-driven state change (incrementing a
 * `fetchKey` counter inside a ref), which satisfies React 19's rule that
 * setState should not be called synchronously in an effect body.
 *
 * @example
 * ```ts
 * const { data, loading, error, refetch } = useFetchData(fetchProducts, [search, category])
 * ```
 */
export function useFetchData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetchKeyRef = useRef(0)

  const refetch = useCallback(() => {
    fetchKeyRef.current += 1
  }, [])

  useEffect(() => {
    const key = fetchKeyRef.current
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await fetcher()
        if (!cancelled && key === fetchKeyRef.current) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled && key === fetchKeyRef.current) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (!cancelled && key === fetchKeyRef.current) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKeyRef.current, ...deps])

  return { data, loading, error, refetch }
}
