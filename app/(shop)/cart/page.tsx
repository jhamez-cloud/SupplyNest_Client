"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Tag, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { useCart } from "@/hooks/use-cart"
import { useMockApi } from "@/hooks/use-mock-api"
import { getDeliveryOptions, validateCoupon } from "@/lib/mock-api"
import { cn, formatCurrency } from "@/lib/utils"
import { productImageUrl } from "@/lib/product-images"
import type { CartItem, CouponValidationResult } from "@/lib/types"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { OrderSummary } from "@/components/cart/order-summary"
import { QuantityStepper } from "@/components/cart/quantity-stepper"
import { saveCheckoutSelection } from "@/components/cart/checkout-store"

// Builds the human-readable variation label from its attribute values +
// material (e.g. "Kraft · Brown · Snap Lid").
function variationLabel(item: CartItem): string {
  const parts: string[] = []
  if (item.variation.material?.name) parts.push(item.variation.material.name)
  for (const av of item.variation.attribute_values) parts.push(av.value)
  return parts.length ? parts.join(" · ") : item.variation.sku
}

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const router = useRouter()

  const {
    data: deliveryOptions,
    loading: optionsLoading,
    error: optionsError,
    refetch: refetchOptions,
  } = useMockApi(() => getDeliveryOptions(), [])

  const [couponCode, setCouponCode] = React.useState("")
  const [couponResult, setCouponResult] =
    React.useState<CouponValidationResult | null>(null)
  const [validating, setValidating] = React.useState(false)
  const [selectedOptionId, setSelectedOptionId] = React.useState<number | null>(
    null
  )

  const items = cart?.items ?? []

  const subtotal = React.useMemo(
    () =>
      Number(
        items
          .reduce((sum, i) => sum + i.variation.price * i.quantity, 0)
          .toFixed(2)
      ),
    [items]
  )

  // Default to the first delivery option once they load.
  React.useEffect(() => {
    if (
      selectedOptionId === null &&
      deliveryOptions &&
      deliveryOptions.length > 0
    ) {
      setSelectedOptionId(deliveryOptions[0].id)
    }
  }, [deliveryOptions, selectedOptionId])

  const selectedOption =
    deliveryOptions?.find((o) => o.id === selectedOptionId) ?? null

  // Zone-based fees can't be known until we have a delivery address, so we
  // defer them to checkout and mark the preview as pending.
  const deliveryFeePending = selectedOption?.fee_type === "zone_based"
  const deliveryFee = deliveryFeePending
    ? null
    : (selectedOption?.flat_fee ?? 0)

  const discount =
    couponResult?.valid && couponResult.discount_amount
      ? Math.min(couponResult.discount_amount, subtotal)
      : 0

  const total = Number((subtotal - discount + (deliveryFee ?? 0)).toFixed(2))

  async function handleApplyCoupon(event: React.FormEvent) {
    event.preventDefault()
    const code = couponCode.trim()
    if (!code) return
    setValidating(true)
    try {
      const result = await validateCoupon(code, subtotal)
      setCouponResult(result)
      if (result.valid) {
        toast.success(result.message ?? "Coupon applied")
      } else {
        toast.error(result.message ?? "Coupon is not valid")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not validate coupon"
      )
    } finally {
      setValidating(false)
    }
  }

  function clearCoupon() {
    setCouponResult(null)
    setCouponCode("")
  }

  async function changeQuantity(item: CartItem, next: number) {
    const min = item.variation.effective_moq
    const max = item.variation.stock_quantity
    if (next < min) {
      toast.error(`Minimum order is ${min} for this item`)
      return
    }
    if (next > max) {
      toast.error(`Only ${max} in stock`)
      return
    }
    await updateItem(item.variation_id, next)
  }

  function proceedToCheckout() {
    saveCheckoutSelection({
      couponCode: couponResult?.valid ? couponCode.trim() : undefined,
      deliveryOptionId: selectedOptionId ?? undefined,
    })
    router.push("/checkout")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold">Your cart</h1>
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the catalog and add some packaging to get started."
          action={{ label: "Shop catalog", href: "/catalog" }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Your cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {items.map((item) => {
            const min = item.variation.effective_moq
            const max = item.variation.stock_quantity
            return (
              <GlassCard key={item.id} className="flex gap-4 p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={productImageUrl(item.variation.product.slug, 160)}
                    alt={item.variation.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.variation.product.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {variationLabel(item)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove item"
                      onClick={() => removeItem(item.variation_id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <QuantityStepper
                      value={item.quantity}
                      min={min}
                      max={max}
                      onChange={(next) => changeQuantity(item, next)}
                    />
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(item.variation.price * item.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(item.variation.price)} each
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        <div className="space-y-4">
          {/* Coupon */}
          <GlassCard className="space-y-3 p-6">
            <Label htmlFor="coupon" className="flex items-center gap-1.5">
              <Tag className="size-4" /> Coupon code
            </Label>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  if (couponResult) setCouponResult(null)
                }}
                placeholder="Enter code"
                autoCapitalize="characters"
              />
              <Button type="submit" variant="outline" disabled={validating}>
                {validating ? "…" : "Apply"}
              </Button>
            </form>
            {couponResult && (
              <div
                className={cn(
                  "flex items-start justify-between gap-2 text-sm",
                  couponResult.valid ? "text-primary" : "text-destructive"
                )}
              >
                <span>{couponResult.message}</span>
                {couponResult.valid && (
                  <button
                    type="button"
                    onClick={clearCoupon}
                    aria-label="Remove coupon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
          </GlassCard>

          {/* Delivery option */}
          <GlassCard className="space-y-3 p-6">
            <p className="font-heading text-base font-semibold">
              Delivery option
            </p>
            {optionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : optionsError ? (
              <ErrorState message={optionsError} onRetry={refetchOptions} />
            ) : deliveryOptions && deliveryOptions.length > 0 ? (
              <RadioGroup
                value={selectedOptionId?.toString() ?? ""}
                onValueChange={(v) => setSelectedOptionId(Number(v))}
                className="gap-2"
              >
                {deliveryOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`opt-${option.id}`}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors",
                      selectedOptionId === option.id &&
                        "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        id={`opt-${option.id}`}
                        value={option.id.toString()}
                      />
                      <div>
                        <p className="text-sm font-medium">{option.name}</p>
                        {option.description && (
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {option.fee_type === "flat"
                        ? option.flat_fee
                          ? formatCurrency(option.flat_fee)
                          : "Free"
                        : "Zone-based"}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                No delivery options available.
              </p>
            )}
          </GlassCard>

          <OrderSummary
            subtotal={subtotal}
            discount={discount}
            deliveryFee={deliveryFee}
            total={total}
            deliveryFeePending={deliveryFeePending}
          >
            <Separator className="my-1" />
            <Button
              className="w-full"
              onClick={proceedToCheckout}
              disabled={!selectedOptionId}
            >
              Proceed to checkout
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/catalog">Continue shopping</Link>
            </Button>
          </OrderSummary>
        </div>
      </div>
    </div>
  )
}
