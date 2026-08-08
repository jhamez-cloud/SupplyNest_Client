"use client"

import * as React from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ProductImage } from "@/lib/types"

// Main image + thumbnail strip. Selecting a thumbnail (click or keyboard)
// swaps the main image. Degrades gracefully to a placeholder when there are
// no images, and hides the strip when there's only one.
export function ImageGallery({
  images,
  alt,
}: {
  images: ProductImage[]
  alt: string
}) {
  const ordered = React.useMemo(() => {
    return [...images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary)
    )
  }, [images])

  const [active, setActive] = React.useState(0)

  React.useEffect(() => {
    setActive(0)
  }, [ordered.length])

  if (ordered.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <ImageOff className="size-10" />
      </div>
    )
  }

  const current = ordered[Math.min(active, ordered.length - 1)]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={current.image}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {ordered.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ordered.map((image, i) => {
            const selected = i === active
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={selected}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-xl border transition-colors",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Image
                  src={image.image}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
