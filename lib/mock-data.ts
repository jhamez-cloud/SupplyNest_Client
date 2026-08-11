// Single source of truth for all mock data. Mirrors backend-api-docs.md.
// Consumed ONLY via lib/mock-api.ts — never import this directly in pages.

import type {
  Address,
  Attribute,
  AttributeValue,
  Category,
  Coupon,
  Customer,
  DeliveryOption,
  DeliveryZone,
  Giveaway,
  Material,
  NotificationLog,
  Order,
  Product,
  ProductImage,
  ProductVariation,
  Promotion,
  Shipment,
  UseCase,
} from "@/lib/types"
import { productImageUrl } from "@/lib/product-images"

// --- Materials ---
export const materials: Material[] = [
  { id: 1, name: "Paper" },
  { id: 2, name: "PLA" },
  { id: 3, name: "Stainless Steel" },
  { id: 4, name: "PP Plastic" },
  { id: 5, name: "Bagasse" },
]

// --- Use cases ---
export const useCases: UseCase[] = [
  { id: 1, name: "Hot beverages" },
  { id: 2, name: "Takeaway food" },
  { id: 3, name: "Retail packaging" },
  { id: 4, name: "Cold drinks" },
]

// --- Categories (parent/child tree) ---
export const categories: Category[] = [
  {
    id: 1,
    name: "Food Packaging",
    slug: "food-packaging",
    children: [
      { id: 4, name: "Cups", slug: "cups", parent_id: 1 },
      { id: 5, name: "Containers", slug: "containers", parent_id: 1 },
    ],
  },
  {
    id: 2,
    name: "Drinkware",
    slug: "drinkware",
    children: [{ id: 6, name: "Tumblers", slug: "tumblers", parent_id: 2 }],
  },
  {
    id: 3,
    name: "Retail & Shopping",
    slug: "retail-shopping",
    children: [{ id: 7, name: "Bags", slug: "bags", parent_id: 3 }],
  },
]

const flatCategories: Category[] = [
  ...categories,
  ...categories.flatMap((c) => c.children ?? []),
]

export const findCategory = (id: number): Category =>
  flatCategories.find((c) => c.id === id) ?? flatCategories[0]

// --- Attributes + values ---
export const attributes: Attribute[] = [
  { id: 1, name: "Color", code: "color" },
  { id: 2, name: "Lid type", code: "lid_type" },
  { id: 3, name: "Height", code: "height" },
  { id: 4, name: "Size", code: "size" },
]

const av = (
  id: number,
  attribute_id: number,
  value: string
): AttributeValue => ({
  id,
  attribute_id,
  attribute: attributes.find((a) => a.id === attribute_id)!,
  value,
})

export const attributeValues: AttributeValue[] = [
  av(1, 1, "Red"),
  av(2, 1, "Black"),
  av(3, 1, "White"),
  av(4, 1, "Natural"),
  av(5, 2, "With lid"),
  av(6, 2, "No lid"),
  av(7, 3, "12cm"),
  av(8, 3, "20cm"),
  av(9, 4, "8oz"),
  av(10, 4, "12oz"),
  av(11, 4, "16oz"),
  av(12, 4, "Small"),
  av(13, 4, "Large"),
]

// --- Products ---
const mkProduct = (
  id: number,
  name: string,
  slug: string,
  categoryId: number,
  useIds: number[],
  description: string,
  default_moq: number,
  is_featured = false
): Product => ({
  id: `prod-${id}`,
  name,
  slug,
  description,
  category_id: categoryId,
  category: findCategory(categoryId),
  uses: useCases.filter((u) => useIds.includes(u.id)),
  default_moq,
  is_active: true,
  is_featured,
  created_at: "2026-01-15T09:00:00Z",
  updated_at: "2026-07-20T09:00:00Z",
})

export const products: Product[] = [
  mkProduct(
    1,
    "16oz Double-Wall Paper Cup",
    "16oz-double-wall-paper-cup",
    4,
    [1, 2],
    "Insulated double-wall paper cup for hot beverages. Compostable, leak-resistant, and printable for branding.",
    100,
    true
  ),
  mkProduct(
    2,
    "Stanley-Style 20oz Tumbler",
    "stanley-style-20oz-tumbler",
    6,
    [1, 4],
    "Vacuum-insulated stainless steel tumbler that keeps drinks hot for 6 hours or cold for 12. Powder-coated finish.",
    24,
    true
  ),
  mkProduct(
    3,
    "Kraft Takeaway Box (Medium)",
    "kraft-takeaway-box-medium",
    5,
    [2, 3],
    "Grease-resistant kraft board container with secure fold-lock lid. Ideal for takeaway meals.",
    200
  ),
  mkProduct(
    4,
    "PLA Cold Cup 12oz",
    "pla-cold-cup-12oz",
    4,
    [4],
    "Crystal-clear plant-based PLA cup for cold drinks and smoothies. Fully compostable.",
    100,
    true
  ),
  mkProduct(
    5,
    "Bagasse Clamshell 9-inch",
    "bagasse-clamshell-9-inch",
    5,
    [2],
    "Sturdy sugarcane-fibre clamshell with three compartments. Microwave and freezer safe.",
    250
  ),
  mkProduct(
    6,
    "Paper Shopping Bag (Twist Handle)",
    "paper-shopping-bag-twist-handle",
    7,
    [3],
    "Premium kraft shopping bag with reinforced twist handles. Retail-ready and recyclable.",
    150
  ),
  mkProduct(
    7,
    "PP Deli Container 32oz",
    "pp-deli-container-32oz",
    5,
    [2, 3],
    "Reusable polypropylene container with airtight lid. Dishwasher and microwave safe.",
    120
  ),
  mkProduct(
    8,
    "8oz Espresso Paper Cup",
    "8oz-espresso-paper-cup",
    4,
    [1],
    "Compact single-wall cup sized for espresso and cortado service.",
    200
  ),
  mkProduct(
    9,
    "Insulated Travel Mug 12oz",
    "insulated-travel-mug-12oz",
    6,
    [1],
    "Leak-proof stainless travel mug with flip-lock lid and soft-touch grip.",
    36,
    true
  ),
  mkProduct(
    10,
    "Recycled Mailer Bag (Small)",
    "recycled-mailer-bag-small",
    7,
    [3],
    "Opaque recycled-content mailer with self-seal strip and tear-off return strip.",
    300
  ),
  mkProduct(
    11,
    "PLA Straw (Wrapped)",
    "pla-straw-wrapped",
    4,
    [4],
    "Individually wrapped compostable PLA straws. Heat-tolerant to 45°C.",
    500
  ),
  mkProduct(
    12,
    "Kraft Soup Container 16oz",
    "kraft-soup-container-16oz",
    5,
    [2],
    "Double-poly-lined kraft container with vented lid for hot soups and stews.",
    150
  ),
]

export const findProduct = (id: string): Product =>
  products.find((p) => p.id === id) ?? products[0]

// --- Product variations (the sellable SKUs) ---
let variationSeq = 0

const mkVariation = (
  productId: string,
  sku: string,
  materialId: number | undefined,
  avIds: number[],
  price: number,
  stock: number,
  opts: { moq?: number; weight?: number; active?: boolean } = {}
): ProductVariation => {
  variationSeq += 1
  const product = findProduct(productId)
  const is_active = opts.active ?? true
  return {
    id: `var-${variationSeq}`,
    product_id: productId,
    product,
    sku,
    material_id: materialId,
    material: materials.find((m) => m.id === materialId),
    attribute_values: attributeValues.filter((a) => avIds.includes(a.id)),
    price,
    moq: opts.moq,
    stock_quantity: stock,
    low_stock_threshold: 20,
    is_active,
    weight_grams: opts.weight,
    is_available: is_active && stock > 0,
    effective_moq: opts.moq ?? product.default_moq,
  }
}

export const variations: ProductVariation[] = [
  // 1: 16oz paper cup — color x lid
  mkVariation("prod-1", "PC16-WL-WHT", 1, [3, 5, 11], 0.42, 4200, {
    weight: 14,
  }),
  mkVariation("prod-1", "PC16-NL-KFT", 1, [4, 6, 11], 0.38, 1800, {
    weight: 13,
  }),
  // 2: tumbler — color
  mkVariation("prod-2", "TUM20-BLK", 3, [2], 18.5, 320, {
    moq: 24,
    weight: 360,
  }),
  mkVariation("prod-2", "TUM20-RED", 3, [1], 18.5, 12, {
    moq: 24,
    weight: 360,
  }),
  mkVariation("prod-2", "TUM20-WHT", 3, [3], 19.0, 0, {
    moq: 24,
    weight: 360,
  }),
  // 3: kraft box
  mkVariation("prod-3", "KTB-MED", 1, [12], 0.55, 6000, { weight: 40 }),
  // 4: PLA cold cup — size
  mkVariation("prod-4", "PLA12-CLR", 2, [10], 0.48, 3400, { weight: 12 }),
  mkVariation("prod-4", "PLA16-CLR", 2, [11], 0.54, 2100, { weight: 15 }),
  // 5: bagasse clamshell
  mkVariation("prod-5", "BAG-CL9", 5, [], 0.62, 5200, { weight: 55 }),
  // 6: shopping bag — size
  mkVariation("prod-6", "PSB-SM", 1, [12], 0.7, 2600, { weight: 45 }),
  mkVariation("prod-6", "PSB-LG", 1, [13], 0.95, 1500, { weight: 70 }),
  // 7: PP deli container
  mkVariation("prod-7", "PPD-32", 4, [], 0.85, 40, { weight: 48 }),
  // 8: espresso cup
  mkVariation("prod-8", "PC08-WHT", 1, [3, 6], 0.3, 8000, { weight: 8 }),
  // 9: travel mug — color
  mkVariation("prod-9", "TM12-BLK", 3, [2], 14.0, 210, {
    moq: 36,
    weight: 280,
  }),
  mkVariation("prod-9", "TM12-RED", 3, [1], 14.0, 90, { moq: 36, weight: 280 }),
  // 10: mailer bag
  mkVariation("prod-10", "MB-SM", 4, [12], 0.22, 12000, { weight: 6 }),
  // 11: PLA straw
  mkVariation("prod-11", "STR-PLA", 2, [], 0.05, 50000, { weight: 2 }),
  // 12: soup container
  mkVariation("prod-12", "KSC-16", 1, [], 0.6, 3100, { weight: 42 }),
  // an inactive variation to exercise availability logic
  mkVariation("prod-12", "KSC-16-OLD", 1, [], 0.5, 500, { active: false }),
]

export const variationsForProduct = (productId: string): ProductVariation[] =>
  variations.filter((v) => v.product_id === productId)

export const findVariation = (id: string): ProductVariation | undefined =>
  variations.find((v) => v.id === id)

// --- Product images ---
export const productImages: ProductImage[] = products.flatMap((p, i) => {
  const primary: ProductImage = {
    id: i * 3 + 1,
    product_id: p.id,
    image: productImageUrl(p.slug),
    is_primary: true,
  }
  const alt: ProductImage = {
    id: i * 3 + 2,
    product_id: p.id,
    image: productImageUrl(p.slug, 600, true),
    is_primary: false,
  }
  return [primary, alt]
})

export const imagesForProduct = (productId: string): ProductImage[] =>
  productImages.filter((pi) => pi.product_id === productId)

// --- Customers (keyed by the demo-auth uid) ---
export const customers: Customer[] = [
  {
    id: "cust-individual-001",
    firebase_uid: "cust-individual-001",
    email: "demo.customer@packaging.com",
    phone_number: "+233 24 123 4567",
    full_name: "Ama Mensah",
    customer_type: "individual",
    is_active: true,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
  },
  {
    id: "cust-business-001",
    firebase_uid: "cust-business-001",
    email: "demo.business@packaging.com",
    phone_number: "+233 20 987 6543",
    full_name: "Kwame Osei",
    customer_type: "business",
    business_name: "Osei Catering Ltd",
    is_active: true,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-07-15T10:00:00Z",
  },
]

export const findCustomer = (id: string): Customer =>
  customers.find((c) => c.id === id) ?? customers[0]

// --- Addresses ---
export const addresses: Address[] = [
  {
    id: "addr-1",
    customer_id: "cust-individual-001",
    label: "Home",
    region: "Greater Accra",
    city: "Accra",
    street_address: "12 Oxford Street, Osu",
    landmark: "Near Koala Shopping Centre",
    is_default: true,
  },
  {
    id: "addr-2",
    customer_id: "cust-individual-001",
    label: "Office",
    region: "Greater Accra",
    city: "Accra",
    street_address: "5 Liberation Road, Airport City",
    is_default: false,
  },
  {
    id: "addr-3",
    customer_id: "cust-business-001",
    label: "Warehouse",
    region: "Ashanti",
    city: "Kumasi",
    street_address: "Plot 7, Suame Industrial Area",
    landmark: "Opposite Magazine",
    is_default: true,
  },
]

export const addressesForCustomer = (customerId: string): Address[] =>
  addresses.filter((a) => a.customer_id === customerId)

// --- Delivery zones ---
export const deliveryZones: DeliveryZone[] = [
  {
    id: 1,
    name: "Accra Metro",
    regions: ["Greater Accra"],
    base_fee: 15,
    estimated_days_min: 1,
    estimated_days_max: 2,
    is_active: true,
  },
  {
    id: 2,
    name: "Kumasi",
    regions: ["Ashanti"],
    base_fee: 25,
    estimated_days_min: 2,
    estimated_days_max: 4,
    is_active: true,
  },
  {
    id: 3,
    name: "Other Regions",
    regions: ["Western", "Central", "Northern", "Volta", "Eastern"],
    base_fee: 40,
    estimated_days_min: 3,
    estimated_days_max: 7,
    is_active: true,
  },
]

// --- Delivery options ---
export const deliveryOptions: DeliveryOption[] = [
  {
    id: 1,
    name: "Standard",
    description: "Zone-based delivery, 1-7 business days",
    fee_type: "zone_based",
    is_active: true,
  },
  {
    id: 2,
    name: "Express",
    description: "Next-day delivery within Accra Metro",
    fee_type: "flat",
    flat_fee: 45,
    is_active: true,
  },
  {
    id: 3,
    name: "Pickup",
    description: "Collect from our Accra or Kumasi depot",
    fee_type: "flat",
    flat_fee: 0,
    is_active: true,
  },
]

export const findDeliveryOption = (id: number): DeliveryOption =>
  deliveryOptions.find((o) => o.id === id) ?? deliveryOptions[0]

// --- Promotions ---
export const promotions: Promotion[] = [
  {
    id: 1,
    name: "Rainy Season Sale",
    promotion_type: "discount",
    description: "10% off all cups and cold drinkware this season.",
    start_date: "2026-07-01T00:00:00Z",
    end_date: "2026-09-30T23:59:59Z",
    is_active: true,
  },
  {
    id: 2,
    name: "Bulk Buyer Giveaway",
    promotion_type: "giveaway",
    description: "Free PLA straws with orders above GHS 500.",
    start_date: "2026-08-01T00:00:00Z",
    end_date: "2026-08-31T23:59:59Z",
    is_active: true,
  },
]

// --- Coupons ---
export const coupons: Coupon[] = [
  {
    id: 1,
    promotion_id: 1,
    code: "RAINY10",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value: 100,
    applicable_categories: [],
    applicable_products: [],
    usage_limit_total: 500,
    usage_limit_per_customer: 2,
    expiry_date: "2026-09-30T23:59:59Z",
    is_active: true,
  },
  {
    id: 2,
    code: "WELCOME50",
    discount_type: "fixed",
    discount_value: 50,
    min_order_value: 300,
    applicable_categories: [],
    applicable_products: [],
    usage_limit_per_customer: 1,
    expiry_date: "2026-12-31T23:59:59Z",
    is_active: true,
  },
]

export const findCoupon = (code: string): Coupon | undefined =>
  coupons.find((c) => c.code.toLowerCase() === code.toLowerCase())

// --- Giveaways ---
export const giveaways: Giveaway[] = [
  {
    id: 1,
    promotion_id: 2,
    variation_id: "var-17",
    variation: findVariation("var-17")!,
    quantity_available: 200,
    conditions: "Free with orders above GHS 500",
  },
]

// --- Orders ---
let orderItemSeq = 0
let historySeq = 0

interface OrderSeed {
  n: string
  customerId: string
  addressId: string
  optionId: number
  status: OrderStatusType
  payment: PaymentStatusType
  couponId?: number
  items: Array<[string, number]> // [variationId, quantity]
  placed: string
}

type OrderStatusType = Order["status"]
type PaymentStatusType = Order["payment_status"]

const STATUS_FLOW: Record<OrderStatusType, OrderStatusType[]> = {
  pending: ["pending"],
  confirmed: ["pending", "confirmed"],
  processing: ["pending", "confirmed", "processing"],
  out_for_delivery: ["pending", "confirmed", "processing", "out_for_delivery"],
  delivered: [
    "pending",
    "confirmed",
    "processing",
    "out_for_delivery",
    "delivered",
  ],
  cancelled: ["pending", "cancelled"],
  refunded: ["pending", "confirmed", "cancelled", "refunded"],
}

const buildOrder = (seed: OrderSeed): Order => {
  const items = seed.items.map(([variationId, quantity]) => {
    orderItemSeq += 1
    const variation = findVariation(variationId)!
    const unit_price = variation.price
    return {
      id: orderItemSeq,
      order_id: seed.n,
      variation_id: variationId,
      variation,
      quantity,
      unit_price,
      subtotal: Number((unit_price * quantity).toFixed(2)),
    }
  })

  const subtotal = Number(
    items.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2)
  )
  const coupon = seed.couponId
    ? coupons.find((c) => c.id === seed.couponId)
    : undefined
  const discount_amount = coupon
    ? coupon.discount_type === "percentage"
      ? Number(((subtotal * coupon.discount_value) / 100).toFixed(2))
      : coupon.discount_value
    : 0
  const option = findDeliveryOption(seed.optionId)
  const address = addresses.find((a) => a.id === seed.addressId)!
  const zone =
    deliveryZones.find((z) => z.regions.includes(address.region)) ??
    deliveryZones[2]
  const delivery_fee =
    option.fee_type === "flat" ? (option.flat_fee ?? 0) : zone.base_fee
  const total_amount = Number(
    (subtotal - discount_amount + delivery_fee).toFixed(2)
  )

  const status_history = STATUS_FLOW[seed.status].map((status, idx) => {
    historySeq += 1
    return {
      id: historySeq,
      order_id: seed.n,
      status,
      changed_at: new Date(
        new Date(seed.placed).getTime() + idx * 36e5
      ).toISOString(),
    }
  })

  return {
    id: seed.n,
    order_number: seed.n,
    customer_id: seed.customerId,
    customer: findCustomer(seed.customerId),
    delivery_address_id: seed.addressId,
    delivery_address: address,
    delivery_option_id: seed.optionId,
    delivery_option: option,
    coupon_id: seed.couponId,
    coupon,
    status: seed.status,
    payment_status: seed.payment,
    subtotal,
    discount_amount,
    delivery_fee,
    total_amount,
    placed_at: seed.placed,
    updated_at: seed.placed,
    items,
    status_history,
  }
}

const orderSeeds: OrderSeed[] = [
  {
    n: "PK-20260805-0012",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 2,
    status: "pending",
    payment: "unpaid",
    items: [["var-1", 200]],
    placed: "2026-08-05T08:30:00Z",
  },
  {
    n: "PK-20260803-0009",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 1,
    status: "confirmed",
    payment: "paid",
    couponId: 1,
    items: [
      ["var-7", 150],
      ["var-13", 200],
    ],
    placed: "2026-08-03T14:10:00Z",
  },
  {
    n: "PK-20260801-0007",
    customerId: "cust-individual-001",
    addressId: "addr-2",
    optionId: 1,
    status: "processing",
    payment: "paid",
    items: [["var-9", 300]],
    placed: "2026-08-01T09:45:00Z",
  },
  {
    n: "PK-20260729-0005",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 1,
    status: "out_for_delivery",
    payment: "paid",
    items: [
      ["var-3", 24],
      ["var-1", 100],
    ],
    placed: "2026-07-29T11:20:00Z",
  },
  {
    n: "PK-20260722-0003",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 2,
    status: "delivered",
    payment: "paid",
    couponId: 2,
    items: [
      ["var-6", 250],
      ["var-10", 300],
    ],
    placed: "2026-07-22T16:00:00Z",
  },
  {
    n: "PK-20260715-0002",
    customerId: "cust-individual-001",
    addressId: "addr-2",
    optionId: 3,
    status: "cancelled",
    payment: "refunded",
    items: [["var-4", 24]],
    placed: "2026-07-15T10:30:00Z",
  },
  {
    n: "PK-20260710-0001",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 1,
    status: "refunded",
    payment: "refunded",
    items: [["var-14", 36]],
    placed: "2026-07-10T13:15:00Z",
  },
  {
    n: "PK-20260728-0006",
    customerId: "cust-individual-001",
    addressId: "addr-1",
    optionId: 1,
    status: "delivered",
    payment: "paid",
    items: [["var-8", 100]],
    placed: "2026-07-28T08:00:00Z",
  },
  {
    n: "PK-20260802-0008",
    customerId: "cust-business-001",
    addressId: "addr-3",
    optionId: 1,
    status: "processing",
    payment: "paid",
    couponId: 1,
    items: [
      ["var-6", 500],
      ["var-9", 250],
    ],
    placed: "2026-08-02T09:00:00Z",
  },
  {
    n: "PK-20260725-0004",
    customerId: "cust-business-001",
    addressId: "addr-3",
    optionId: 1,
    status: "delivered",
    payment: "paid",
    items: [["var-17", 1000]],
    placed: "2026-07-25T09:00:00Z",
  },
]

export const orders: Order[] = orderSeeds.map(buildOrder)

export const ordersForCustomer = (customerId: string): Order[] =>
  orders.filter((o) => o.customer_id === customerId)

export const findOrder = (orderNumber: string): Order | undefined =>
  orders.find((o) => o.order_number === orderNumber)

// --- Shipments (for orders that have shipped) ---
const mkShipment = (
  orderNumber: string,
  zoneId: number,
  tracking: string,
  currentStatus: string,
  events: Array<[string, string, string, string]> // status, location, desc, when
): Shipment => ({
  id: `ship-${orderNumber}`,
  order_id: orderNumber,
  zone_id: zoneId,
  zone: deliveryZones.find((z) => z.id === zoneId)!,
  tracking_number: tracking,
  carrier: "SupplyNest Logistics",
  current_status: currentStatus,
  estimated_delivery_date: "2026-08-07",
  actual_delivery_date:
    currentStatus === "Delivered" ? "2026-07-30" : undefined,
  tracking_events: events.map(([status, location, description, when], i) => ({
    id: i + 1,
    shipment_id: `ship-${orderNumber}`,
    status,
    location,
    description,
    occurred_at: when,
  })),
})

export const shipments: Shipment[] = [
  mkShipment("PK-20260729-0005", 1, "SNL-4471-AC", "Out for delivery", [
    [
      "Picked up",
      "Accra Depot",
      "Parcel collected from warehouse",
      "2026-07-29T18:00:00Z",
    ],
    [
      "In transit",
      "Accra Sorting Hub",
      "Sorted for local delivery",
      "2026-07-30T07:30:00Z",
    ],
    [
      "Out for delivery",
      "Osu",
      "With courier for final delivery",
      "2026-07-30T09:00:00Z",
    ],
  ]),
  mkShipment("PK-20260722-0003", 1, "SNL-4390-AC", "Delivered", [
    ["Picked up", "Accra Depot", "Parcel collected", "2026-07-22T18:00:00Z"],
    [
      "Out for delivery",
      "Airport City",
      "With courier",
      "2026-07-23T08:00:00Z",
    ],
    [
      "Delivered",
      "Airport City",
      "Received by customer",
      "2026-07-23T11:45:00Z",
    ],
  ]),
]

export const shipmentForOrder = (orderNumber: string): Shipment | undefined =>
  shipments.find((s) => s.order_id === orderNumber)

// --- Notification logs ---
export const notifications: NotificationLog[] = [
  {
    id: "ntf-1",
    customer_id: "cust-individual-001",
    order_id: "PK-20260805-0012",
    channel: "email",
    event_type: "order_placed",
    status: "sent",
    payload: { message: "Your order PK-20260805-0012 has been placed." },
    sent_at: "2026-08-05T08:31:00Z",
  },
  {
    id: "ntf-2",
    customer_id: "cust-individual-001",
    order_id: "PK-20260729-0005",
    channel: "sms",
    event_type: "shipment_out_for_delivery",
    status: "sent",
    payload: { message: "Order PK-20260729-0005 is out for delivery." },
    sent_at: "2026-07-30T09:01:00Z",
  },
  {
    id: "ntf-3",
    customer_id: "cust-individual-001",
    channel: "push",
    event_type: "promo_alert",
    status: "sent",
    payload: { message: "Rainy Season Sale: 10% off all cups with RAINY10." },
    sent_at: "2026-07-25T12:00:00Z",
  },
  {
    id: "ntf-4",
    customer_id: "cust-individual-001",
    channel: "email",
    event_type: "product_restocked",
    status: "sent",
    payload: {
      message: "PP Deli Container 32oz is running low — restock soon.",
    },
    sent_at: "2026-07-20T10:00:00Z",
  },
  {
    id: "ntf-5",
    customer_id: "cust-business-001",
    order_id: "PK-20260802-0008",
    channel: "email",
    event_type: "order_placed",
    status: "sent",
    payload: { message: "Your order PK-20260802-0008 has been placed." },
    sent_at: "2026-08-02T09:01:00Z",
  },
]

export const notificationsForCustomer = (
  customerId: string
): NotificationLog[] =>
  notifications.filter((n) => n.customer_id === customerId)
