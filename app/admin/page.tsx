"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Package, ShoppingBag, TrendingUp, Users } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { OrderStatusBadge } from "@/components/shared/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMockApi } from "@/hooks/use-mock-api"
import { getAdminStats, getAllOrders } from "@/lib/mock-api"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Order } from "@/lib/types"

export default function AdminDashboardPage() {
  const router = useRouter()
  const stats = useMockApi(() => getAdminStats(), [])
  const orders = useMockApi(() => getAllOrders(), [])

  const loading = stats.loading || orders.loading
  const error = stats.error || orders.error

  const recentOrders = React.useMemo(
    () => (orders.data ?? []).slice(0, 8),
    [orders.data]
  )

  const columns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Order #",
      cell: (o) => <span className="font-medium">{o.order_number}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      cell: (o) => o.customer.full_name,
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      sortValue: (o) => o.total_amount,
      cell: (o) => formatCurrency(o.total_amount),
    },
    {
      key: "placed_at",
      header: "Placed",
      sortable: true,
      sortValue: (o) => o.placed_at,
      cell: (o) => formatDate(o.placed_at),
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description="Overview of your store's performance"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    )
  }

  if (error || !stats.data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Dashboard" />
        <ErrorState
          message={error ?? undefined}
          onRetry={() => {
            stats.refetch()
            orders.refetch()
          }}
        />
      </div>
    )
  }

  const {
    totalOrders,
    totalRevenue,
    lowStockCount,
    activeCustomers,
    salesByDay,
  } = stats.data
  const maxSales = Math.max(1, ...salesByDay.map((d) => d.value))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store's performance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total orders"
          value={totalOrders}
          icon={ShoppingBag}
        />
        <AdminStatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          hint="From paid orders"
        />
        <AdminStatCard
          title="Low stock"
          value={lowStockCount}
          icon={Package}
          hint="Variations at or below threshold"
        />
        <AdminStatCard
          title="Active customers"
          value={activeCustomers}
          icon={Users}
        />
      </div>

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            Sales this week
          </h2>
          <p className="text-sm text-muted-foreground">
            Revenue by day (approximate)
          </p>
        </div>
        <div
          className="flex h-56 items-end gap-2 sm:gap-4"
          role="img"
          aria-label={`Weekly sales chart. ${salesByDay
            .map((d) => `${d.label}: ${formatCurrency(d.value)}`)
            .join(", ")}`}
        >
          {salesByDay.map((day) => (
            <div
              key={day.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {formatCurrency(day.value)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-primary transition-all"
                  style={{
                    height: `${Math.max(2, (day.value / maxSales) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Recent orders</h2>
        <DataTable
          columns={columns}
          data={recentOrders}
          rowKey={(o) => o.order_number}
          onRowClick={() => router.push("/admin/orders")}
          emptyMessage="No orders yet."
        />
      </div>
    </div>
  )
}
