"use client"

import * as React from "react"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"

interface OrderSummaryProps {
  subtotal: number
  discount: number
  deliveryFee: number | null
  total: number
  // When the delivery fee is zone-based and can't be previewed up front.
  deliveryFeePending?: boolean
  className?: string
  children?: React.ReactNode
}

// Reusable totals panel used by both the cart and checkout pages.
export function OrderSummary({
  subtotal,
  discount,
  deliveryFee,
  total,
  deliveryFeePending,
  className,
  children,
}: OrderSummaryProps) {
  return (
    <GlassCard className={cn("space-y-4 p-6", className)}>
      <h2 className="font-heading text-lg font-semibold">Order summary</h2>
      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular-nums">
            {formatCurrency(subtotal)}
          </dd>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-primary">
            <dt>Discount</dt>
            <dd className="font-medium tabular-nums">
              -{formatCurrency(discount)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="font-medium tabular-nums">
            {deliveryFeePending
              ? "Calculated at delivery"
              : deliveryFee === null
                ? "—"
                : deliveryFee === 0
                  ? "Free"
                  : formatCurrency(deliveryFee)}
          </dd>
        </div>
      </dl>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="font-heading text-base font-semibold">Total</span>
        <span className="font-heading text-lg font-semibold tabular-nums">
          {formatCurrency(total)}
          {deliveryFeePending && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              + delivery
            </span>
          )}
        </span>
      </div>
      {children}
    </GlassCard>
  )
}
