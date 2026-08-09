import * as React from "react"

import { cn, formatDateTime } from "@/lib/utils"

export interface TimelineEntry {
  title: string
  timestamp: string
  description?: string
  location?: string
}

// Vertical timeline used for order status history and shipment tracking events.
export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No events recorded yet.</p>
    )
  }

  return (
    <ol className="relative flex flex-col gap-6">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1
        return (
          <li key={i} className="relative flex gap-4 pl-2">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 mt-1 size-3 shrink-0 rounded-full ring-4 ring-background",
                  isLast ? "bg-primary" : "bg-muted-foreground/40"
                )}
              />
              {!isLast && (
                <span className="w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm font-medium">{entry.title}</p>
              {entry.location && (
                <p className="text-xs text-muted-foreground">
                  {entry.location}
                </p>
              )}
              {entry.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {entry.description}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(entry.timestamp)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
