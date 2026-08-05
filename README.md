# SupplyNest — Frontend Client

A demo storefront for **SupplyNest**, a Ghana-based packaging & drinkware delivery
platform. This repository is the **frontend client only** (Next.js 16 App Router).
It runs entirely against a **browser-side mock backend** — no server, no database, no
Firebase — so the whole app works offline. The mock layer is a drop-in shaped exactly
like the real Django/DRF + Firebase backend described in `backend-api-docs.md`, so it can
later be swapped for the real API without touching page code.

> This is a demo storefront — all data is simulated in your browser (localStorage +
> in-memory store). Refreshing keeps your cart and profile edits; clearing site data
> resets everything to the seed.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (Turbopack)
npm run start      # serve the production build
npm run lint       # eslint (flat config, eslint-config-next)
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write over **/*.{ts,tsx}
```

---

## Demo accounts

Sign in at **`/login`** — or click a one-tap demo button on that page.

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Customer (individual) | `demo.customer@packaging.com` | `Demo123!` | `/` |
| Customer (business) | `demo.business@packaging.com` | `Demo123!` | `/` |
| Admin | `admin@packaging.com` | `Admin123!` | `/admin` |

Auth is a mock Firebase session stored in `localStorage` (`lib/demo-auth.ts`). Customer
routes and the admin console are guarded client-side by `<ProtectedRoute>`.

Tip: press **`d`** anywhere (outside a text field) to toggle dark mode.

---

## What to try

- **Storefront** — Home `/`, browse the catalog `/catalog` (filter by category / material /
  use-case / price / in-stock, sort, all URL-synced so links are shareable), open a product
  such as `/catalog/16oz-double-wall-paper-cup` or `/catalog/pla-cold-cup-12oz`, pick a
  variation, and add to cart.
- **Cart & checkout** — `/cart` (quantity limited by MOQ + stock, apply a coupon, choose a
  delivery option) → `/checkout` (pick an address, pay via a mock gateway) →
  `/checkout/confirmation`. Payment is confirmed by a simulated **webhook**, matching the
  real backend's "poll for status, don't trust the redirect" contract.
- **Account** — `/orders`, an order detail with a live status/tracking timeline,
  `/accounts/me` (profile + address book), `/notifications`.
- **Admin console** — `/admin` dashboard (KPIs + a dependency-free bar chart), plus CRUD for
  products, orders (status + tracking), catalog (categories/attributes),
  promotions (promotions/coupons/giveaways), delivery (zones/options), and customers.

> The mock API injects a ~5% random failure and realistic latency on reads so you can see
> skeleton, empty, and error+retry states. Just retry — it'll succeed.

---

## Architecture

```
app/
  layout.tsx                     # root: fonts, ThemeProvider, AuthProvider, CartProvider, Toaster
  (auth)/login/                  # sign-in
  (public)/                      # Navbar + Footer shell — home, catalog, product detail
  (shop)/                        # customer-guarded — cart, checkout, confirmation
  (customer)/                    # customer-guarded — orders, order detail, profile, notifications
  admin/                         # admin-guarded — dashboard + management consoles
components/
  ui/                            # shadcn/ui primitives (radix-nova style, zinc, lucide)
  glassmorphic/                  # GlassCard, PageTransition, Stagger
  layout/                        # Navbar, Footer, AdminSidebar
  shared/                        # ProtectedRoute, DataTable, EmptyState, ErrorState,
                                 #   status badges, OrderTimeline, VariationSelector
  product/ cart/ order/ admin/   # feature components per route group
hooks/                           # use-auth, use-cart, use-mock-api, use-reduced-motion
lib/
  types.ts                       # TypeScript mirror of the backend contract
  mock-data.ts                   # seed data
  mock-api.ts                    # async functions, one per backend endpoint
  demo-auth.ts                   # mock Firebase session
  utils.ts                       # cn, formatCurrency (GHS), date/text helpers
```

### Swapping in the real backend

Everything the UI touches goes through two files:

- `lib/mock-api.ts` — each exported function mirrors one REST endpoint. Replace the bodies
  with `fetch()` calls to the real base URL; signatures and return types stay identical.
- `lib/demo-auth.ts` — replace the localStorage session with the real Firebase SDK and send
  the ID token as a bearer header from `mock-api.ts`.

Page components, hooks, and types do **not** change.

### UI feature → backend endpoint map

| UI feature | Mock API fn(s) | Backend endpoint (per `backend-api-docs.md`) |
|---|---|---|
| Home featured / promo | `getFeaturedProducts`, `getActivePromotions` | `GET /catalog/products/?featured`, `GET /promotions/` |
| Catalog + filters | `getProducts`, `getCategories`, `getMaterials`, `getUseCases` | `GET /catalog/products/`, `/catalog/categories/`, … |
| Product detail | `getProductBySlug`, `getProductVariations`, `getProductImages` | `GET /catalog/products/{slug}/` (+ variations, images) |
| Cart | `getCart`, `addCartItem`, `updateCartItem`, `removeCartItem` | `GET/POST/PATCH/DELETE /orders/cart/…` |
| Coupons | `validateCoupon` | `POST /promotions/coupons/validate/` |
| Checkout | `createOrder`, `getDeliveryOptions`, `getAddresses` | `POST /orders/`, `GET /delivery/options/`, `GET /accounts/me/addresses/` |
| Payment | `initiatePayment`, `getPaymentStatus` (+ webhook) | `POST /payments/initiate/`, `GET /payments/{order_number}/status/` |
| Orders | `getOrders`, `getOrderByNumber`, `cancelOrder`, `getShipment` | `GET /orders/…`, `GET /delivery/shipments/{order_number}/` |
| Profile / addresses | `getMe`, `updateMe`, `get/add/update/deleteAddress` | `/accounts/me/…` |
| Notifications | `getNotifications` | `GET /notifications/` |
| Admin dashboard | `getAdminStats`, `getAllOrders` | `GET /admin/stats/`, `GET /admin/orders/` |
| Admin products | `getAllProducts`, `create/update/deleteProduct`, `getVariationsForProduct` | `/catalog/products/` (admin) |
| Admin orders | `updateOrderStatus`, `assignTracking` | `PATCH /admin/orders/{n}/`, tracking |
| Admin catalog | `create/update/delete` category & attribute | `/catalog/…` (admin) |
| Admin promotions | `getAdmin{Promotions,Coupons,Giveaways}`, promotion/coupon CRUD | `/promotions/…` (admin) |
| Admin delivery | `getAdmin{Zones,Options}`, zone/option CRUD | `/delivery/…` (admin) |
| Admin customers | `getAllCustomers`, `getOrdersForCustomer` | `/accounts/…` (admin) |

---

## Conventions

- **Modified Next.js 16.2.6** — see `CLAUDE.md` and `AGENTS.md`. Notably: every data page is
  a **Client Component** (the mock API is browser-only); dynamic params are read via
  `useParams()`/`useSearchParams()`; images use `next/image` with `remotePatterns`.
- **Styling** — Tailwind v4 (CSS-configured in `app/globals.css`), shadcn/ui, a lime-green
  `primary` brand over zinc neutrals, and a glassmorphic surface (`GlassCard`).
- **Code style** — Prettier: no semicolons, double quotes, 2-space indent, 80-col.
  Run `npm run format` before committing.
- The three `react-hooks/*` React-Compiler advisories are set to **warn** (not error) in
  `eslint.config.mjs` — they flag effect-based data loading that is intrinsic to the
  client-side mock architecture, not bugs.
