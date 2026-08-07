import * as React from "react"
import Link from "next/link"
import { Package } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-xs space-y-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="size-4" />
            </span>
            <span className="font-heading text-base font-semibold">
              SupplyNest
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Sustainable packaging and drinkware, delivered across Ghana.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <p className="font-medium">Shop</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="/catalog" className="hover:text-foreground">
                  All products
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?in_stock=true"
                  className="hover:text-foreground"
                >
                  In stock
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Account</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="/orders" className="hover:text-foreground">
                  My orders
                </Link>
              </li>
              <li>
                <Link href="/accounts/me" className="hover:text-foreground">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Company</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>Accra · Kumasi</li>
              <li>hello@supplynest.gh</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-muted-foreground sm:px-6">
          © 2026 SupplyNest. A demo storefront — data is simulated.
        </p>
      </div>
    </footer>
  )
}
