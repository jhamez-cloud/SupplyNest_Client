"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Category, Material, UseCase } from "@/lib/types"

export interface CatalogFilterState {
  category?: number
  material?: number
  useCase?: number
  minPrice?: number
  maxPrice?: number
  inStock: boolean
}

const ALL = "all"

// Flattens the category tree into selectable rows (parents + children).
function flattenCategories(
  categories: Category[]
): { id: number; name: string; depth: number }[] {
  const rows: { id: number; name: string; depth: number }[] = []
  categories.forEach((parent) => {
    rows.push({ id: parent.id, name: parent.name, depth: 0 })
    parent.children?.forEach((child) => {
      rows.push({ id: child.id, name: child.name, depth: 1 })
    })
  })
  return rows
}

export function ProductFilters({
  categories,
  materials,
  useCases,
  value,
  onChange,
  onReset,
}: {
  categories: Category[]
  materials: Material[]
  useCases: UseCase[]
  value: CatalogFilterState
  onChange: (patch: Partial<CatalogFilterState>) => void
  onReset: () => void
}) {
  const categoryRows = React.useMemo(
    () => flattenCategories(categories),
    [categories]
  )

  const hasFilters =
    value.category != null ||
    value.material != null ||
    value.useCase != null ||
    value.minPrice != null ||
    value.maxPrice != null ||
    value.inStock

  const numberOrUndefined = (raw: string): number | undefined => {
    if (raw.trim() === "") return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">Filters</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={value.category != null ? String(value.category) : ALL}
          onValueChange={(v) =>
            onChange({ category: v === ALL ? undefined : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categoryRows.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.depth > 0 ? `— ${c.name}` : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Material</Label>
        <Select
          value={value.material != null ? String(value.material) : ALL}
          onValueChange={(v) =>
            onChange({ material: v === ALL ? undefined : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any material</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Use case</Label>
        <Select
          value={value.useCase != null ? String(value.useCase) : ALL}
          onValueChange={(v) =>
            onChange({ useCase: v === ALL ? undefined : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any use case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any use case</SelectItem>
            {useCases.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Price range (GHS)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={value.minPrice ?? ""}
            onChange={(e) =>
              onChange({ minPrice: numberOrUndefined(e.target.value) })
            }
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={value.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ maxPrice: numberOrUndefined(e.target.value) })
            }
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock" className="cursor-pointer">
          In stock only
        </Label>
        <Switch
          id="in-stock"
          checked={value.inStock}
          onCheckedChange={(checked) => onChange({ inStock: checked })}
        />
      </div>
    </div>
  )
}
