import * as React from "react"

import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/glassmorphic/glass-card"

// Standard "failed to load" surface with a retry button, used by pages that
// consume the mock API (which injects a ~5% random error rate).
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <GlassCard className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="font-heading text-base font-semibold">
        Something went wrong
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? "We couldn't load this content. Please try again."}
      </p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-1">
        Try again
      </Button>
    </GlassCard>
  )
}
