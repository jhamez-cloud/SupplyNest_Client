"use client"

import * as React from "react"
import { ShoppingBag, Tag, Truck } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useMockApi } from "@/hooks/use-mock-api"
import { assignTracking, getAllOrders, updateOrderStatus } from "@/lib/mock-api"
import { formatCurrency, formatDate, titleCase } from "@/lib/utils"
import type { Order, OrderStatus } from "@/lib/types"

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]

export default function AdminOrdersPage() {
  const { data, loading, error, refetch } = useMockApi(() => getAllOrders(), [])

  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatus>(
    "all"
  )

  const [statusOrder, setStatusOrder] = React.useState<Order | null>(null)
  const [newStatus, setNewStatus] = React.useState<OrderStatus>("pending")
  const [statusNote, setStatusNote] = React.useState("")
  const [statusSubmitting, setStatusSubmitting] = React.useState(false)

  const [trackingOrder, setTrackingOrder] = React.useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingSubmitting, setTrackingSubmitting] = React.useState(false)

  const filtered = React.useMemo(() => {
    const rows = data ?? []
    return statusFilter === "all"
      ? rows
      : rows.filter((o) => o.status === statusFilter)
  }, [data, statusFilter])

  const openStatus = (order: Order) => {
    setStatusOrder(order)
    setNewStatus(order.status)
    setStatusNote("")
  }

  const openTracking = (order: Order) => {
    setTrackingOrder(order)
    setTrackingNumber("")
  }

  const submitStatus = async () => {
    if (!statusOrder) return
    setStatusSubmitting(true)
    try {
      await updateOrderStatus(
        statusOrder.order_number,
        newStatus,
        statusNote.trim() || undefined
      )
      toast.success("Order status updated")
      setStatusOrder(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      )
    } finally {
      setStatusSubmitting(false)
    }
  }

  const submitTracking = async () => {
    if (!trackingOrder) return
    if (!trackingNumber.trim()) {
      toast.error("Tracking number is required")
      return
    }
    setTrackingSubmitting(true)
    try {
      await assignTracking(trackingOrder.order_number, trackingNumber.trim())
      toast.success("Tracking assigned")
      setTrackingOrder(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign tracking"
      )
    } finally {
      setTrackingSubmitting(false)
    }
  }

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
      key: "payment",
      header: "Payment",
      cell: (o) => <PaymentStatusBadge status={o.payment_status} />,
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
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (o) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openStatus(o)}>
            <Tag className="size-3.5" />
            Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => openTracking(o)}>
            <Truck className="size-3.5" />
            Tracking
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Update statuses and assign tracking"
        action={
          <div className="w-48">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | OrderStatus)}
            >
              <SelectTrigger aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Orders placed by customers will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(o) => o.order_number}
          emptyMessage="No orders match this filter."
        />
      )}

      <CrudDialog
        open={statusOrder !== null}
        onOpenChange={(o) => !o && setStatusOrder(null)}
        title="Update order status"
        description={
          statusOrder ? `Order ${statusOrder.order_number}` : undefined
        }
        onSubmit={submitStatus}
        submitting={statusSubmitting}
        submitLabel="Update status"
      >
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={newStatus}
            onValueChange={(v) => setNewStatus(v as OrderStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Add a note for the status history"
          />
        </div>
      </CrudDialog>

      <CrudDialog
        open={trackingOrder !== null}
        onOpenChange={(o) => !o && setTrackingOrder(null)}
        title="Assign tracking"
        description={
          trackingOrder ? `Order ${trackingOrder.order_number}` : undefined
        }
        onSubmit={submitTracking}
        submitting={trackingSubmitting}
        submitLabel="Assign tracking"
      >
        <div className="space-y-2">
          <Label htmlFor="tracking">Tracking number</Label>
          <Input
            id="tracking"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. SN-TRACK-00123"
            required
          />
        </div>
      </CrudDialog>
    </div>
  )
}
