// Type definitions mirroring backend-api-docs.md exactly

// Enums (string literals matching API choices)
export type CustomerType = "individual" | "business"
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded"
export type DiscountType = "percentage" | "fixed"
export type PromotionType = "discount" | "giveaway" | "bundle"
export type FeeType = "flat" | "zone_based"
export type NotificationChannel = "sms" | "email" | "push"
export type NotificationEvent =
  | "order_placed"
  | "shipment_out_for_delivery"
  | "promo_alert"
  | "product_restocked"

// accounts app
export interface Customer {
  id: string
  firebase_uid: string
  email: string
  phone_number: string
  full_name: string
  customer_type: CustomerType
  business_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  customer_id: string
  label?: string
  region: string
  city: string
  street_address: string
  landmark?: string
  latitude?: number
  longitude?: number
  is_default: boolean
}

// catalog app
export interface Category {
  id: number
  name: string
  slug: string
  parent_id?: number
  children?: Category[]
}

export interface Material {
  id: number
  name: string
}

export interface UseCase {
  id: number
  name: string
}

export interface Attribute {
  id: number
  name: string
  code: string
}

export interface AttributeValue {
  id: number
  attribute_id: number
  attribute: Attribute
  value: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_id: number
  category: Category
  uses: UseCase[]
  default_moq: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariation {
  id: string
  product_id: string
  product: Product
  sku: string
  material_id?: number
  material?: Material
  attribute_values: AttributeValue[]
  price: number
  moq?: number
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  weight_grams?: number
  is_available: boolean
  effective_moq: number
}

export interface ProductImage {
  id: number
  product_id?: string
  variation_id?: string
  image: string
  is_primary: boolean
}

// orders app
export interface Cart {
  id: string
  customer_id: string
  updated_at: string
  items: CartItem[]
}

export interface CartItem {
  id: number
  cart_id: string
  variation_id: string
  variation: ProductVariation
  quantity: number
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  customer: Customer
  delivery_address_id: string
  delivery_address: Address
  delivery_option_id: number
  delivery_option: DeliveryOption
  coupon_id?: number
  coupon?: Coupon
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  discount_amount: number
  delivery_fee: number
  total_amount: number
  notes?: string
  placed_at: string
  updated_at: string
  items: OrderItem[]
  status_history: OrderStatusHistory[]
}

export interface OrderItem {
  id: number
  order_id: string
  variation_id: string
  variation: ProductVariation
  quantity: number
  unit_price: number
  subtotal: number
}

export interface OrderStatusHistory {
  id: number
  order_id: string
  status: string
  note?: string
  changed_at: string
}

// delivery app
export interface DeliveryZone {
  id: number
  name: string
  regions: string[]
  base_fee: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
}

export interface DeliveryOption {
  id: number
  name: string
  description?: string
  fee_type: FeeType
  flat_fee?: number
  is_active: boolean
}

export interface Shipment {
  id: string
  order_id: string
  zone_id: number
  zone: DeliveryZone
  tracking_number: string
  carrier?: string
  current_status: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  tracking_events: ShipmentTrackingEvent[]
}

export interface ShipmentTrackingEvent {
  id: number
  shipment_id: string
  status: string
  location?: string
  description?: string
  occurred_at: string
}

// promotions app
export interface Promotion {
  id: number
  name: string
  promotion_type: PromotionType
  description: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface Coupon {
  id: number
  promotion_id?: number
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value: number
  applicable_categories: Category[]
  applicable_products: Product[]
  usage_limit_total?: number
  usage_limit_per_customer: number
  expiry_date: string
  is_active: boolean
}

export interface CouponRedemption {
  id: number
  coupon_id: number
  customer_id: string
  order_id: string
  redeemed_at: string
}

export interface Giveaway {
  id: number
  promotion_id: number
  variation_id: string
  variation: ProductVariation
  quantity_available: number
  conditions: string
}

// payments app
export interface Transaction {
  id: string
  order_id: string
  gateway: string
  reference: string
  amount: number
  currency: string
  payment_method?: string
  status: PaymentStatus
  gateway_response: Record<string, unknown>
  initiated_at: string
  completed_at?: string
}

export interface Refund {
  id: number
  transaction_id: string
  amount: number
  reason?: string
  status: string
  processed_at?: string
}

// notifications app
export interface NotificationLog {
  id: string
  customer_id: string
  order_id?: string
  channel: NotificationChannel
  event_type: NotificationEvent
  status: string
  payload: Record<string, unknown>
  sent_at?: string
}

// Auth types
export interface AuthUser {
  uid: string
  email: string
  role: "customer" | "admin"
  customer_type?: CustomerType
}

// API response wrappers
export interface ApiError {
  message: string
  code?: number
  details?: Record<string, unknown>
}

export interface CouponValidationResult {
  valid: boolean
  discount_amount?: number
  message?: string
}

export interface PaymentInitResult {
  authorization_url: string
  reference: string
}
