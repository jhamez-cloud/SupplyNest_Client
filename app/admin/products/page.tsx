"use client"

import * as React from "react"
import { Package, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useMockApi } from "@/hooks/use-mock-api"
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getCategories,
  getVariationsForProduct,
  updateProduct,
} from "@/lib/mock-api"
import { formatCurrency } from "@/lib/utils"
import type { Category, Product, ProductVariation } from "@/lib/types"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

interface FormState {
  name: string
  slug: string
  description: string
  category_id: string
  default_moq: string
  is_featured: boolean
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  category_id: "",
  default_moq: "1",
  is_featured: false,
}

export default function AdminProductsPage() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAllProducts(),
    []
  )
  const categories = useMockApi(() => getCategories(), [])

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = React.useState(false)

  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null)

  const [variations, setVariations] = React.useState<ProductVariation[]>([])
  const [variationsLoading, setVariationsLoading] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setVariations([])
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category_id: String(product.category_id),
      default_moq: String(product.default_moq),
      is_featured: product.is_featured,
    })
    setVariations([])
    setVariationsLoading(true)
    setDialogOpen(true)
    getVariationsForProduct(product.id)
      .then((vs) => setVariations(vs))
      .catch(() => setVariations([]))
      .finally(() => setVariationsLoading(false))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.category_id) {
      toast.error("Please choose a category")
      return
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      category_id: Number(form.category_id),
      default_moq: Number(form.default_moq) || 1,
      is_featured: form.is_featured,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        toast.success("Product updated")
      } else {
        await createProduct(payload)
        toast.success("Product created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast.success("Product deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (p) => p.name,
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (p) => p.category.name,
    },
    {
      key: "default_moq",
      header: "Default MOQ",
      sortable: true,
      sortValue: (p) => p.default_moq,
      cell: (p) => p.default_moq,
    },
    {
      key: "featured",
      header: "Featured",
      cell: (p) =>
        p.is_featured ? (
          <Badge variant="default">Featured</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New product
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Create your first product to start selling."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(p) => p.id}
          emptyMessage="No products found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit product" : "New product"}
        description={
          editing
            ? "Update the product details below."
            : "Add a new product to your catalog."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create product"}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug:
                  !editing && (f.slug === "" || f.slug === slugify(f.name))
                    ? slugify(e.target.value)
                    : f.slug,
              }))
            }
            placeholder="e.g. Kraft Paper Bag"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="auto-generated from name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Short product description"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((c: Category) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_moq">Default MOQ</Label>
            <Input
              id="default_moq"
              type="number"
              min={1}
              value={form.default_moq}
              onChange={(e) =>
                setForm((f) => ({ ...f, default_moq: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <Label htmlFor="is_featured" className="cursor-pointer">
            Featured product
          </Label>
          <Switch
            id="is_featured"
            checked={form.is_featured}
            onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
          />
        </div>

        {editing && (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label>Variations (SKUs)</Label>
              <span className="text-xs text-muted-foreground">
                managed via SKU import
              </span>
            </div>
            {variationsLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : variations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No variations for this product.
              </p>
            ) : (
              <div className="space-y-1.5">
                {variations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs">{v.sku}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(v.price)} · {v.stock_quantity} in stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "product"}
      />
    </div>
  )
}
