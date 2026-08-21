"use client"

import * as React from "react"
import { Gift, Pencil, Plus, Tag, Ticket, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useMockApi } from "@/hooks/use-mock-api"
import {
  createCoupon,
  createPromotion,
  deleteCoupon,
  deletePromotion,
  getAdminCoupons,
  getAdminGiveaways,
  getAdminPromotions,
  updateCoupon,
  updatePromotion,
} from "@/lib/mock-api"
import { formatCurrency, formatDate, titleCase } from "@/lib/utils"
import type {
  Coupon,
  DiscountType,
  Giveaway,
  Promotion,
  PromotionType,
} from "@/lib/types"

const PROMOTION_TYPES: PromotionType[] = ["discount", "giveaway", "bundle"]
const DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"]

// --- Promotions tab ---------------------------------------------------------

interface PromotionForm {
  name: string
  promotion_type: PromotionType
  description: string
  start_date: string
  end_date: string
}

const emptyPromotionForm: PromotionForm = {
  name: "",
  promotion_type: "discount",
  description: "",
  start_date: "",
  end_date: "",
}

function PromotionsTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminPromotions(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Promotion | null>(null)
  const [form, setForm] = React.useState<PromotionForm>(emptyPromotionForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyPromotionForm)
    setDialogOpen(true)
  }

  const openEdit = (promotion: Promotion) => {
    setEditing(promotion)
    setForm({
      name: promotion.name,
      promotion_type: promotion.promotion_type,
      description: promotion.description,
      start_date: promotion.start_date.slice(0, 10),
      end_date: promotion.end_date.slice(0, 10),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.start_date || !form.end_date) {
      toast.error("Start and end dates are required")
      return
    }
    const payload = {
      name: form.name.trim(),
      promotion_type: form.promotion_type,
      description: form.description.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updatePromotion(editing.id, payload)
        toast.success("Promotion updated")
      } else {
        await createPromotion(payload)
        toast.success("Promotion created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save promotion"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePromotion(deleteTarget.id)
      toast.success("Promotion deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete promotion"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: Column<Promotion>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (p) => p.name,
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (p) => (
        <Badge variant="secondary">{titleCase(p.promotion_type)}</Badge>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (p) =>
        p.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
    {
      key: "start",
      header: "Starts",
      sortable: true,
      sortValue: (p) => p.start_date,
      cell: (p) => formatDate(p.start_date),
    },
    {
      key: "end",
      header: "Ends",
      sortable: true,
      sortValue: (p) => p.end_date,
      cell: (p) => formatDate(p.end_date),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${p.name}`}
            onClick={() => openEdit(p)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${p.name}`}
            onClick={() => setDeleteTarget(p)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          New promotion
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No promotions yet"
          description="Create a promotion to run discounts, giveaways, or bundles."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(p) => String(p.id)}
          emptyMessage="No promotions found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit promotion" : "New promotion"}
        description={
          editing
            ? "Update the promotion details below."
            : "Set up a new promotion campaign."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create promotion"}
      >
        <div className="space-y-2">
          <Label htmlFor="promo-name">Name</Label>
          <Input
            id="promo-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. New Year Sale"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo-type">Type</Label>
          <Select
            value={form.promotion_type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, promotion_type: v as PromotionType }))
            }
          >
            <SelectTrigger id="promo-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMOTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {titleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo-desc">Description</Label>
          <Textarea
            id="promo-desc"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Short description of this promotion"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="promo-start">Start date</Label>
            <Input
              id="promo-start"
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_date: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-end">End date</Label>
            <Input
              id="promo-end"
              type="date"
              value={form.end_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_date: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "promotion"}
      />
    </div>
  )
}

// --- Coupons tab ------------------------------------------------------------

interface CouponForm {
  code: string
  discount_type: DiscountType
  discount_value: string
  min_order_value: string
  usage_limit_per_customer: string
  expiry_date: string
}

const emptyCouponForm: CouponForm = {
  code: "",
  discount_type: "percentage",
  discount_value: "10",
  min_order_value: "0",
  usage_limit_per_customer: "1",
  expiry_date: "",
}

function CouponsTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminCoupons(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Coupon | null>(null)
  const [form, setForm] = React.useState<CouponForm>(emptyCouponForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Coupon | null>(null)
  const [previewSubtotal, setPreviewSubtotal] = React.useState("100")

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCouponForm)
    setDialogOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_value: String(coupon.min_order_value),
      usage_limit_per_customer: String(coupon.usage_limit_per_customer),
      expiry_date: coupon.expiry_date.slice(0, 10),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error("Code is required")
      return
    }
    if (!form.expiry_date) {
      toast.error("Expiry date is required")
      return
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order_value: Number(form.min_order_value) || 0,
      usage_limit_per_customer: Number(form.usage_limit_per_customer) || 1,
      expiry_date: form.expiry_date,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateCoupon(editing.id, payload)
        toast.success("Coupon updated")
      } else {
        await createCoupon(payload)
        toast.success("Coupon created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCoupon(deleteTarget.id)
      toast.success("Coupon deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete coupon"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  // Live preview of the discount the current form would produce.
  const subtotalNum = Number(previewSubtotal) || 0
  const valueNum = Number(form.discount_value) || 0
  const minNum = Number(form.min_order_value) || 0
  const meetsMin = subtotalNum >= minNum
  const rawDiscount =
    form.discount_type === "percentage"
      ? (subtotalNum * valueNum) / 100
      : valueNum
  const effectiveDiscount = meetsMin ? Math.min(rawDiscount, subtotalNum) : 0

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      sortValue: (c) => c.code,
      cell: (c) => <span className="font-mono font-medium">{c.code}</span>,
    },
    {
      key: "discount_type",
      header: "Type",
      cell: (c) => (
        <Badge variant="secondary">{titleCase(c.discount_type)}</Badge>
      ),
    },
    {
      key: "discount_value",
      header: "Value",
      sortable: true,
      sortValue: (c) => c.discount_value,
      cell: (c) =>
        c.discount_type === "percentage"
          ? `${c.discount_value}%`
          : formatCurrency(c.discount_value),
    },
    {
      key: "min_order_value",
      header: "Min order",
      sortable: true,
      sortValue: (c) => c.min_order_value,
      cell: (c) => formatCurrency(c.min_order_value),
    },
    {
      key: "expiry",
      header: "Expires",
      sortable: true,
      sortValue: (c) => c.expiry_date,
      cell: (c) => formatDate(c.expiry_date),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${c.code}`}
            onClick={() => openEdit(c)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${c.code}`}
            onClick={() => setDeleteTarget(c)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          New coupon
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create a coupon code customers can redeem at checkout."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(c) => String(c.id)}
          emptyMessage="No coupons found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit coupon" : "New coupon"}
        description={
          editing
            ? "Update the coupon details below."
            : "Create a redeemable coupon code."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create coupon"}
      >
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Code</Label>
          <Input
            id="coupon-code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. SAVE10"
            className="font-mono uppercase"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coupon-dtype">Discount type</Label>
            <Select
              value={form.discount_type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, discount_type: v as DiscountType }))
              }
            >
              <SelectTrigger id="coupon-dtype">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {titleCase(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-value">
              {form.discount_type === "percentage"
                ? "Discount (%)"
                : "Discount amount"}
            </Label>
            <Input
              id="coupon-value"
              type="number"
              min={0}
              value={form.discount_value}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount_value: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coupon-min">Min order value</Label>
            <Input
              id="coupon-min"
              type="number"
              min={0}
              value={form.min_order_value}
              onChange={(e) =>
                setForm((f) => ({ ...f, min_order_value: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-limit">Usage limit / customer</Label>
            <Input
              id="coupon-limit"
              type="number"
              min={1}
              value={form.usage_limit_per_customer}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  usage_limit_per_customer: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-expiry">Expiry date</Label>
          <Input
            id="coupon-expiry"
            type="date"
            value={form.expiry_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, expiry_date: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <Label htmlFor="coupon-preview">Preview — sample subtotal</Label>
          <Input
            id="coupon-preview"
            type="number"
            min={0}
            value={previewSubtotal}
            onChange={(e) => setPreviewSubtotal(e.target.value)}
          />
          {meetsMin ? (
            <p className="text-sm">
              Discount:{" "}
              <span className="font-medium text-primary">
                {formatCurrency(effectiveDiscount)}
              </span>{" "}
              · Customer pays{" "}
              <span className="font-medium">
                {formatCurrency(subtotalNum - effectiveDiscount)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Minimum order of {formatCurrency(minNum)} not met — no discount
              applies.
            </p>
          )}
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.code ?? "coupon"}
      />
    </div>
  )
}

// --- Giveaways tab (read-only) ----------------------------------------------

function GiveawaysTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminGiveaways(),
    []
  )

  const columns: Column<Giveaway>[] = [
    {
      key: "sku",
      header: "Variation SKU",
      sortable: true,
      sortValue: (g) => g.variation.sku,
      cell: (g) => <span className="font-mono text-xs">{g.variation.sku}</span>,
    },
    {
      key: "quantity",
      header: "Qty available",
      sortable: true,
      sortValue: (g) => g.quantity_available,
      cell: (g) => g.quantity_available,
    },
    {
      key: "conditions",
      header: "Conditions",
      cell: (g) => (
        <span className="text-muted-foreground">{g.conditions}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Giveaways are configured against their parent promotion and shown here
        for reference.
      </p>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No giveaways"
          description="Giveaway items linked to promotions will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(g) => String(g.id)}
          emptyMessage="No giveaways found."
        />
      )}
    </div>
  )
}

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions"
        description="Manage promotions, coupons, and giveaways"
      />

      <Tabs defaultValue="promotions">
        <TabsList>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="giveaways">Giveaways</TabsTrigger>
        </TabsList>
        <TabsContent value="promotions" className="mt-6">
          <PromotionsTab />
        </TabsContent>
        <TabsContent value="coupons" className="mt-6">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="giveaways" className="mt-6">
          <GiveawaysTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
