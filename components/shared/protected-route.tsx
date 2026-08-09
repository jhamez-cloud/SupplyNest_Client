"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"

// Client-side route guard. The mock auth token lives in localStorage, which the
// server-side proxy cannot read, so protection happens here on the client.
export function ProtectedRoute({
  role,
  children,
}: {
  role: "customer" | "admin"
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      )
    } else if (user.role !== role) {
      // Signed in but wrong role — send to their own home.
      router.replace(user.role === "admin" ? "/admin" : "/")
    }
  }, [user, loading, role, router])

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  return <>{children}</>
}
