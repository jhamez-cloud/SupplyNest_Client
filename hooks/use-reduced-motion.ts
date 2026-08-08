"use client"

import * as React from "react"

// Respects the OS "reduce motion" setting so Framer Motion animations can be
// disabled for users who prefer it.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener("change", handler)
    return () => query.removeEventListener("change", handler)
  }, [])

  return reduced
}
