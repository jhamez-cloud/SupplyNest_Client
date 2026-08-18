"use client"

import * as React from "react"
import { Package, Users } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { OrderStatusBadge } from "@/components/shared/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMockApi } from "@/hooks/use-mock-api"
import { getAllCustomers, getOrdersForCustomer } from "@/lib/mock-api"
import { formatCurrency, formatDate, titleCase } from "@/lib/utils"
import type { Customer, Order } from "@/lib/types"

// Order history loaded lazily inside the customer detail dialog.
function CustomerOrders({ customerId }: { customerId: string }) {
  const { data, loading, error, refetch } = useMockApi(
    () => getOrdersForCustomer(customerId),
    [customerId]
  )

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders"
        description="This customer hasn't placed any orders yet."
      />
    )
  }

  return (
    <div className="space-y-2">
      {data.map((order: Order) => (
        <div
          key={order.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium">
              {order.order_number}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.placed_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-sm font-medium">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminCustomersPage() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAllCustomers(),
    []
  )

  const [selected, setSelected] = React.useState<Customer | null>(null)

  const columns: Column<Customer>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      sortValue: (c) => c.full_name,
      cell: (c) => <span className="font-medium">{c.full_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortValue: (c) => c.email,
      cell: (c) => <span className="text-muted-foreground">{c.email}</span>,
    },
    {
      key: "customer_type",
      header: "Type",
      cell: (c) => (
        <Badge variant="secondary">{titleCase(c.customer_type)}</Badge>
      ),
    },
    {
      key: "business_name",
      header: "Business",
      cell: (c) =>
        c.business_name ? (
          c.business_name
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (c) =>
        c.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      sortValue: (c) => c.created_at,
      cell: (c) => formatDate(c.created_at),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description="View customers and their order history"
      />

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers will appear here once they sign up."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(c) => c.id}
          emptyMessage="No customers found."
          onRowClick={(c) => setSelected(c)}
        />
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.full_name}</DialogTitle>
            <DialogDescription>
              {selected?.email}
              {selected?.business_name ? ` · ${selected.business_name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {titleCase(selected.customer_type)}
                </Badge>
                {selected.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="muted">Inactive</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Joined {formatDate(selected.created_at)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-heading text-sm font-semibold">
                  Order history
                </p>
                <CustomerOrders customerId={selected.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
