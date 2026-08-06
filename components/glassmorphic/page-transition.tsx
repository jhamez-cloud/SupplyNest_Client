"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion"

// Fade + subtle rise on route change. Disabled when the user prefers reduced
// motion, in which case children render without animation.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
