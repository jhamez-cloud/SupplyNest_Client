// Tiny framework-free store to carry the chosen coupon + delivery option from
// the cart to checkout. Backed by sessionStorage so it survives the client-side
// navigation but clears when the tab closes. Guarded for SSR (no window).

export interface CheckoutSelection {
  couponCode?: string
  deliveryOptionId?: number
}

const KEY = "supplynest:checkout-selection"

export function saveCheckoutSelection(selection: CheckoutSelection): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(selection))
  } catch {
    // Ignore quota / privacy-mode failures — checkout falls back to defaults.
  }
}

export function readCheckoutSelection(): CheckoutSelection {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CheckoutSelection
    return {
      couponCode:
        typeof parsed.couponCode === "string" ? parsed.couponCode : undefined,
      deliveryOptionId:
        typeof parsed.deliveryOptionId === "number"
          ? parsed.deliveryOptionId
          : undefined,
    }
  } catch {
    return {}
  }
}

export function clearCheckoutSelection(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // No-op.
  }
}
