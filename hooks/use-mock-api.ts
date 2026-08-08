"use client"

// Generic data-fetching hook for the mock API. Returns loading/error/data with
// a refetch, so pages can render skeletons while pending and a retry on error.

import * as React from "react"

interface UseMockApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMockApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): UseMockApiResult<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  React.useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetcherRef
      .current()
      .then((result) => {
        if (active) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Something went wrong")
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, refetch }
}
