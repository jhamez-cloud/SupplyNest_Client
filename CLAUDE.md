# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: This is a modified Next.js

Per `AGENTS.md`, this project uses a Next.js version (16.2.6) with **breaking changes vs. what's in your training data** — APIs, conventions, and file structure may differ. Before writing any Next.js code (routing, data fetching, config, server/client components), read the relevant guide under `node_modules/next/dist/docs/` (e.g. `01-app/`, `03-architecture/`). Heed deprecation notices there rather than relying on prior knowledge.

## Commands

```bash
npm run dev        # start dev server (Next.js)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (flat config, eslint-config-next)
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write over **/*.{ts,tsx}
```

There is no test runner configured.

## Adding UI components

shadcn/ui is configured (`components.json`, style `radix-nova`, base color `zinc`, RSC + TSX enabled, lucide icons). Add components with:

```bash
npx shadcn@latest add <name>   # e.g. button — lands in components/ui/
```

## Architecture

This repo is the **frontend client only** for a packaging-delivery e-commerce platform. `package.json` names it `client`.

- **App Router** app under `app/` — `layout.tsx` (root, fonts + `ThemeProvider`) and `page.tsx`. Global styles in `app/globals.css` (Tailwind v4, no separate tailwind config file — configured via CSS).
- **Path aliases** (`tsconfig.json` + `components.json`): `@/*` → repo root. Conventional locations: `@/components`, `@/components/ui`, `@/lib` (e.g. `@/lib/utils` exports `cn`), `@/hooks`.
- **Theming**: `components/theme-provider.tsx` wraps `next-themes` (class attribute, system default). It also registers a global hotkey — pressing **`d`** toggles dark mode (ignored while typing in inputs). `html` uses `suppressHydrationWarning`.
- **Fonts**: loaded via `next/font/google` in the root layout and exposed as CSS variables (`--font-sans` Public Sans, `--font-heading` Figtree, `--font-mono` Geist Mono).

### Backend contract

`backend-api-docs.md` is the **design reference for the separate Django/DRF backend** (models, fields, relationships, REST endpoints) — it is a spec, not code in this repo, and there is no backend implementation here. Use it as the source of truth for API shapes when building data-fetching and typing the client. Key domains and their endpoint prefixes: `accounts` (`/accounts/me/...`), `catalog` (`/catalog/products/...`), `orders` (cart + `/orders/...`), `delivery`, `promotions`, `payments`, `notifications`.

Important backend semantics that affect the client:
- Auth is Firebase ID-token based, mapped to a local `Customer`.
- `ProductVariation` is the sellable SKU (color/lid/material/etc. combinations); `is_available` and `effective_moq` are derived, not stored.
- `OrderItem.unit_price` is a snapshot at order time — display it as-is, never recompute from live prices.
- Payment success is confirmed by a server-side webhook, not a client "success" callback — poll `GET /payments/{order_number}/status/` rather than assuming success on redirect.
