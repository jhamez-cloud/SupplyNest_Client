# Packaging Delivery Platform — Backend Design Docs (MVP)

This is a **model & API reference**, not code — you'll write the actual Django/DRF implementation yourself. Each section lists the fields, types, and relationships for a model, followed by the API resources for that app. Architecture and ERD are unchanged from before: modular monolith, apps as bounded contexts, Firebase-verified auth mapped to a local `Customer`.

Apps: `accounts` · `catalog` · `orders` · `delivery` · `promotions` · `payments` · `notifications`

---

## 1. `accounts`

### Customer
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| firebase_uid | string, unique, indexed | maps to Firebase ID token `uid` |
| email | email | |
| phone_number | string | |
| full_name | string | |
| customer_type | choice: `individual` / `business` | |
| business_name | string, optional | for business buyers |
| is_active | boolean | |
| created_at / updated_at | datetime | |

**Relationships:** 1—* Address, 1—1 Cart, 1—* Order, 1—* NotificationLog, 1—* CouponRedemption

### Address
| Field | Type | Notes |
|---|---|---|
| id | UUID/int (PK) | |
| customer | FK → Customer | |
| label | string, optional | "Office", "Warehouse" |
| region | string | e.g. Greater Accra |
| city | string | |
| street_address | string | |
| landmark | string, optional | |
| latitude / longitude | decimal, optional | |
| is_default | boolean | |

**Relationships:** *—1 Customer; referenced by Order (delivery_address)

### API resources
| Method & path | Purpose |
|---|---|
| `GET/PATCH /accounts/me/` | current customer profile |
| `GET/POST /accounts/me/addresses/` | list / add address |
| `GET/PATCH/DELETE /accounts/me/addresses/{id}/` | manage a specific address |

---

## 2. `catalog`

### Category
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string | |
| slug | slug, unique | |
| parent | FK → self, nullable | for subcategories |

**Relationships:** self —* children; 1—* Product

### Material
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string, unique | Paper, PLA, Stainless steel, PP plastic |

**Relationships:** 1—* ProductVariation

### UseCase
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string, unique | "Hot beverages", "Takeaway food", "Retail packaging" |

**Relationships:** *—* Product

### Product
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| name | string | e.g. "16oz Stanley-style tumbler" |
| slug | slug, unique | |
| description | text | |
| category | FK → Category | |
| uses | M2M → UseCase | |
| default_moq | integer | fallback MOQ if a variation doesn't override |
| is_active | boolean | |
| is_featured | boolean | |
| created_at / updated_at | datetime | |

**Relationships:** *—1 Category, *—* UseCase, 1—* ProductVariation, 1—* ProductImage (product-level images)

### Attribute
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string, unique | "Color", "Lid type", "Height" |
| code | slug, unique | `color`, `lid_type`, `height` |

**Relationships:** 1—* AttributeValue

### AttributeValue
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| attribute | FK → Attribute | |
| value | string | "Red", "With lid", "20cm" |
| — | unique_together(attribute, value) | |

**Relationships:** *—1 Attribute, *—* ProductVariation

### ProductVariation
*(the sellable SKU — this is where color/lid/height/material combinations live)*

| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| product | FK → Product | |
| sku | string, unique | |
| material | FK → Material, nullable | |
| attribute_values | M2M → AttributeValue | e.g. {Color: Red, Lid type: With lid} |
| price | decimal | |
| moq | integer, nullable | overrides `product.default_moq` when set |
| stock_quantity | integer | |
| low_stock_threshold | integer | |
| is_active | boolean | |
| weight_grams | integer, nullable | feeds delivery fee calc |
| *is_available* | derived, not stored | `is_active AND stock_quantity > 0` |
| *effective_moq* | derived, not stored | `moq or product.default_moq` |

**Relationships:** *—1 Product, *—1 Material, *—* AttributeValue, 1—* ProductImage, referenced by CartItem/OrderItem

### ProductImage
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| product | FK → Product, nullable | product-level image |
| variation | FK → ProductVariation, nullable | variation-specific image (e.g. the red one) |
| image | image file | |
| is_primary | boolean | |

**Relationships:** *—1 Product OR *—1 ProductVariation (exactly one should be set)

### API resources
| Method & path | Purpose |
|---|---|
| `GET /catalog/categories/` | list categories (tree) |
| `GET /catalog/products/` | list, filterable by category, material, use_case, price range, in_stock |
| `GET /catalog/products/{slug}/` | product detail incl. variation summary |
| `GET /catalog/products/{slug}/variations/` | all variations for a product |
| `GET /catalog/attributes/` | attribute + value list, for building filter UI |

---

## 3. `orders`

### Cart
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| customer | O2O → Customer | one active cart per customer |
| updated_at | datetime | |

**Relationships:** 1—1 Customer, 1—* CartItem

### CartItem
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| cart | FK → Cart | |
| variation | FK → ProductVariation | |
| quantity | integer | |
| — | unique_together(cart, variation) | |

**Relationships:** *—1 Cart, *—1 ProductVariation

### Order
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| order_number | string, unique | human-readable, e.g. `PK-20260805-0007` |
| customer | FK → Customer | |
| delivery_address | FK → Address | |
| delivery_option | FK → DeliveryOption | |
| coupon | FK → Coupon, nullable | |
| status | choice | pending / confirmed / processing / out_for_delivery / delivered / cancelled / refunded |
| payment_status | choice | unpaid / paid / failed / refunded |
| subtotal | decimal | |
| discount_amount | decimal | |
| delivery_fee | decimal | |
| total_amount | decimal | |
| notes | text, optional | |
| placed_at / updated_at | datetime | |

**Relationships:** *—1 Customer, Address, DeliveryOption, Coupon(optional); 1—* OrderItem, OrderStatusHistory, Transaction; 1—1 Shipment

### OrderItem
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| order | FK → Order | |
| variation | FK → ProductVariation | |
| quantity | integer | |
| unit_price | decimal | **snapshot** at order time — never recompute from live price |
| subtotal | decimal | |

**Relationships:** *—1 Order, *—1 ProductVariation

### OrderStatusHistory
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| order | FK → Order | |
| status | string | |
| note | string, optional | |
| changed_at | datetime | |

**Relationships:** *—1 Order

### API resources
| Method & path | Purpose |
|---|---|
| `GET /orders/cart/` | view current cart |
| `POST /orders/cart/items/` | add item |
| `PATCH/DELETE /orders/cart/items/{id}/` | update/remove item |
| `POST /orders/` | checkout — creates Order from Cart |
| `GET /orders/` | list customer's own orders |
| `GET /orders/{order_number}/` | order detail (items, status history) |
| `POST /orders/{order_number}/cancel/` | cancel (if status allows) |

---

## 4. `delivery`

### DeliveryZone
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string | "Accra Metro", "Kumasi", later "Nigeria (import)" |
| regions | JSON list | covered region/city names |
| base_fee | decimal | |
| estimated_days_min / max | integer | |
| is_active | boolean | |

**Relationships:** 1—* Shipment

### DeliveryOption
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string | "Standard", "Express", "Pickup" |
| description | string, optional | |
| fee_type | choice | `flat` / `zone_based` |
| flat_fee | decimal, nullable | used when fee_type = flat |
| is_active | boolean | |

**Relationships:** referenced by Order

### Shipment
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| order | O2O → Order | |
| zone | FK → DeliveryZone | |
| tracking_number | string, unique | |
| carrier | string, optional | |
| current_status | string | |
| estimated_delivery_date | date, nullable | |
| actual_delivery_date | date, nullable | |

**Relationships:** 1—1 Order, *—1 DeliveryZone, 1—* ShipmentTrackingEvent

### ShipmentTrackingEvent
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| shipment | FK → Shipment | |
| status | string | |
| location | string, optional | |
| description | string, optional | |
| occurred_at | datetime | |

**Relationships:** *—1 Shipment

### API resources
| Method & path | Purpose |
|---|---|
| `GET /delivery/zones/` | list zones + fees (for checkout fee calc) |
| `GET /delivery/options/` | list delivery options |
| `GET /orders/{order_number}/shipment/` | tracking detail + event history |

---

## 5. `promotions`

### Promotion
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| name | string | |
| promotion_type | choice | `discount` / `giveaway` / `bundle` |
| description | text | |
| start_date / end_date | datetime | |
| is_active | boolean | |

**Relationships:** 1—* Coupon, 1—* Giveaway

### Coupon
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| promotion | FK → Promotion, nullable | |
| code | string, unique | |
| discount_type | choice | `percentage` / `fixed` |
| discount_value | decimal | |
| min_order_value | decimal | |
| applicable_categories | M2M → Category | optional scoping |
| applicable_products | M2M → Product | optional scoping |
| usage_limit_total | integer, nullable | |
| usage_limit_per_customer | integer | |
| expiry_date | datetime | |
| is_active | boolean | |

**Relationships:** *—1 Promotion(optional), *—* Category/Product(optional), 1—* CouponRedemption, referenced by Order

### CouponRedemption
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| coupon | FK → Coupon | |
| customer | FK → Customer | |
| order | FK → Order | |
| redeemed_at | datetime | |

**Relationships:** *—1 Coupon, Customer, Order — used to enforce per-customer usage limits

### Giveaway
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| promotion | FK → Promotion | |
| variation | FK → ProductVariation | the free item |
| quantity_available | integer | |
| conditions | text | e.g. "free with orders above GHS 500" |

**Relationships:** *—1 Promotion, *—1 ProductVariation

### API resources
| Method & path | Purpose |
|---|---|
| `GET /promotions/active/` | currently running promotions/giveaways, for banners |
| `POST /promotions/coupons/validate/` | body: `{code, cart}` → returns discount amount or rejection reason |

---

## 6. `payments`

### Transaction
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| order | FK → Order | |
| gateway | string | `paystack`, `flutterwave`, etc. |
| reference | string, unique | gateway's transaction reference |
| amount | decimal | |
| currency | string(3) | default `GHS` |
| payment_method | string, optional | `card`, `momo`, `bank_transfer` |
| status | choice | pending / success / failed / refunded |
| gateway_response | JSON | raw payload for audit/debug |
| initiated_at | datetime | |
| completed_at | datetime, nullable | |

**Relationships:** *—1 Order, 1—* Refund

### Refund
| Field | Type | Notes |
|---|---|---|
| id | int (PK) | |
| transaction | FK → Transaction | |
| amount | decimal | |
| reason | string, optional | |
| status | string | |
| processed_at | datetime, nullable | |

**Relationships:** *—1 Transaction

### API resources
| Method & path | Purpose |
|---|---|
| `POST /payments/initiate/` | body: `{order_id, gateway}` → returns redirect/authorization URL |
| `POST /payments/webhooks/{gateway}/` | server-to-server callback, signature-verified, no user auth header |
| `GET /payments/{order_number}/status/` | poll payment status from frontend |

> Payment status must be confirmed via the webhook, not a client-side "success" call — the webhook is the source of truth that flips `Transaction.status` and then `Order.payment_status`.

---

## 7. `notifications`

### NotificationLog
| Field | Type | Notes |
|---|---|---|
| id | int/UUID (PK) | |
| customer | FK → Customer | |
| order | FK → Order, nullable | |
| channel | choice | `sms` / `email` / `push` |
| event_type | string | `order_placed`, `shipment_out_for_delivery`, `promo_alert`, `product_restocked` |
| status | string | pending / sent / failed |
| payload | JSON | rendered message content/metadata |
| sent_at | datetime, nullable | |

**Relationships:** *—1 Customer, *—1 Order(optional)

### API resources
| Method & path | Purpose |
|---|---|
| `GET /notifications/` | customer's own notification log |

> "Update customers of products" (new arrivals, restocks, price drops) is just a new `event_type` here, dispatched by a background job when `ProductVariation.stock_quantity` moves from 0 to positive, or a new `Product` is marked `is_featured` — no dedicated model needed.

---

## 8. Full relationship map (recap)

- Customer 1—* Address, Order, NotificationLog, CouponRedemption; 1—1 Cart
- Category self —* children; 1—* Product
- Product *—1 Category, *—* UseCase; 1—* ProductVariation, ProductImage
- Attribute 1—* AttributeValue
- ProductVariation *—1 Product, Material; *—* AttributeValue; 1—* ProductImage
- Cart 1—* CartItem *—1 ProductVariation
- Order *—1 Customer, Address, DeliveryOption, Coupon(opt); 1—* OrderItem, OrderStatusHistory, Transaction; 1—1 Shipment
- OrderItem *—1 Order, ProductVariation
- Shipment 1—1 Order, *—1 DeliveryZone, 1—* ShipmentTrackingEvent
- Promotion 1—* Coupon, Giveaway
- Coupon 1—* CouponRedemption; *—* Category, Product(opt)
- Giveaway *—1 Promotion, ProductVariation
- Transaction *—1 Order, 1—* Refund

Refer back to the ER diagram from earlier — it's the same shape, this file just spells out every field.
