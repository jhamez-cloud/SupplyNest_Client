import * as React from "react"

import { cn } from "@/lib/utils"

// Reusable glassmorphic surface used across the app. Frosted translucent panel
// with a hairline border and soft shadow — works in light and dark.
function GlassCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        "rounded-3xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70",
        className
      )}
      {...props}
    />
  )
}

export { GlassCard }
