"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Package } from "lucide-react"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Order } from "@/lib/types"

// Summary card for a single order in the customer's order list.
export function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const lineCount = order.items.length

  return (
    <GlassCard className="p-0">
      <Link
        href={`/orders/${order.order_number}`}
        className="flex flex-col gap-4 rounded-3xl p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Package className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-heading text-base font-semibold">
              {order.order_number}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.placed_at)} · {lineCount}{" "}
              {lineCount === 1 ? "item" : "items"} · {itemCount} units
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
          <span className="font-heading text-lg font-semibold">
            {formatCurrency(order.total_amount)}
          </span>
          <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
            View <ChevronRight className="size-4" />
          </span>
        </div>
      </Link>
    </GlassCard>
  )
}
