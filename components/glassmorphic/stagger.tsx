"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion"

// Staggered fade-up for lists/grids. Wrap items with <StaggerItem>.
export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      }}
    >
      {children}
    </motion.div>
  )
}
