import * as React from "react"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { PageTransition } from "@/components/glassmorphic/page-transition"

// Shell for the customer shopping flow (cart + checkout). Both require a
// signed-in customer, so the whole group is wrapped in ProtectedRoute.
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute role="customer">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
