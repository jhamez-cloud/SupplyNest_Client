"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Package } from "lucide-react"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { productImageUrl } from "@/lib/product-images"
import type { Product } from "@/lib/types"

// Reusable product card used by home + catalog. Price lives on variations, so
// callers may pass a cheapest `price` if they have it; otherwise we nudge the
// shopper to open the product to view pricing.
export function ProductCard({
  product,
  price,
  className,
}: {
  product: Product
  price?: number
  className?: string
}) {
  return (
    <Link
      href={`/catalog/${product.slug}`}
      className={cn("group block h-full", className)}
    >
      <GlassCard className="flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-xl">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <Image
            src={productImageUrl(product.slug)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <Badge variant="secondary" className="w-fit">
            {product.category.name}
          </Badge>
          <h3 className="font-heading text-base leading-tight font-semibold">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-sm font-medium">
              {price != null ? (
                <>
                  from{" "}
                  <span className="text-primary">{formatCurrency(price)}</span>
                </>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="size-3.5" />
                  MOQ {product.default_moq}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
