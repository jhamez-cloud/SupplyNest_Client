"use client"

import * as React from "react"
import {
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { GlassCard } from "@/components/glassmorphic/glass-card"
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
import { useMockApi } from "@/hooks/use-mock-api"
import {
  createAttribute,
  createCategory,
  deleteAttribute,
  deleteCategory,
  getAdminAttributes,
  getCategories,
  updateAttribute,
  updateCategory,
} from "@/lib/mock-api"
import type { Attribute, Category } from "@/lib/types"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const NO_PARENT = "__none__"

type TreeNode = Omit<Category, "children"> & { children: TreeNode[] }

// Build a parent → children tree from a flat category list.
function buildTree(categories: Category[]): TreeNode[] {
  const byId = new Map<number, TreeNode>()
  categories.forEach((c) => byId.set(c.id, { ...c, children: [] }))
  const roots: TreeNode[] = []
  byId.forEach((node) => {
    if (node.parent_id != null && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

// --- Categories tab ---------------------------------------------------------

interface CategoryForm {
  name: string
  slug: string
  parent_id: string
}

const emptyCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  parent_id: NO_PARENT,
}

function CategoriesTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getCategories(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [form, setForm] = React.useState<CategoryForm>(emptyCategoryForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null)

  const categories = data ?? []
  const tree = React.useMemo(() => buildTree(categories), [categories])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCategoryForm)
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setForm({
      name: category.name,
      slug: category.slug,
      parent_id:
        category.parent_id != null ? String(category.parent_id) : NO_PARENT,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    const parent_id =
      form.parent_id === NO_PARENT ? undefined : Number(form.parent_id)
    setSubmitting(true)
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          parent_id,
        })
        toast.success("Category updated")
      } else {
        await createCategory({
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          parent_id,
        })
        toast.success("Category created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory(deleteTarget.id)
      toast.success("Category deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  // Exclude self from the parent select when editing (a category can't parent
  // itself).
  const parentOptions = categories.filter((c) => c.id !== editing?.id)

  const renderNode = (node: TreeNode, depth = 0) => (
    <div key={node.id}>
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <span className="flex items-center gap-2 text-sm">
          {depth > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          <span className="font-medium">{node.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            /{node.slug}
          </span>
        </span>
        <span className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${node.name}`}
            onClick={() => openEdit(node)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${node.name}`}
            onClick={() => setDeleteTarget(node)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </span>
      </div>
      {node.children.map((child) => renderNode(child, depth + 1))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to organize the catalog."
        />
      ) : (
        <GlassCard className="divide-y divide-border p-2">
          {tree.map((node) => renderNode(node))}
        </GlassCard>
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit category" : "New category"}
        description={
          editing
            ? "Update the category details below."
            : "Add a new category to the catalog."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create category"}
      >
        <div className="space-y-2">
          <Label htmlFor="cat-name">Name</Label>
          <Input
            id="cat-name"
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
            placeholder="e.g. Boxes"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="auto-generated from name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-parent">Parent category</Label>
          <Select
            value={form.parent_id}
            onValueChange={(v) => setForm((f) => ({ ...f, parent_id: v }))}
          >
            <SelectTrigger id="cat-parent">
              <SelectValue placeholder="No parent (top level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PARENT}>No parent (top level)</SelectItem>
              {parentOptions.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "category"}
      />
    </div>
  )
}

// --- Attributes tab ---------------------------------------------------------

interface AttributeForm {
  name: string
  code: string
}

const emptyAttributeForm: AttributeForm = { name: "", code: "" }

function AttributesTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminAttributes(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Attribute | null>(null)
  const [form, setForm] = React.useState<AttributeForm>(emptyAttributeForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Attribute | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyAttributeForm)
    setDialogOpen(true)
  }

  const openEdit = (attribute: Attribute) => {
    setEditing(attribute)
    setForm({ name: attribute.name, code: attribute.code })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.code.trim()) {
      toast.error("Code is required")
      return
    }
    const payload = { name: form.name.trim(), code: form.code.trim() }
    setSubmitting(true)
    try {
      if (editing) {
        await updateAttribute(editing.id, payload)
        toast.success("Attribute updated")
      } else {
        await createAttribute(payload)
        toast.success("Attribute created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save attribute"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAttribute(deleteTarget.id)
      toast.success("Attribute deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attribute"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: Column<Attribute>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (a) => a.name,
      cell: (a) => <span className="font-medium">{a.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      sortValue: (a) => a.code,
      cell: (a) => <span className="font-mono text-xs">{a.code}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${a.name}`}
            onClick={() => openEdit(a)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${a.name}`}
            onClick={() => setDeleteTarget(a)}
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
          New attribute
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No attributes yet"
          description="Attributes define the axes of your product variations."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(a) => String(a.id)}
          emptyMessage="No attributes found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit attribute" : "New attribute"}
        description={
          editing
            ? "Update the attribute details below."
            : "Add a new attribute (e.g. Color, Lid, Material)."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create attribute"}
      >
        <div className="space-y-2">
          <Label htmlFor="attr-name">Name</Label>
          <Input
            id="attr-name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                code:
                  !editing && (f.code === "" || f.code === slugify(f.name))
                    ? slugify(e.target.value)
                    : f.code,
              }))
            }
            placeholder="e.g. Color"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attr-code">Code</Label>
          <Input
            id="attr-code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. color"
          />
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "attribute"}
      />
    </div>
  )
}

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catalog"
        description="Manage categories and product attributes"
      />

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="attributes" className="mt-6">
          <AttributesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
