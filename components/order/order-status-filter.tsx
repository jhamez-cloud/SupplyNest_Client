"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn, titleCase } from "@/lib/utils"
import type { OrderStatus } from "@/lib/types"

export type OrderStatusFilterValue = OrderStatus | "all"

const OPTIONS: OrderStatusFilterValue[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]

// Horizontal, wrapping set of status filters for the orders list. Kept as a
// controlled component so the page owns the active status.
export function OrderStatusFilter({
  value,
  onChange,
  className,
}: {
  value: OrderStatusFilterValue
  onChange: (value: OrderStatusFilterValue) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {OPTIONS.map((option) => {
        const active = option === value
        return (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            aria-pressed={active}
            onClick={() => onChange(option)}
          >
            {option === "all" ? "All" : titleCase(option)}
          </Button>
        )
      })}
    </div>
  )
}
