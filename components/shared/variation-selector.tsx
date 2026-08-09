"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import type { ProductVariation } from "@/lib/types"

// Renders selectable chips for each variation (the sellable SKU). Selecting one
// bubbles it up so the parent can update price / stock / MOQ display.
export function VariationSelector({
  variations,
  selectedId,
  onSelect,
}: {
  variations: ProductVariation[]
  selectedId: string | null
  onSelect: (variation: ProductVariation) => void
}) {
  const label = (v: ProductVariation) => {
    const attrs = v.attribute_values.map((a) => a.value)
    const material = v.material?.name
    const parts = [material, ...attrs].filter(Boolean)
    return parts.length ? parts.join(" · ") : v.sku
  }

  return (
    <div className="flex flex-wrap gap-2">
      {variations.map((v) => {
        const selected = v.id === selectedId
        const disabled = !v.is_available
        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(v)}
            data-selected={selected}
            className={cn(
              "group relative flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              selected
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50",
              disabled && "cursor-not-allowed opacity-40 hover:border-border"
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {label(v)}
              {selected && <Check className="size-3.5 text-primary" />}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(v.price)}
              {disabled ? " · Out of stock" : ` · ${v.stock_quantity} in stock`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
