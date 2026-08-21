"use client"

import * as React from "react"
import { Menu } from "lucide-react"

import { ProtectedRoute } from "@/components/shared/protected-route"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute role="admin">
      <div className="flex min-h-svh">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border md:block">
          <AdminSidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar with sheet trigger */}
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                <AdminSidebar />
              </SheetContent>
            </Sheet>
            <span className="font-heading text-base font-semibold">
              SupplyNest Admin
            </span>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
