"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, MapPin, Plus } from "lucide-react"
import { toast } from "sonner"

import { useCart } from "@/hooks/use-cart"
import { useMockApi } from "@/hooks/use-mock-api"
import {
  confirmPaymentMock,
  createOrder,
  getAddresses,
  getDeliveryOptions,
  getDeliveryZones,
  getPaymentStatus,
  initiatePayment,
  validateCoupon,
} from "@/lib/mock-api"
import { cn, formatCurrency } from "@/lib/utils"
import type { Address, DeliveryOption } from "@/lib/types"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { OrderSummary } from "@/components/cart/order-summary"
import {
  clearCheckoutSelection,
  readCheckoutSelection,
} from "@/components/cart/checkout-store"

const GATEWAYS = [
  { id: "paystack", name: "Paystack", hint: "Card · Mobile Money" },
  { id: "flutterwave", name: "Flutterwave", hint: "Card · Bank · MoMo" },
] as const

type GatewayId = (typeof GATEWAYS)[number]["id"]

export default function CheckoutPage() {
  const { cart, loading: cartLoading, removeItem, refresh } = useCart()
  const router = useRouter()

  const {
    data: addresses,
    loading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useMockApi(() => getAddresses(), [])

  const {
    data: deliveryOptions,
    loading: optionsLoading,
    error: optionsError,
    refetch: refetchOptions,
  } = useMockApi(() => getDeliveryOptions(), [])

  const { data: zones } = useMockApi(() => getDeliveryZones(), [])

  const [selection] = React.useState(() => readCheckoutSelection())
  const [selectedAddressId, setSelectedAddressId] = React.useState<
    string | null
  >(null)
  const [gateway, setGateway] = React.useState<GatewayId>("paystack")
  const [notes, setNotes] = React.useState("")
  const [placing, setPlacing] = React.useState(false)
  const [discount, setDiscount] = React.useState(0)

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

  // Re-validate the coupon carried from the cart against the current subtotal.
  React.useEffect(() => {
    let active = true
    if (!selection.couponCode || subtotal <= 0) {
      setDiscount(0)
      return
    }
    validateCoupon(selection.couponCode, subtotal)
      .then((result) => {
        if (!active) return
        setDiscount(
          result.valid && result.discount_amount
            ? Math.min(result.discount_amount, subtotal)
            : 0
        )
      })
      .catch(() => active && setDiscount(0))
    return () => {
      active = false
    }
  }, [selection.couponCode, subtotal])

  // Default the address to the customer's default (or first) address.
  React.useEffect(() => {
    if (selectedAddressId === null && addresses && addresses.length > 0) {
      const preferred = addresses.find((a) => a.is_default) ?? addresses[0]
      setSelectedAddressId(preferred.id)
    }
  }, [addresses, selectedAddressId])

  const selectedOption: DeliveryOption | null =
    deliveryOptions?.find((o) => o.id === selection.deliveryOptionId) ??
    deliveryOptions?.[0] ??
    null

  const selectedAddress: Address | null =
    addresses?.find((a) => a.id === selectedAddressId) ?? null

  // Delivery fee: flat fee directly, otherwise the base fee of the zone that
  // serves the chosen address's region (mirrors createOrder's server logic).
  const deliveryFee = React.useMemo(() => {
    if (!selectedOption) return 0
    if (selectedOption.fee_type === "flat") return selectedOption.flat_fee ?? 0
    if (!zones || zones.length === 0 || !selectedAddress) return null
    const zone =
      zones.find((z) => z.regions.includes(selectedAddress.region)) ??
      zones[zones.length - 1]
    return zone.base_fee
  }, [selectedOption, zones, selectedAddress])

  const total = Number((subtotal - discount + (deliveryFee ?? 0)).toFixed(2))

  async function placeOrder() {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address")
      return
    }
    if (!selectedOption) {
      toast.error("Please choose a delivery option")
      return
    }
    setPlacing(true)
    try {
      const order = await createOrder({
        deliveryAddressId: selectedAddressId,
        deliveryOptionId: selectedOption.id,
        couponCode: selection.couponCode,
        notes: notes.trim() || undefined,
      })

      // Kick off payment then confirm via the (mock) server-side webhook —
      // never assume success purely on the redirect.
      await initiatePayment(order.order_number, gateway)
      await confirmPaymentMock(order.order_number)

      const status = await getPaymentStatus(order.order_number)
      if (status !== "paid") {
        toast.error("Payment could not be confirmed. Please try again.")
        setPlacing(false)
        return
      }

      // Clear the local cart to reflect the order the server already emptied.
      for (const item of items) {
        await removeItem(item.variation_id)
      }
      refresh()
      clearCheckoutSelection()

      toast.success("Payment confirmed — order placed!")
      router.push(
        `/checkout/confirmation?order=${encodeURIComponent(order.order_number)}`
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not place your order"
      )
      setPlacing(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold">Checkout</h1>
        <EmptyState
          icon={CreditCard}
          title="Nothing to check out"
          description="Your cart is empty. Add some items before checking out."
          action={{ label: "Shop catalog", href: "/catalog" }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* Delivery address */}
          <GlassCard className="space-y-3 p-6">
            <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
              <MapPin className="size-4" /> Delivery address
            </p>
            {addressesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : addressesError ? (
              <ErrorState message={addressesError} onRetry={refetchAddresses} />
            ) : addresses && addresses.length > 0 ? (
              <RadioGroup
                value={selectedAddressId ?? ""}
                onValueChange={setSelectedAddressId}
                className="gap-2"
              >
                {addresses.map((address) => (
                  <Label
                    key={address.id}
                    htmlFor={`addr-${address.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                      selectedAddressId === address.id &&
                        "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem
                      id={`addr-${address.id}`}
                      value={address.id}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">
                        {address.label ?? address.city}
                        {address.is_default && (
                          <span className="ml-2 text-xs text-primary">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}, {address.city},{" "}
                        {address.region}
                      </p>
                      {address.landmark && (
                        <p className="text-xs text-muted-foreground">
                          Near {address.landmark}
                        </p>
                      )}
                    </div>
                  </Label>
                ))}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-fit"
                >
                  <Link href="/accounts/me">
                    <Plus className="size-4" /> Manage addresses
                  </Link>
                </Button>
              </RadioGroup>
            ) : (
              <EmptyState
                icon={MapPin}
                title="No delivery address"
                description="Add a delivery address to continue with checkout."
                action={{ label: "Add address", href: "/accounts/me" }}
              />
            )}
          </GlassCard>

          {/* Order items (unit_price snapshot displayed as-is) */}
          <GlassCard className="space-y-3 p-6">
            <p className="font-heading text-base font-semibold">Your items</p>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.variation.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.quantity} × {formatCurrency(item.variation.price)}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(item.variation.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Delivery option summary */}
          <GlassCard className="space-y-2 p-6">
            <p className="font-heading text-base font-semibold">Delivery</p>
            {optionsLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : optionsError ? (
              <ErrorState message={optionsError} onRetry={refetchOptions} />
            ) : selectedOption ? (
              <p className="text-sm text-muted-foreground">
                {selectedOption.name}
                {selectedOption.description
                  ? ` — ${selectedOption.description}`
                  : ""}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No delivery option selected.
              </p>
            )}
          </GlassCard>

          {/* Order notes */}
          <GlassCard className="space-y-2 p-6">
            <Label htmlFor="notes">Order notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions, preferred times…"
              rows={3}
            />
          </GlassCard>
        </div>

        <div className="space-y-4">
          {/* Mock payment gateway */}
          <GlassCard className="space-y-3 p-6">
            <p className="flex items-center gap-1.5 font-heading text-base font-semibold">
              <CreditCard className="size-4" /> Payment method
            </p>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as GatewayId)}
              className="gap-2"
            >
              {GATEWAYS.map((g) => (
                <Label
                  key={g.id}
                  htmlFor={`gw-${g.id}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                    gateway === g.id && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem id={`gw-${g.id}`} value={g.id} />
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.hint}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </GlassCard>

          <OrderSummary
            subtotal={subtotal}
            discount={discount}
            deliveryFee={deliveryFee}
            total={total}
          >
            <Separator className="my-1" />
            <Button
              className="w-full"
              onClick={placeOrder}
              disabled={placing || !selectedAddressId || !selectedOption}
            >
              {placing ? "Processing payment…" : `Pay ${formatCurrency(total)}`}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/cart">Back to cart</Link>
            </Button>
          </OrderSummary>
        </div>
      </div>
    </div>
  )
}
