"use client"

import * as React from "react"
import { Package } from "lucide-react"

import { getOrders } from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/glassmorphic/stagger"
import { OrderCard } from "@/components/order/order-card"
import {
  OrderStatusFilter,
  type OrderStatusFilterValue,
} from "@/components/order/order-status-filter"

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}

export default function OrdersPage() {
  const { data, loading, error, refetch } = useMockApi(() => getOrders())
  const [status, setStatus] = React.useState<OrderStatusFilterValue>("all")

  const filtered = React.useMemo(() => {
    if (!data) return []
    if (status === "all") return data
    return data.filter((order) => order.status === status)
  }, [data, status])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">My orders</h1>
        <p className="text-sm text-muted-foreground">
          Track and review every order you&apos;ve placed.
        </p>
      </div>

      {!loading && !error && data && data.length > 0 && (
        <OrderStatusFilter value={status} onChange={setStatus} />
      )}

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place your first order, it will show up here."
          action={{ label: "Browse the catalog", href: "/catalog" }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No matching orders"
          description="No orders with this status. Try a different filter."
        />
      ) : (
        <StaggerContainer className="space-y-3">
          {filtered.map((order) => (
            <StaggerItem key={order.order_number}>
              <OrderCard order={order} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
