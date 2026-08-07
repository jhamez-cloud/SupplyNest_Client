"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export const addressSchema = z.object({
  label: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
  street_address: z.string().min(1, "Street address is required"),
  landmark: z.string().optional(),
  is_default: z.boolean(),
})

export type AddressFormValues = z.infer<typeof addressSchema>

const EMPTY: AddressFormValues = {
  label: "",
  region: "",
  city: "",
  street_address: "",
  landmark: "",
  is_default: false,
}

// Shared RHF + zod address form used by both the add and edit dialogs. The
// parent owns persistence — this only validates and hands back clean values.
export function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save address",
}: {
  defaultValues?: Partial<AddressFormValues>
  onSubmit: (values: AddressFormValues) => void
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  })

  const isDefault = watch("is_default")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address-label">Label</Label>
        <Input
          id="address-label"
          placeholder="Home, Office…"
          {...register("label")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address-region">Region</Label>
          <Input
            id="address-region"
            placeholder="Greater Accra"
            aria-invalid={!!errors.region}
            {...register("region")}
          />
          {errors.region && (
            <p className="text-xs text-destructive">{errors.region.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-city">City</Label>
          <Input
            id="address-city"
            placeholder="Accra"
            aria-invalid={!!errors.city}
            {...register("city")}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address-street">Street address</Label>
        <Input
          id="address-street"
          placeholder="12 Oxford Street, Osu"
          aria-invalid={!!errors.street_address}
          {...register("street_address")}
        />
        {errors.street_address && (
          <p className="text-xs text-destructive">
            {errors.street_address.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address-landmark">Landmark</Label>
        <Input
          id="address-landmark"
          placeholder="Near Koala Shopping Centre"
          {...register("landmark")}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="address-default">Set as default</Label>
          <p className="text-xs text-muted-foreground">
            Use this address for new orders.
          </p>
        </div>
        <Switch
          id="address-default"
          checked={isDefault}
          onCheckedChange={(checked) => setValue("is_default", checked)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
