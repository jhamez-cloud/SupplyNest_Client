import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/lib/types"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const ORDER_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "secondary",
  processing: "secondary",
  out_for_delivery: "default",
  delivered: "success",
  cancelled: "destructive",
  refunded: "muted",
}

const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  unpaid: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "muted",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{titleCase(status)}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{titleCase(status)}</Badge>
}

// Generic shipment/status string → styled badge.
export function ShipmentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const variant: BadgeVariant = normalized.includes("deliver")
    ? "success"
    : normalized.includes("transit") || normalized.includes("out")
      ? "default"
      : "secondary"
  return <Badge variant={variant}>{status}</Badge>
}
