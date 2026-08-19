"use client"

import * as React from "react"
import { Calculator, MapPin, Pencil, Plus, Truck, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { GlassCard } from "@/components/glassmorphic/glass-card"
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
  createOption,
  createZone,
  deleteOption,
  deleteZone,
  getAdminOptions,
  getAdminZones,
  updateOption,
  updateZone,
} from "@/lib/mock-api"
import { formatCurrency, titleCase } from "@/lib/utils"
import type { DeliveryOption, DeliveryZone, FeeType } from "@/lib/types"

const FEE_TYPES: FeeType[] = ["flat", "zone_based"]

// --- Zones tab --------------------------------------------------------------

interface ZoneForm {
  name: string
  regions: string
  base_fee: string
  estimated_days_min: string
  estimated_days_max: string
}

const emptyZoneForm: ZoneForm = {
  name: "",
  regions: "",
  base_fee: "0",
  estimated_days_min: "1",
  estimated_days_max: "3",
}

function ZonesTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminZones(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DeliveryZone | null>(null)
  const [form, setForm] = React.useState<ZoneForm>(emptyZoneForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeliveryZone | null>(
    null
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyZoneForm)
    setDialogOpen(true)
  }

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone)
    setForm({
      name: zone.name,
      regions: zone.regions.join(", "),
      base_fee: String(zone.base_fee),
      estimated_days_min: String(zone.estimated_days_min),
      estimated_days_max: String(zone.estimated_days_max),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    const regions = form.regions
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
    if (regions.length === 0) {
      toast.error("Add at least one region")
      return
    }
    const payload = {
      name: form.name.trim(),
      regions,
      base_fee: Number(form.base_fee) || 0,
      estimated_days_min: Number(form.estimated_days_min) || 0,
      estimated_days_max: Number(form.estimated_days_max) || 0,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateZone(editing.id, payload)
        toast.success("Zone updated")
      } else {
        await createZone(payload)
        toast.success("Zone created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save zone")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteZone(deleteTarget.id)
      toast.success("Zone deleted")
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete zone")
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: Column<DeliveryZone>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (z) => z.name,
      cell: (z) => <span className="font-medium">{z.name}</span>,
    },
    {
      key: "regions",
      header: "Regions",
      cell: (z) => (
        <span className="text-muted-foreground">{z.regions.join(", ")}</span>
      ),
    },
    {
      key: "base_fee",
      header: "Base fee",
      sortable: true,
      sortValue: (z) => z.base_fee,
      cell: (z) => formatCurrency(z.base_fee),
    },
    {
      key: "days",
      header: "Est. days",
      cell: (z) => `${z.estimated_days_min}–${z.estimated_days_max}`,
    },
    {
      key: "active",
      header: "Status",
      cell: (z) =>
        z.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (z) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${z.name}`}
            onClick={() => openEdit(z)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${z.name}`}
            onClick={() => setDeleteTarget(z)}
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
          New zone
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No delivery zones yet"
          description="Define zones to group regions and set base delivery fees."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(z) => String(z.id)}
          emptyMessage="No zones found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit zone" : "New zone"}
        description={
          editing
            ? "Update the delivery zone details below."
            : "Create a delivery zone covering one or more regions."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create zone"}
      >
        <div className="space-y-2">
          <Label htmlFor="zone-name">Name</Label>
          <Input
            id="zone-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Greater Accra Metro"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone-regions">Regions</Label>
          <Textarea
            id="zone-regions"
            value={form.regions}
            onChange={(e) =>
              setForm((f) => ({ ...f, regions: e.target.value }))
            }
            placeholder="Greater Accra, Ashanti, Central"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of Ghana regions.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone-fee">Base fee</Label>
          <Input
            id="zone-fee"
            type="number"
            min={0}
            value={form.base_fee}
            onChange={(e) =>
              setForm((f) => ({ ...f, base_fee: e.target.value }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="zone-min">Est. days (min)</Label>
            <Input
              id="zone-min"
              type="number"
              min={0}
              value={form.estimated_days_min}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimated_days_min: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-max">Est. days (max)</Label>
            <Input
              id="zone-max"
              type="number"
              min={0}
              value={form.estimated_days_max}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimated_days_max: e.target.value }))
              }
            />
          </div>
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "zone"}
      />
    </div>
  )
}

// --- Options tab ------------------------------------------------------------

interface OptionForm {
  name: string
  fee_type: FeeType
  description: string
  flat_fee: string
}

const emptyOptionForm: OptionForm = {
  name: "",
  fee_type: "flat",
  description: "",
  flat_fee: "0",
}

function OptionsTab() {
  const { data, loading, error, refetch } = useMockApi(
    () => getAdminOptions(),
    []
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DeliveryOption | null>(null)
  const [form, setForm] = React.useState<OptionForm>(emptyOptionForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeliveryOption | null>(
    null
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyOptionForm)
    setDialogOpen(true)
  }

  const openEdit = (option: DeliveryOption) => {
    setEditing(option)
    setForm({
      name: option.name,
      fee_type: option.fee_type,
      description: option.description ?? "",
      flat_fee: option.flat_fee != null ? String(option.flat_fee) : "0",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    const payload = {
      name: form.name.trim(),
      fee_type: form.fee_type,
      description: form.description.trim() || undefined,
      flat_fee:
        form.fee_type === "flat" ? Number(form.flat_fee) || 0 : undefined,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateOption(editing.id, payload)
        toast.success("Option updated")
      } else {
        await createOption(payload)
        toast.success("Option created")
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save option")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOption(deleteTarget.id)
      toast.success("Option deleted")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete option"
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: Column<DeliveryOption>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (o) => o.name,
      cell: (o) => <span className="font-medium">{o.name}</span>,
    },
    {
      key: "fee_type",
      header: "Fee type",
      cell: (o) => <Badge variant="secondary">{titleCase(o.fee_type)}</Badge>,
    },
    {
      key: "flat_fee",
      header: "Flat fee",
      sortable: true,
      sortValue: (o) => o.flat_fee ?? 0,
      cell: (o) =>
        o.fee_type === "flat" && o.flat_fee != null ? (
          formatCurrency(o.flat_fee)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (o) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${o.name}`}
            onClick={() => openEdit(o)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${o.name}`}
            onClick={() => setDeleteTarget(o)}
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
          New option
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No delivery options yet"
          description="Create options customers can choose at checkout."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(o) => String(o.id)}
          emptyMessage="No options found."
        />
      )}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit option" : "New option"}
        description={
          editing
            ? "Update the delivery option below."
            : "Create a delivery option and its pricing model."
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editing ? "Save changes" : "Create option"}
      >
        <div className="space-y-2">
          <Label htmlFor="option-name">Name</Label>
          <Input
            id="option-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Express Delivery"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="option-ftype">Fee type</Label>
          <Select
            value={form.fee_type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, fee_type: v as FeeType }))
            }
          >
            <SelectTrigger id="option-ftype">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {titleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.fee_type === "flat" && (
          <div className="space-y-2">
            <Label htmlFor="option-fee">Flat fee</Label>
            <Input
              id="option-fee"
              type="number"
              min={0}
              value={form.flat_fee}
              onChange={(e) =>
                setForm((f) => ({ ...f, flat_fee: e.target.value }))
              }
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="option-desc">Description</Label>
          <Textarea
            id="option-desc"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Optional description"
          />
        </div>
      </CrudDialog>

      <ConfirmDelete
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        entity={deleteTarget?.name ?? "option"}
      />
    </div>
  )
}

// --- Fee calculator ---------------------------------------------------------

function FeeCalculator() {
  const zones = useMockApi(() => getAdminZones(), [])
  const options = useMockApi(() => getAdminOptions(), [])

  const [zoneId, setZoneId] = React.useState("")
  const [optionId, setOptionId] = React.useState("")

  const zoneList = zones.data ?? []
  const optionList = options.data ?? []

  const selectedZone = zoneList.find((z) => String(z.id) === zoneId)
  const selectedOption = optionList.find((o) => String(o.id) === optionId)

  let fee: number | null = null
  if (selectedOption) {
    if (selectedOption.fee_type === "flat") {
      fee = selectedOption.flat_fee ?? 0
    } else if (selectedZone) {
      fee = selectedZone.base_fee
    }
  }

  const loading = zones.loading || options.loading

  return (
    <GlassCard className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calculator className="size-4" />
        </span>
        <div>
          <p className="font-heading text-base font-semibold">Fee calculator</p>
          <p className="text-sm text-muted-foreground">
            Preview the delivery fee for a zone and option combination.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calc-zone">Zone</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger id="calc-zone">
                <SelectValue placeholder="Choose a zone" />
              </SelectTrigger>
              <SelectContent>
                {zoneList.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calc-option">Option</Label>
            <Select value={optionId} onValueChange={setOptionId}>
              <SelectTrigger id="calc-option">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                {optionList.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        {fee != null ? (
          <p className="text-sm">
            Delivery fee:{" "}
            <span className="font-heading text-lg font-semibold text-primary">
              {formatCurrency(fee)}
            </span>
            {selectedOption?.fee_type === "zone_based" && (
              <span className="ml-2 text-muted-foreground">
                (zone base fee)
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {selectedOption?.fee_type === "zone_based"
              ? "Select a zone to compute the zone-based fee."
              : "Select a zone and option to compute the fee."}
          </p>
        )}
      </div>
    </GlassCard>
  )
}

export default function AdminDeliveryPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Delivery"
        description="Manage delivery zones and options"
      />

      <FeeCalculator />

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>
        <TabsContent value="zones" className="mt-6">
          <ZonesTab />
        </TabsContent>
        <TabsContent value="options" className="mt-6">
          <OptionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
