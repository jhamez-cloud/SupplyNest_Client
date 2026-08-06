"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  disabled?: boolean
  className?: string
}

// Reusable "- [n] +" control. Enforces min/max: the decrement button is
// disabled at min, increment at max, and out-of-range requests are clamped.
export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  disabled,
  className,
}: QuantityStepperProps) {
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease quantity"
        disabled={!canDecrement}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase quantity"
        disabled={!canIncrement}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
