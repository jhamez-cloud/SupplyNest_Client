import * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { cn } from "@/lib/utils"

// Placeholder grid shown while products load. Mirrors the ProductCard layout so
// the swap to real content doesn't shift the page.
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} className="overflow-hidden p-0">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
