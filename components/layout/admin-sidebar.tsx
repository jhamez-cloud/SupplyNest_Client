"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Bell,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Moon,
  Package,
  ShoppingBag,
  Sun,
  Tag,
  Truck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/catalog", label: "Catalog", icon: Tag },
  { href: "/admin/promotions", label: "Promotions", icon: Bell },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <aside className="flex h-full w-full flex-col gap-1 bg-sidebar p-4 text-sidebar-foreground">
      <Link href="/admin" className="mb-4 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Package className="size-4" />
        </span>
        <span className="font-heading text-base font-semibold">
          SupplyNest
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            Admin
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {ADMIN_NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-2 space-y-1 border-t border-sidebar-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          Toggle theme
        </Button>
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="size-7">
            <AvatarFallback>
              {user?.email.charAt(0).toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
