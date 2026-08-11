// Mock API layer. Every function mirrors an endpoint in backend-api-docs.md.
// Swapping to the real backend = replacing these bodies with fetch() calls to
// a real baseURL. Page code and types stay identical.

import { getCurrentUser } from "@/lib/demo-auth"
import * as seed from "@/lib/mock-data"
import type {
  Address,
  Attribute,
  Cart,
  Category,
  Coupon,
  CouponValidationResult,
  Customer,
  DeliveryOption,
  DeliveryZone,
  Giveaway,
  Material,
  NotificationLog,
  Order,
  OrderStatus,
  PaymentInitResult,
  PaymentStatus,
  Product,
  ProductVariation,
  Promotion,
  Shipment,
  UseCase,
} from "@/lib/types"

// --- helpers ---------------------------------------------------------------

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const delay = (ms = 300 + Math.random() * 500) =>
  new Promise((resolve) => setTimeout(resolve, ms))

class ApiException extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = "ApiException"
  }
}

const log = (method: string, path: string) =>
  console.log(`[MOCK API] ${method} ${path}`)

// ~5% random failure so the UI can exercise error + retry states.
const maybeError = (path: string) => {
  if (Math.random() < 0.05) {
    throw new ApiException(500, `Network error while loading ${path}`)
  }
}

const requireAuth = () => {
  const user = getCurrentUser()
  if (!user) {
    throw new ApiException(403, "You must be signed in")
  }
  return user
}

const requireCustomer = (): Customer => {
  const user = requireAuth()
  if (user.role !== "customer") {
    throw new ApiException(403, "Customer account required")
  }
  return seed.findCustomer(user.uid)
}

const requireAdmin = () => {
  const user = requireAuth()
  if (user.role !== "admin") {
    throw new ApiException(403, "Admin access required")
  }
  return user
}

// --- runtime store (mutable copies so writes persist within a session) -----

const db = {
  products: clone(seed.products),
  variations: clone(seed.variations),
  categories: clone(seed.categories),
  attributes: clone(seed.attributes),
  materials: clone(seed.materials),
  useCases: clone(seed.useCases),
  deliveryZones: clone(seed.deliveryZones),
  deliveryOptions: clone(seed.deliveryOptions),
  promotions: clone(seed.promotions),
  coupons: clone(seed.coupons),
  giveaways: clone(seed.giveaways),
  orders: clone(seed.orders),
  customers: clone(seed.customers),
  addresses: clone(seed.addresses),
  notifications: clone(seed.notifications),
  shipments: clone(seed.shipments),
}

let orderCounter = db.orders.length

// --- cart (persisted per customer in localStorage) -------------------------

interface StoredCartItem {
  variation_id: string
  quantity: number
}

const cartKey = (uid: string) => `mock_cart_${uid}`

const readCart = (uid: string): StoredCartItem[] => {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(cartKey(uid)) ?? "[]")
  } catch {
    return []
  }
}

const writeCart = (uid: string, items: StoredCartItem[]) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(cartKey(uid), JSON.stringify(items))
}

const buildCart = (customer: Customer): Cart => {
  const stored = readCart(customer.id)
  const items = stored
    .map((s, idx) => {
      const variation = db.variations.find((v) => v.id === s.variation_id)
      if (!variation) return null
      return {
        id: idx + 1,
        cart_id: `cart-${customer.id}`,
        variation_id: s.variation_id,
        variation: clone(variation),
        quantity: s.quantity,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return {
    id: `cart-${customer.id}`,
    customer_id: customer.id,
    updated_at: new Date().toISOString(),
    items,
  }
}

// ===========================================================================
// catalog
// ===========================================================================

export interface ProductFilters {
  category?: number
  material?: number
  useCase?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  sort?: "price_asc" | "price_desc" | "name_asc" | "name_desc"
}

const priceOf = (product: Product): number => {
  const vs = db.variations.filter((v) => v.product_id === product.id)
  return vs.length ? Math.min(...vs.map((v) => v.price)) : 0
}

export async function getCategories(): Promise<Category[]> {
  log("GET", "/catalog/categories/")
  await delay()
  maybeError("/catalog/categories/")
  return clone(db.categories)
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<Product[]> {
  log("GET", "/catalog/products/")
  await delay()
  maybeError("/catalog/products/")

  let result = db.products.filter((p) => p.is_active)

  if (filters.category) {
    result = result.filter((p) => {
      const cat = p.category
      return (
        p.category_id === filters.category || cat.parent_id === filters.category
      )
    })
  }
  if (filters.material) {
    result = result.filter((p) =>
      db.variations.some(
        (v) => v.product_id === p.id && v.material_id === filters.material
      )
    )
  }
  if (filters.useCase) {
    result = result.filter((p) => p.uses.some((u) => u.id === filters.useCase))
  }
  if (filters.minPrice != null) {
    result = result.filter((p) => priceOf(p) >= filters.minPrice!)
  }
  if (filters.maxPrice != null) {
    result = result.filter((p) => priceOf(p) <= filters.maxPrice!)
  }
  if (filters.inStock) {
    result = result.filter((p) =>
      db.variations.some((v) => v.product_id === p.id && v.is_available)
    )
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
  }

  switch (filters.sort) {
    case "price_asc":
      result = [...result].sort((a, b) => priceOf(a) - priceOf(b))
      break
    case "price_desc":
      result = [...result].sort((a, b) => priceOf(b) - priceOf(a))
      break
    case "name_asc":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
      break
    case "name_desc":
      result = [...result].sort((a, b) => b.name.localeCompare(a.name))
      break
  }

  return clone(result)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  log("GET", "/catalog/products/?is_featured=true")
  await delay()
  maybeError("/catalog/products/")
  return clone(db.products.filter((p) => p.is_active && p.is_featured))
}

export async function getProductBySlug(slug: string): Promise<Product> {
  log("GET", `/catalog/products/${slug}/`)
  await delay()
  maybeError(`/catalog/products/${slug}/`)
  const product = db.products.find((p) => p.slug === slug)
  if (!product) {
    throw new ApiException(404, "Product not found")
  }
  return clone(product)
}

export async function getProductVariations(
  slug: string
): Promise<ProductVariation[]> {
  log("GET", `/catalog/products/${slug}/variations/`)
  await delay()
  maybeError(`/catalog/products/${slug}/variations/`)
  const product = db.products.find((p) => p.slug === slug)
  if (!product) {
    throw new ApiException(404, "Product not found")
  }
  return clone(db.variations.filter((v) => v.product_id === product.id))
}

export async function getProductImages(slug: string) {
  await delay(150)
  const product = db.products.find((p) => p.slug === slug)
  if (!product) throw new ApiException(404, "Product not found")
  return seed.imagesForProduct(product.id)
}

export async function getAttributes(): Promise<Attribute[]> {
  log("GET", "/catalog/attributes/")
  await delay()
  maybeError("/catalog/attributes/")
  return clone(db.attributes)
}

export async function getMaterials(): Promise<Material[]> {
  await delay()
  return clone(db.materials)
}

export async function getUseCases(): Promise<UseCase[]> {
  await delay()
  return clone(db.useCases)
}

// ===========================================================================
// accounts
// ===========================================================================

export async function getMe(): Promise<Customer> {
  log("GET", "/accounts/me/")
  await delay()
  return clone(requireCustomer())
}

export async function updateMe(patch: Partial<Customer>): Promise<Customer> {
  log("PATCH", "/accounts/me/")
  await delay()
  const customer = requireCustomer()
  const idx = db.customers.findIndex((c) => c.id === customer.id)
  db.customers[idx] = { ...db.customers[idx], ...patch }
  return clone(db.customers[idx])
}

export async function getAddresses(): Promise<Address[]> {
  log("GET", "/accounts/me/addresses/")
  await delay()
  maybeError("/accounts/me/addresses/")
  const customer = requireCustomer()
  return clone(db.addresses.filter((a) => a.customer_id === customer.id))
}

export async function addAddress(
  data: Omit<Address, "id" | "customer_id">
): Promise<Address> {
  log("POST", "/accounts/me/addresses/")
  await delay()
  const customer = requireCustomer()
  const address: Address = {
    ...data,
    id: `addr-${Date.now()}`,
    customer_id: customer.id,
  }
  if (address.is_default) {
    db.addresses
      .filter((a) => a.customer_id === customer.id)
      .forEach((a) => (a.is_default = false))
  }
  db.addresses.push(address)
  return clone(address)
}

export async function updateAddress(
  id: string,
  patch: Partial<Address>
): Promise<Address> {
  log("PATCH", `/accounts/me/addresses/${id}/`)
  await delay()
  const customer = requireCustomer()
  const idx = db.addresses.findIndex(
    (a) => a.id === id && a.customer_id === customer.id
  )
  if (idx === -1) throw new ApiException(404, "Address not found")
  if (patch.is_default) {
    db.addresses
      .filter((a) => a.customer_id === customer.id)
      .forEach((a) => (a.is_default = false))
  }
  db.addresses[idx] = { ...db.addresses[idx], ...patch }
  return clone(db.addresses[idx])
}

export async function deleteAddress(id: string): Promise<void> {
  log("DELETE", `/accounts/me/addresses/${id}/`)
  await delay()
  const customer = requireCustomer()
  const idx = db.addresses.findIndex(
    (a) => a.id === id && a.customer_id === customer.id
  )
  if (idx === -1) throw new ApiException(404, "Address not found")
  db.addresses.splice(idx, 1)
}

// ===========================================================================
// orders + cart
// ===========================================================================

export async function getCart(): Promise<Cart> {
  log("GET", "/orders/cart/")
  await delay()
  const customer = requireCustomer()
  return buildCart(customer)
}

export async function addCartItem(
  variationId: string,
  quantity: number
): Promise<Cart> {
  log("POST", "/orders/cart/items/")
  await delay()
  const customer = requireCustomer()
  const variation = db.variations.find((v) => v.id === variationId)
  if (!variation) throw new ApiException(404, "Variation not found")
  if (!variation.is_available) {
    throw new ApiException(400, "This item is out of stock")
  }
  if (quantity < variation.effective_moq) {
    throw new ApiException(
      400,
      `Minimum order quantity is ${variation.effective_moq}`
    )
  }
  if (quantity > variation.stock_quantity) {
    throw new ApiException(
      400,
      `Only ${variation.stock_quantity} units in stock`
    )
  }
  const items = readCart(customer.id)
  const existing = items.find((i) => i.variation_id === variationId)
  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ variation_id: variationId, quantity })
  }
  writeCart(customer.id, items)
  return buildCart(customer)
}

export async function updateCartItem(
  variationId: string,
  quantity: number
): Promise<Cart> {
  log("PATCH", `/orders/cart/items/${variationId}/`)
  await delay()
  const customer = requireCustomer()
  const variation = db.variations.find((v) => v.id === variationId)
  if (!variation) throw new ApiException(404, "Variation not found")
  if (quantity > variation.stock_quantity) {
    throw new ApiException(
      400,
      `Only ${variation.stock_quantity} units in stock`
    )
  }
  const items = readCart(customer.id)
  const existing = items.find((i) => i.variation_id === variationId)
  if (!existing) throw new ApiException(404, "Item not in cart")
  existing.quantity = quantity
  writeCart(customer.id, items)
  return buildCart(customer)
}

export async function removeCartItem(variationId: string): Promise<Cart> {
  log("DELETE", `/orders/cart/items/${variationId}/`)
  await delay()
  const customer = requireCustomer()
  const items = readCart(customer.id).filter(
    (i) => i.variation_id !== variationId
  )
  writeCart(customer.id, items)
  return buildCart(customer)
}

export async function createOrder(input: {
  deliveryAddressId: string
  deliveryOptionId: number
  couponCode?: string
  notes?: string
}): Promise<Order> {
  log("POST", "/orders/")
  await delay()
  const customer = requireCustomer()
  const cart = buildCart(customer)
  if (cart.items.length === 0) {
    throw new ApiException(400, "Your cart is empty")
  }
  const address = db.addresses.find((a) => a.id === input.deliveryAddressId)
  if (!address) throw new ApiException(404, "Delivery address not found")
  const option = db.deliveryOptions.find((o) => o.id === input.deliveryOptionId)
  if (!option) throw new ApiException(404, "Delivery option not found")

  const coupon = input.couponCode
    ? db.coupons.find(
        (c) =>
          c.code.toLowerCase() === input.couponCode!.toLowerCase() &&
          c.is_active
      )
    : undefined

  const items = cart.items.map((ci, idx) => ({
    id: idx + 1,
    order_id: "",
    variation_id: ci.variation_id,
    variation: ci.variation,
    quantity: ci.quantity,
    unit_price: ci.variation.price,
    subtotal: Number((ci.variation.price * ci.quantity).toFixed(2)),
  }))

  const subtotal = Number(
    items.reduce((s, it) => s + it.subtotal, 0).toFixed(2)
  )
  const discount_amount = coupon
    ? coupon.discount_type === "percentage"
      ? Number(((subtotal * coupon.discount_value) / 100).toFixed(2))
      : coupon.discount_value
    : 0
  const zone =
    db.deliveryZones.find((z) => z.regions.includes(address.region)) ??
    db.deliveryZones[db.deliveryZones.length - 1]
  const delivery_fee =
    option.fee_type === "flat" ? (option.flat_fee ?? 0) : zone.base_fee
  const total_amount = Number(
    (subtotal - discount_amount + delivery_fee).toFixed(2)
  )

  orderCounter += 1
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "")
  const orderNumber = `PK-${stamp}-${String(orderCounter).padStart(4, "0")}`
  items.forEach((it) => (it.order_id = orderNumber))

  const order: Order = {
    id: orderNumber,
    order_number: orderNumber,
    customer_id: customer.id,
    customer: clone(customer),
    delivery_address_id: address.id,
    delivery_address: clone(address),
    delivery_option_id: option.id,
    delivery_option: clone(option),
    coupon_id: coupon?.id,
    coupon: coupon ? clone(coupon) : undefined,
    status: "pending",
    payment_status: "unpaid",
    subtotal,
    discount_amount,
    delivery_fee,
    total_amount,
    notes: input.notes,
    placed_at: now.toISOString(),
    updated_at: now.toISOString(),
    items,
    status_history: [
      {
        id: 1,
        order_id: orderNumber,
        status: "pending",
        changed_at: now.toISOString(),
      },
    ],
  }

  db.orders.unshift(order)
  writeCart(customer.id, [])
  return clone(order)
}

export async function getOrders(): Promise<Order[]> {
  log("GET", "/orders/")
  await delay()
  maybeError("/orders/")
  const customer = requireCustomer()
  return clone(
    db.orders
      .filter((o) => o.customer_id === customer.id)
      .sort(
        (a, b) =>
          new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
      )
  )
}

export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  log("GET", `/orders/${orderNumber}/`)
  await delay()
  maybeError(`/orders/${orderNumber}/`)
  const user = requireAuth()
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  if (user.role === "customer" && order.customer_id !== user.uid) {
    throw new ApiException(403, "Not your order")
  }
  return clone(order)
}

export async function cancelOrder(orderNumber: string): Promise<Order> {
  log("POST", `/orders/${orderNumber}/cancel/`)
  await delay()
  const customer = requireCustomer()
  const order = db.orders.find(
    (o) => o.order_number === orderNumber && o.customer_id === customer.id
  )
  if (!order) throw new ApiException(404, "Order not found")
  if (order.status !== "pending" && order.status !== "confirmed") {
    throw new ApiException(400, "This order can no longer be cancelled")
  }
  order.status = "cancelled"
  order.status_history.push({
    id: order.status_history.length + 1,
    order_id: orderNumber,
    status: "cancelled",
    note: "Cancelled by customer",
    changed_at: new Date().toISOString(),
  })
  return clone(order)
}

// ===========================================================================
// delivery
// ===========================================================================

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  log("GET", "/delivery/zones/")
  await delay()
  maybeError("/delivery/zones/")
  return clone(db.deliveryZones)
}

export async function getDeliveryOptions(): Promise<DeliveryOption[]> {
  log("GET", "/delivery/options/")
  await delay()
  maybeError("/delivery/options/")
  return clone(db.deliveryOptions.filter((o) => o.is_active))
}

export async function getShipment(orderNumber: string): Promise<Shipment> {
  log("GET", `/orders/${orderNumber}/shipment/`)
  await delay()
  const shipment = db.shipments.find((s) => s.order_id === orderNumber)
  if (!shipment) throw new ApiException(404, "No shipment for this order yet")
  return clone(shipment)
}

// ===========================================================================
// promotions
// ===========================================================================

export async function getActivePromotions(): Promise<Promotion[]> {
  log("GET", "/promotions/active/")
  await delay()
  maybeError("/promotions/active/")
  return clone(db.promotions.filter((p) => p.is_active))
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  log("POST", "/promotions/coupons/validate/")
  await delay()
  const coupon = db.coupons.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  )
  if (!coupon || !coupon.is_active) {
    return { valid: false, message: "Invalid or expired coupon code" }
  }
  if (subtotal < coupon.min_order_value) {
    return {
      valid: false,
      message: `Requires a minimum order of GHS ${coupon.min_order_value}`,
    }
  }
  const discount_amount =
    coupon.discount_type === "percentage"
      ? Number(((subtotal * coupon.discount_value) / 100).toFixed(2))
      : coupon.discount_value
  return {
    valid: true,
    discount_amount,
    message: `Coupon applied — you save GHS ${discount_amount}`,
  }
}

// ===========================================================================
// payments
// ===========================================================================

export async function initiatePayment(
  orderNumber: string,
  gateway: string
): Promise<PaymentInitResult> {
  log("POST", "/payments/initiate/")
  await delay()
  requireCustomer()
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  return {
    authorization_url: `/checkout/pay?order=${orderNumber}&gateway=${gateway}`,
    reference: `${gateway.toUpperCase()}-${orderNumber}`,
  }
}

// Simulates the webhook flipping payment status (source of truth per API docs).
export async function confirmPaymentMock(orderNumber: string): Promise<Order> {
  log("POST", `/payments/webhooks/mock/ (${orderNumber})`)
  await delay()
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  order.payment_status = "paid"
  order.status = "confirmed"
  order.status_history.push({
    id: order.status_history.length + 1,
    order_id: orderNumber,
    status: "confirmed",
    note: "Payment confirmed",
    changed_at: new Date().toISOString(),
  })
  return clone(order)
}

export async function getPaymentStatus(
  orderNumber: string
): Promise<PaymentStatus> {
  log("GET", `/payments/${orderNumber}/status/`)
  await delay(200)
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  return order.payment_status
}

// ===========================================================================
// notifications
// ===========================================================================

export async function getNotifications(): Promise<NotificationLog[]> {
  log("GET", "/notifications/")
  await delay()
  maybeError("/notifications/")
  const customer = requireCustomer()
  return clone(db.notifications.filter((n) => n.customer_id === customer.id))
}

// ===========================================================================
// admin
// ===========================================================================

export interface AdminStats {
  totalOrders: number
  totalRevenue: number
  lowStockCount: number
  activeCustomers: number
  salesByDay: Array<{ label: string; value: number }>
}

export async function getAdminStats(): Promise<AdminStats> {
  log("GET", "/admin/stats/")
  await delay()
  requireAdmin()
  maybeError("/admin/stats/")
  const paidOrders = db.orders.filter((o) => o.payment_status === "paid")
  const totalRevenue = Number(
    paidOrders.reduce((s, o) => s + o.total_amount, 0).toFixed(2)
  )
  const lowStockCount = db.variations.filter(
    (v) => v.is_active && v.stock_quantity <= v.low_stock_threshold
  ).length
  const salesByDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
    (label, i) => ({
      label,
      value: Math.round((totalRevenue / 7) * (0.6 + ((i * 7) % 10) / 10)),
    })
  )
  return {
    totalOrders: db.orders.length,
    totalRevenue,
    lowStockCount,
    activeCustomers: db.customers.filter((c) => c.is_active).length,
    salesByDay,
  }
}

export async function getAllOrders(): Promise<Order[]> {
  log("GET", "/admin/orders/")
  await delay()
  requireAdmin()
  maybeError("/admin/orders/")
  return clone(
    [...db.orders].sort(
      (a, b) =>
        new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    )
  )
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  note?: string
): Promise<Order> {
  log("PATCH", `/admin/orders/${orderNumber}/`)
  await delay()
  requireAdmin()
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  order.status = status
  order.updated_at = new Date().toISOString()
  order.status_history.push({
    id: order.status_history.length + 1,
    order_id: orderNumber,
    status,
    note,
    changed_at: new Date().toISOString(),
  })
  return clone(order)
}

export async function assignTracking(
  orderNumber: string,
  trackingNumber: string
): Promise<Order> {
  log("PATCH", `/admin/orders/${orderNumber}/tracking/`)
  await delay()
  requireAdmin()
  const order = db.orders.find((o) => o.order_number === orderNumber)
  if (!order) throw new ApiException(404, "Order not found")
  const existing = db.shipments.find((s) => s.order_id === orderNumber)
  if (existing) {
    existing.tracking_number = trackingNumber
  } else {
    db.shipments.push({
      id: `ship-${orderNumber}`,
      order_id: orderNumber,
      zone_id: db.deliveryZones[0].id,
      zone: clone(db.deliveryZones[0]),
      tracking_number: trackingNumber,
      carrier: "SupplyNest Logistics",
      current_status: "Picked up",
      tracking_events: [],
    })
  }
  return clone(order)
}

export async function getAllProducts(): Promise<Product[]> {
  log("GET", "/admin/products/")
  await delay()
  requireAdmin()
  maybeError("/admin/products/")
  return clone(db.products)
}

export async function createProduct(
  data: Pick<
    Product,
    "name" | "slug" | "description" | "category_id" | "default_moq"
  > & { is_featured?: boolean }
): Promise<Product> {
  log("POST", "/admin/products/")
  await delay()
  requireAdmin()
  const product: Product = {
    id: `prod-${Date.now()}`,
    name: data.name,
    slug: data.slug,
    description: data.description,
    category_id: data.category_id,
    category: seed.findCategory(data.category_id),
    uses: [],
    default_moq: data.default_moq,
    is_active: true,
    is_featured: data.is_featured ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.products.unshift(product)
  return clone(product)
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product> {
  log("PATCH", `/admin/products/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.products.findIndex((p) => p.id === id)
  if (idx === -1) throw new ApiException(404, "Product not found")
  db.products[idx] = {
    ...db.products[idx],
    ...patch,
    category:
      patch.category_id != null
        ? seed.findCategory(patch.category_id)
        : db.products[idx].category,
    updated_at: new Date().toISOString(),
  }
  return clone(db.products[idx])
}

export async function deleteProduct(id: string): Promise<void> {
  log("DELETE", `/admin/products/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.products.findIndex((p) => p.id === id)
  if (idx === -1) throw new ApiException(404, "Product not found")
  db.products.splice(idx, 1)
}

export async function getVariationsForProduct(
  productId: string
): Promise<ProductVariation[]> {
  await delay()
  requireAdmin()
  return clone(db.variations.filter((v) => v.product_id === productId))
}

export async function getAllCustomers(): Promise<Customer[]> {
  log("GET", "/admin/customers/")
  await delay()
  requireAdmin()
  maybeError("/admin/customers/")
  return clone(db.customers)
}

export async function getOrdersForCustomer(
  customerId: string
): Promise<Order[]> {
  await delay()
  requireAdmin()
  return clone(db.orders.filter((o) => o.customer_id === customerId))
}

// Generic admin CRUD for the simpler catalog/promotion/delivery resources.
export async function getAdminPromotions(): Promise<Promotion[]> {
  await delay()
  requireAdmin()
  maybeError("/admin/promotions/")
  return clone(db.promotions)
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  await delay()
  requireAdmin()
  return clone(db.coupons)
}

export async function getAdminGiveaways(): Promise<Giveaway[]> {
  await delay()
  requireAdmin()
  return clone(db.giveaways)
}

export async function getAdminZones(): Promise<DeliveryZone[]> {
  await delay()
  requireAdmin()
  maybeError("/admin/delivery/zones/")
  return clone(db.deliveryZones)
}

export async function getAdminOptions(): Promise<DeliveryOption[]> {
  await delay()
  requireAdmin()
  return clone(db.deliveryOptions)
}

// --- admin catalog: categories --------------------------------------------

const nextId = (rows: { id: number }[]): number =>
  rows.reduce((max, r) => Math.max(max, r.id), 0) + 1

export async function createCategory(
  data: Pick<Category, "name" | "slug"> & { parent_id?: number }
): Promise<Category> {
  log("POST", "/admin/catalog/categories/")
  await delay()
  requireAdmin()
  const category: Category = {
    id: nextId(db.categories),
    name: data.name,
    slug: data.slug,
    parent_id: data.parent_id,
  }
  db.categories.push(category)
  return clone(category)
}

export async function updateCategory(
  id: number,
  patch: Partial<Category>
): Promise<Category> {
  log("PATCH", `/admin/catalog/categories/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.categories.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiException(404, "Category not found")
  db.categories[idx] = { ...db.categories[idx], ...patch, id }
  return clone(db.categories[idx])
}

export async function deleteCategory(id: number): Promise<void> {
  log("DELETE", `/admin/catalog/categories/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.categories.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiException(404, "Category not found")
  db.categories.splice(idx, 1)
}

// --- admin catalog: attributes --------------------------------------------

export async function getAdminAttributes(): Promise<Attribute[]> {
  await delay()
  requireAdmin()
  return clone(db.attributes)
}

export async function createAttribute(
  data: Pick<Attribute, "name" | "code">
): Promise<Attribute> {
  log("POST", "/admin/catalog/attributes/")
  await delay()
  requireAdmin()
  const attribute: Attribute = {
    id: nextId(db.attributes),
    name: data.name,
    code: data.code,
  }
  db.attributes.push(attribute)
  return clone(attribute)
}

export async function updateAttribute(
  id: number,
  patch: Partial<Attribute>
): Promise<Attribute> {
  log("PATCH", `/admin/catalog/attributes/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.attributes.findIndex((a) => a.id === id)
  if (idx === -1) throw new ApiException(404, "Attribute not found")
  db.attributes[idx] = { ...db.attributes[idx], ...patch, id }
  return clone(db.attributes[idx])
}

export async function deleteAttribute(id: number): Promise<void> {
  log("DELETE", `/admin/catalog/attributes/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.attributes.findIndex((a) => a.id === id)
  if (idx === -1) throw new ApiException(404, "Attribute not found")
  db.attributes.splice(idx, 1)
}

// --- admin promotions ------------------------------------------------------

export async function createPromotion(
  data: Pick<
    Promotion,
    "name" | "promotion_type" | "description" | "start_date" | "end_date"
  >
): Promise<Promotion> {
  log("POST", "/admin/promotions/")
  await delay()
  requireAdmin()
  const promotion: Promotion = {
    id: nextId(db.promotions),
    name: data.name,
    promotion_type: data.promotion_type,
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: true,
  }
  db.promotions.unshift(promotion)
  return clone(promotion)
}

export async function updatePromotion(
  id: number,
  patch: Partial<Promotion>
): Promise<Promotion> {
  log("PATCH", `/admin/promotions/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.promotions.findIndex((p) => p.id === id)
  if (idx === -1) throw new ApiException(404, "Promotion not found")
  db.promotions[idx] = { ...db.promotions[idx], ...patch, id }
  return clone(db.promotions[idx])
}

export async function deletePromotion(id: number): Promise<void> {
  log("DELETE", `/admin/promotions/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.promotions.findIndex((p) => p.id === id)
  if (idx === -1) throw new ApiException(404, "Promotion not found")
  db.promotions.splice(idx, 1)
}

export async function createCoupon(
  data: Pick<
    Coupon,
    | "code"
    | "discount_type"
    | "discount_value"
    | "min_order_value"
    | "usage_limit_per_customer"
    | "expiry_date"
  > & { promotion_id?: number; usage_limit_total?: number }
): Promise<Coupon> {
  log("POST", "/admin/coupons/")
  await delay()
  requireAdmin()
  const coupon: Coupon = {
    id: nextId(db.coupons),
    promotion_id: data.promotion_id,
    code: data.code,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    min_order_value: data.min_order_value,
    applicable_categories: [],
    applicable_products: [],
    usage_limit_total: data.usage_limit_total,
    usage_limit_per_customer: data.usage_limit_per_customer,
    expiry_date: data.expiry_date,
    is_active: true,
  }
  db.coupons.unshift(coupon)
  return clone(coupon)
}

export async function updateCoupon(
  id: number,
  patch: Partial<Coupon>
): Promise<Coupon> {
  log("PATCH", `/admin/coupons/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.coupons.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiException(404, "Coupon not found")
  db.coupons[idx] = { ...db.coupons[idx], ...patch, id }
  return clone(db.coupons[idx])
}

export async function deleteCoupon(id: number): Promise<void> {
  log("DELETE", `/admin/coupons/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.coupons.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiException(404, "Coupon not found")
  db.coupons.splice(idx, 1)
}

// --- admin delivery --------------------------------------------------------

export async function createZone(
  data: Pick<
    DeliveryZone,
    | "name"
    | "regions"
    | "base_fee"
    | "estimated_days_min"
    | "estimated_days_max"
  >
): Promise<DeliveryZone> {
  log("POST", "/admin/delivery/zones/")
  await delay()
  requireAdmin()
  const zone: DeliveryZone = {
    id: nextId(db.deliveryZones),
    name: data.name,
    regions: data.regions,
    base_fee: data.base_fee,
    estimated_days_min: data.estimated_days_min,
    estimated_days_max: data.estimated_days_max,
    is_active: true,
  }
  db.deliveryZones.push(zone)
  return clone(zone)
}

export async function updateZone(
  id: number,
  patch: Partial<DeliveryZone>
): Promise<DeliveryZone> {
  log("PATCH", `/admin/delivery/zones/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.deliveryZones.findIndex((z) => z.id === id)
  if (idx === -1) throw new ApiException(404, "Zone not found")
  db.deliveryZones[idx] = { ...db.deliveryZones[idx], ...patch, id }
  return clone(db.deliveryZones[idx])
}

export async function deleteZone(id: number): Promise<void> {
  log("DELETE", `/admin/delivery/zones/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.deliveryZones.findIndex((z) => z.id === id)
  if (idx === -1) throw new ApiException(404, "Zone not found")
  db.deliveryZones.splice(idx, 1)
}

export async function createOption(
  data: Pick<DeliveryOption, "name" | "fee_type"> & {
    description?: string
    flat_fee?: number
  }
): Promise<DeliveryOption> {
  log("POST", "/admin/delivery/options/")
  await delay()
  requireAdmin()
  const option: DeliveryOption = {
    id: nextId(db.deliveryOptions),
    name: data.name,
    description: data.description,
    fee_type: data.fee_type,
    flat_fee: data.flat_fee,
    is_active: true,
  }
  db.deliveryOptions.push(option)
  return clone(option)
}

export async function updateOption(
  id: number,
  patch: Partial<DeliveryOption>
): Promise<DeliveryOption> {
  log("PATCH", `/admin/delivery/options/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.deliveryOptions.findIndex((o) => o.id === id)
  if (idx === -1) throw new ApiException(404, "Option not found")
  db.deliveryOptions[idx] = { ...db.deliveryOptions[idx], ...patch, id }
  return clone(db.deliveryOptions[idx])
}

export async function deleteOption(id: number): Promise<void> {
  log("DELETE", `/admin/delivery/options/${id}/`)
  await delay()
  requireAdmin()
  const idx = db.deliveryOptions.findIndex((o) => o.id === id)
  if (idx === -1) throw new ApiException(404, "Option not found")
  db.deliveryOptions.splice(idx, 1)
}

export { ApiException }
