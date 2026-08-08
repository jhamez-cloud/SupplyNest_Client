"use client"

// Auth context backed by the mock demo-auth (localStorage). Swap the internals
// of lib/demo-auth.ts for real Firebase later and this stays unchanged.

import * as React from "react"
import { useRouter } from "next/navigation"

import { getCurrentUser, signIn, signOut } from "@/lib/demo-auth"
import type { AuthUser } from "@/lib/types"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => AuthUser
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    setUser(getCurrentUser())
    setLoading(false)
  }, [])

  const login = React.useCallback((email: string, password: string) => {
    const next = signIn(email, password)
    setUser(next)
    return next
  }, [])

  const logout = React.useCallback(() => {
    signOut()
    setUser(null)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
