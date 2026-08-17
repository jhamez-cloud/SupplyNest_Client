"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Package, ShoppingBag } from "lucide-react"

import { useMockApi } from "@/hooks/use-mock-api"
import { getOrderByNumber, getPaymentStatus } from "@/lib/mock-api"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { PaymentStatus } from "@/lib/types"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 10

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")

  const {
    data: order,
    loading,
    error,
    refetch,
  } = useMockApi(() => getOrderByNumber(orderNumber ?? ""), [orderNumber])

  // Poll payment status until it flips to paid (the webhook is the source of
  // truth), capped so we never poll forever.
  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus | null>(null)

  React.useEffect(() => {
    if (!orderNumber) return
    setPaymentStatus(order?.payment_status ?? null)
    if (order?.payment_status === "paid") return

    let cancelled = false
    let polls = 0

    async function poll() {
      if (cancelled || !orderNumber) return
      polls += 1
      try {
        const status = await getPaymentStatus(orderNumber)
        if (cancelled) return
        setPaymentStatus(status)
        if (status === "paid") return
      } catch {
        // Ignore transient errors and keep polling until the cap.
      }
      if (!cancelled && polls < MAX_POLLS) {
        window.setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    const handle = window.setTimeout(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [orderNumber, order?.payment_status])

  if (!orderNumber) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No order specified"
        description="We couldn't find an order reference to display."
        action={{ label: "Back to catalog", href: "/catalog" }}
      />
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  if (error || !order) {
    return <ErrorState message={error ?? undefined} onRetry={refetch} />
  }

  const effectivePayment = paymentStatus ?? order.payment_status

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-9" />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">
            Thank you for your order!
          </h1>
          <p className="text-sm text-muted-foreground">
            Order{" "}
            <span className="font-medium text-foreground">
              {order.order_number}
            </span>{" "}
            has been received.
          </p>
        </div>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Order status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Payment</span>
            <PaymentStatusBadge status={effectivePayment} />
          </div>
        </div>

        {effectivePayment !== "paid" && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Confirming your payment with the gateway… this updates
            automatically.
          </p>
        )}

        <Separator />

        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {item.variation.product.name}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <span className="font-medium tabular-nums">
                {formatCurrency(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <Separator />

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-primary">
              <dt>Discount</dt>
              <dd className="tabular-nums">
                -{formatCurrency(order.discount_amount)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="tabular-nums">
              {order.delivery_fee === 0
                ? "Free"
                : formatCurrency(order.delivery_fee)}
            </dd>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {formatCurrency(order.total_amount)}
            </dd>
          </div>
        </dl>

        <Separator />

        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            <Package className="size-4" /> Delivery
          </p>
          <p className="text-muted-foreground">
            {order.delivery_option.name} to {order.delivery_address.city},{" "}
            {order.delivery_address.region}
          </p>
          <p className="text-xs text-muted-foreground">
            Placed {formatDate(order.placed_at)}
          </p>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/orders/${order.order_number}`}>Track this order</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/catalog">Continue shopping</Link>
        </Button>
      </div>
    </div>
  )
}
