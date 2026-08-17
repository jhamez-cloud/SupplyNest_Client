"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MapPin, Plus, Star } from "lucide-react"
import { toast } from "sonner"

import {
  addAddress,
  deleteAddress,
  getAddresses,
  getMe,
  updateAddress,
  updateMe,
} from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  AddressForm,
  type AddressFormValues,
} from "@/components/order/address-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Address, Customer } from "@/lib/types"

// ---------------------------------------------------------------------------
// Profile form
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  business_name: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function ProfileForm({
  customer,
  onSaved,
}: {
  customer: Customer
  onSaved: () => void
}) {
  const isBusiness = customer.customer_type === "business"
  const [saving, setSaving] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      business_name: customer.business_name ?? "",
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true)
    try {
      await updateMe({
        full_name: values.full_name,
        phone_number: values.phone_number,
        business_name: isBusiness ? values.business_name : undefined,
      })
      toast.success("Profile updated")
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">
        Profile details
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={customer.email} readOnly disabled />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              aria-invalid={!!errors.full_name}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone number</Label>
            <Input
              id="phone_number"
              aria-invalid={!!errors.phone_number}
              {...register("phone_number")}
            />
            {errors.phone_number && (
              <p className="text-xs text-destructive">
                {errors.phone_number.message}
              </p>
            )}
          </div>
        </div>

        {isBusiness && (
          <div className="space-y-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" {...register("business_name")} />
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Address book
// ---------------------------------------------------------------------------

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  busy,
}: {
  address: Address
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  busy: boolean
}) {
  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <MapPin className="size-4" />
          </span>
          <div className="space-y-0.5 text-sm">
            <div className="flex items-center gap-2">
              <p className="font-medium">{address.label ?? "Address"}</p>
              {address.is_default && (
                <Badge variant="success" className="gap-1">
                  <Star className="size-3" /> Default
                </Badge>
              )}
            </div>
            <p>{address.street_address}</p>
            <p className="text-muted-foreground">
              {address.city}, {address.region}
            </p>
            {address.landmark && (
              <p className="text-muted-foreground">{address.landmark}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!address.is_default && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSetDefault}
            disabled={busy}
          >
            Set as default
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={busy}
        >
          Delete
        </Button>
      </div>
    </GlassCard>
  )
}

function AddressBook() {
  const { data, loading, error, refetch } = useMockApi(() => getAddresses())
  const [busy, setBusy] = React.useState(false)

  // Dialog state: "add" | Address (edit) | null
  const [editing, setEditing] = React.useState<Address | "add" | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Address | null>(null)

  const handleAdd = async (values: AddressFormValues) => {
    setBusy(true)
    try {
      await addAddress(values)
      toast.success("Address added")
      setEditing(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add address")
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (id: string, values: AddressFormValues) => {
    setBusy(true)
    try {
      await updateAddress(id, values)
      toast.success("Address updated")
      setEditing(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update address"
      )
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    setBusy(true)
    try {
      await updateAddress(id, { is_default: true })
      toast.success("Default address updated")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update address"
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteAddress(deleteTarget.id)
      toast.success("Address deleted")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete address"
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Address book</h2>
        <Button size="sm" onClick={() => setEditing("add")}>
          <Plus className="size-4" /> Add address
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a delivery address to speed up checkout."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              busy={busy}
              onEdit={() => setEditing(address)}
              onDelete={() => setDeleteTarget(address)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "add" ? "Add address" : "Edit address"}
            </DialogTitle>
            <DialogDescription>
              Delivery addresses are used at checkout.
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <AddressForm
              submitting={busy}
              submitLabel={editing === "add" ? "Add address" : "Save changes"}
              defaultValues={
                editing === "add"
                  ? undefined
                  : {
                      label: editing.label ?? "",
                      region: editing.region,
                      city: editing.city,
                      street_address: editing.street_address,
                      landmark: editing.landmark ?? "",
                      is_default: editing.is_default,
                    }
              }
              onCancel={() => setEditing(null)}
              onSubmit={(values) =>
                editing === "add"
                  ? handleAdd(values)
                  : handleEdit(editing.id, values)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete address?</DialogTitle>
            <DialogDescription>
              This will permanently remove
              {deleteTarget?.label
                ? ` "${deleteTarget.label}"`
                : " this address"}
              . This action can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const { data, loading, error, refetch } = useMockApi(() => getMe())

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Your account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and delivery addresses.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full rounded-3xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <ProfileForm customer={data} onSaved={refetch} />
      ) : null}

      <AddressBook />
    </div>
  )
}
