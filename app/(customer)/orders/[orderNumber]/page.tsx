"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin, PackageX, Truck } from "lucide-react"
import { toast } from "sonner"

import { cancelOrder, getOrderByNumber, getShipment } from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge"
import {
  OrderTimeline,
  type TimelineEntry,
} from "@/components/shared/order-timeline"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatCurrency, formatDate, titleCase } from "@/lib/utils"
import { productImageUrl } from "@/lib/product-images"
import type { Order, ProductVariation } from "@/lib/types"

const variationLabel = (variation: ProductVariation): string =>
  [variation.material?.name, ...variation.attribute_values.map((a) => a.value)]
    .filter(Boolean)
    .join(" · ")

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  )
}

function TotalsRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        strong && "text-base font-semibold"
      )}
    >
      <span className={cn(!strong && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>()
  const orderNumber = params.orderNumber

  const { data, loading, error, refetch } = useMockApi(
    () => getOrderByNumber(orderNumber),
    [orderNumber]
  )
  // Shipment is optional — swallow the 404 for orders that haven't shipped.
  const { data: shipment } = useMockApi(
    () => getShipment(orderNumber).catch(() => null),
    [orderNumber]
  )

  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelling, setCancelling] = React.useState(false)

  const timeline = React.useMemo<TimelineEntry[]>(() => {
    if (!data) return []
    const fromHistory: TimelineEntry[] = data.status_history.map((h) => ({
      title: titleCase(h.status),
      timestamp: h.changed_at,
      description: h.note,
    }))
    const fromShipment: TimelineEntry[] = shipment
      ? shipment.tracking_events.map((e) => ({
          title: e.status,
          timestamp: e.occurred_at,
          description: e.description,
          location: e.location,
        }))
      : []
    return [...fromHistory, ...fromShipment].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [data, shipment])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelOrder(orderNumber)
      toast.success("Order cancelled")
      setCancelOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel order")
    } finally {
      setCancelling(false)
    }
  }

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
      <Link href="/orders">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {backLink}
        <DetailSkeleton />
      </div>
    )
  }

  if (error) {
    const notFound = /not found|not your/i.test(error)
    return (
      <div className="space-y-6">
        {backLink}
        {notFound ? (
          <EmptyState
            icon={PackageX}
            title="Order not found"
            description="We couldn't find this order. It may have been removed or the link is incorrect."
            action={{ label: "Back to my orders", href: "/orders" }}
          />
        ) : (
          <ErrorState message={error} onRetry={refetch} />
        )}
      </div>
    )
  }

  const order = data as Order
  const canCancel = order.status === "pending" || order.status === "confirmed"

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold">
            {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.placed_at)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            Cancel order
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const label = variationLabel(item.variation)
                return (
                  <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={productImageUrl(item.variation.product.slug, 160)}
                        alt={item.variation.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-sm font-medium">
                        {item.variation.product.name}
                      </p>
                      {label && (
                        <p className="text-xs text-muted-foreground">{label}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right text-sm font-medium">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </GlassCard>

          {/* Timeline */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              Order timeline
            </h2>
            <OrderTimeline entries={timeline} />
          </GlassCard>
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">Summary</h2>
            <div className="space-y-2">
              <TotalsRow
                label="Subtotal"
                value={formatCurrency(order.subtotal)}
              />
              {order.discount_amount > 0 && (
                <TotalsRow
                  label={
                    order.coupon
                      ? `Discount (${order.coupon.code})`
                      : "Discount"
                  }
                  value={`− ${formatCurrency(order.discount_amount)}`}
                />
              )}
              <TotalsRow
                label="Delivery fee"
                value={formatCurrency(order.delivery_fee)}
              />
              <div className="my-2 h-px bg-border" />
              <TotalsRow
                label="Total"
                value={formatCurrency(order.total_amount)}
                strong
              />
            </div>
          </GlassCard>

          {/* Delivery */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              Delivery
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-0.5">
                  {order.delivery_address.label && (
                    <p className="font-medium">
                      {order.delivery_address.label}
                    </p>
                  )}
                  <p>{order.delivery_address.street_address}</p>
                  <p className="text-muted-foreground">
                    {order.delivery_address.city},{" "}
                    {order.delivery_address.region}
                  </p>
                  {order.delivery_address.landmark && (
                    <p className="text-muted-foreground">
                      {order.delivery_address.landmark}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="font-medium">{order.delivery_option.name}</p>
                  {order.delivery_option.description && (
                    <p className="text-muted-foreground">
                      {order.delivery_option.description}
                    </p>
                  )}
                  {shipment?.tracking_number && (
                    <p className="text-muted-foreground">
                      Tracking: {shipment.tracking_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {order.notes && (
            <GlassCard className="p-5">
              <h2 className="mb-2 font-heading text-lg font-semibold">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </GlassCard>
          )}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              This will cancel order {order.order_number}. This action
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Keep order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
