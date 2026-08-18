"use client"

import * as React from "react"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { PageTransition } from "@/components/glassmorphic/page-transition"

// Shell for the authenticated customer account area: shared chrome around the
// route group, guarded so only signed-in customers can reach it.
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute role="customer">
      <div className="flex min-h-svh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
