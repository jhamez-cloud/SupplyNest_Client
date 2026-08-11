// Simulated Firebase auth for demo purposes.
// Stores a mock Firebase user token in localStorage. No real Firebase yet —
// swapping to real Firebase later means replacing this file's internals only.

import type { AuthUser } from "@/lib/types"

const STORAGE_KEY = "mock_firebase_user"

interface DemoAccount {
  email: string
  password: string
  user: AuthUser
  label: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "demo.customer@packaging.com",
    password: "Demo123!",
    label: "Customer (Individual)",
    user: {
      uid: "cust-individual-001",
      email: "demo.customer@packaging.com",
      role: "customer",
      customer_type: "individual",
    },
  },
  {
    email: "demo.business@packaging.com",
    password: "Demo123!",
    label: "Customer (Business)",
    user: {
      uid: "cust-business-001",
      email: "demo.business@packaging.com",
      role: "customer",
      customer_type: "business",
    },
  },
  {
    email: "admin@packaging.com",
    password: "Admin123!",
    label: "Admin",
    user: {
      uid: "admin-001",
      email: "admin@packaging.com",
      role: "admin",
    },
  },
]

export function signIn(email: string, password: string): AuthUser {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  )

  if (!account) {
    throw new Error("Invalid email or password")
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account.user))
  }

  return account.user
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function getToken(): string | null {
  const user = getCurrentUser()
  return user ? `mock-token-${user.uid}` : null
}
