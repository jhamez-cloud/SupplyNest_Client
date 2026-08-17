"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Truck,
} from "lucide-react"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorState } from "@/components/shared/error-state"
import { VariationSelector } from "@/components/shared/variation-selector"
import { ImageGallery } from "@/components/product/image-gallery"
import {
  getProductBySlug,
  getProductImages,
  getProductVariations,
} from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { cn, formatCurrency } from "@/lib/utils"
import type { ProductImage, ProductVariation } from "@/lib/types"

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const { user } = useAuth()
  const { addItem } = useCart()

  const product = useMockApi(() => getProductBySlug(slug), [slug])
  const variations = useMockApi(() => getProductVariations(slug), [slug])
  const images = useMockApi<ProductImage[]>(
    () => getProductImages(slug),
    [slug]
  )

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [qty, setQty] = React.useState(1)
  const [adding, setAdding] = React.useState(false)

  // Default to the first available variation once they load.
  React.useEffect(() => {
    if (!variations.data || variations.data.length === 0) return
    const firstAvailable =
      variations.data.find((v) => v.is_available) ?? variations.data[0]
    setSelectedId(firstAvailable.id)
  }, [variations.data])

  const selected: ProductVariation | null = React.useMemo(() => {
    if (!variations.data || !selectedId) return null
    return variations.data.find((v) => v.id === selectedId) ?? null
  }, [variations.data, selectedId])

  // Snap quantity to the selected variation's MOQ when it changes.
  React.useEffect(() => {
    if (selected) setQty(selected.effective_moq)
  }, [selected])

  const isCustomer = user?.role === "customer"

  const handleAdd = async () => {
    if (!selected) return
    if (!selected.is_available) {
      toast.error("This item is out of stock")
      return
    }
    if (qty < selected.effective_moq) {
      toast.error(`Minimum order quantity is ${selected.effective_moq}`)
      return
    }
    if (qty > selected.stock_quantity) {
      toast.error(`Only ${selected.stock_quantity} units in stock`)
      return
    }
    setAdding(true)
    // useCart.addItem surfaces its own success/error toast.
    await addItem(selected.id, qty)
    setAdding(false)
  }

  if (product.loading || variations.loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <DetailSkeleton />
      </div>
    )
  }

  if (product.error || !product.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ErrorState
          message={product.error ?? "Product not found"}
          onRetry={product.refetch}
        />
      </div>
    )
  }

  const p = product.data
  const vs = variations.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/catalog">
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          {images.loading ? (
            <Skeleton className="aspect-square w-full rounded-2xl" />
          ) : (
            <ImageGallery images={images.data ?? []} alt={p.name} />
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Link
              href={`/catalog?category=${p.category_id}`}
              className="inline-block"
            >
              <Badge variant="secondary">{p.category.name}</Badge>
            </Link>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {p.name}
            </h1>
            <p className="text-muted-foreground">{p.description}</p>
          </div>

          {p.uses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.uses.map((use) => (
                <Badge key={use.id} variant="outline">
                  {use.name}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Price + stock for the selected variation */}
          {selected ? (
            <div className="space-y-1">
              <p className="font-heading text-3xl font-semibold text-primary">
                {formatCurrency(selected.price)}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Package className="size-3.5" />
                  MOQ {selected.effective_moq}
                </span>
                {selected.is_available ? (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Check className="size-3.5" />
                    {selected.stock_quantity} in stock
                  </span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
                <span>SKU {selected.sku}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a variation to see pricing.
            </p>
          )}

          {/* Variations */}
          {vs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Choose a variation</p>
              <VariationSelector
                variations={vs}
                selectedId={selectedId}
                onSelect={(v) => setSelectedId(v.id)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No variations are currently listed for this product.
            </p>
          )}

          {/* Quantity + add to cart */}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center rounded-lg border border-border">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Decrease quantity"
                    disabled={qty <= selected.effective_moq}
                    onClick={() =>
                      setQty((q) => Math.max(selected.effective_moq, q - 1))
                    }
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-12 text-center text-sm font-medium tabular-nums">
                    {qty}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Increase quantity"
                    disabled={qty >= selected.stock_quantity}
                    onClick={() =>
                      setQty((q) => Math.min(selected.stock_quantity, q + 1))
                    }
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {isCustomer ? (
                <Button
                  size="lg"
                  className={cn("w-full sm:w-auto")}
                  disabled={!selected.is_available || adding}
                  onClick={handleAdd}
                >
                  <ShoppingCart className="size-4" />
                  {adding ? "Adding…" : "Add to cart"}
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/login">Sign in to order</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spec tabs */}
      <div className="mt-14">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <GlassCard className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <GlassCard className="p-6">
              {selected ? (
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <SpecRow
                    label="Material"
                    value={selected.material?.name ?? "—"}
                  />
                  <SpecRow
                    label="Weight"
                    value={
                      selected.weight_grams != null
                        ? `${selected.weight_grams} g`
                        : "—"
                    }
                  />
                  <SpecRow label="SKU" value={selected.sku} />
                  <SpecRow
                    label="Min. order qty"
                    value={String(selected.effective_moq)}
                  />
                  {selected.attribute_values.map((av) => (
                    <SpecRow
                      key={av.id}
                      label={av.attribute.name}
                      value={av.value}
                    />
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a variation to view specifications.
                </p>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="delivery" className="mt-6">
            <GlassCard className="space-y-3 p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Truck className="size-4" />
                </span>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Nationwide delivery</p>
                  <p className="text-muted-foreground">
                    Delivered across Ghana. Fees and estimated times are
                    calculated at checkout based on your delivery region and
                    chosen option.
                  </p>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}
