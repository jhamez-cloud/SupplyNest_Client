import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { GlassCard } from "@/components/glassmorphic/glass-card"

// Compact KPI tile used across the admin dashboard: icon, label, big value,
// and an optional hint line underneath.
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  hint?: string
}) {
  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="font-heading text-3xl font-semibold tracking-tight">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </GlassCard>
  )
}
