"use client"

// Cart context. Reads/writes through the mock API so cart state survives reloads
// (persisted per customer in localStorage by lib/mock-api.ts).

import * as React from "react"
import { toast } from "sonner"

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/mock-api"
import type { Cart } from "@/lib/types"

import { useAuth } from "./use-auth"

interface CartContextValue {
  cart: Cart | null
  loading: boolean
  itemCount: number
  addItem: (variationId: string, quantity: number) => Promise<boolean>
  updateItem: (variationId: string, quantity: number) => Promise<void>
  removeItem: (variationId: string) => Promise<void>
  refresh: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = React.useState<Cart | null>(null)
  const [loading, setLoading] = React.useState(false)

  const isCustomer = user?.role === "customer"

  const refresh = React.useCallback(() => {
    if (!isCustomer) {
      setCart(null)
      return
    }
    setLoading(true)
    getCart()
      .then(setCart)
      .catch(() => setCart(null))
      .finally(() => setLoading(false))
  }, [isCustomer])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const addItem = React.useCallback(
    async (variationId: string, quantity: number) => {
      try {
        const next = await addCartItem(variationId, quantity)
        setCart(next)
        toast.success("Added to cart")
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not add item")
        return false
      }
    },
    []
  )

  const updateItem = React.useCallback(
    async (variationId: string, quantity: number) => {
      try {
        const next = await updateCartItem(variationId, quantity)
        setCart(next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update")
      }
    },
    []
  )

  const removeItem = React.useCallback(async (variationId: string) => {
    try {
      const next = await removeCartItem(variationId)
      setCart(next)
      toast.success("Removed from cart")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove")
    }
  }, [])

  const itemCount = React.useMemo(
    () => cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [cart]
  )

  const value = React.useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      refresh,
    }),
    [cart, loading, itemCount, addItem, updateItem, removeItem, refresh]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return ctx
}
