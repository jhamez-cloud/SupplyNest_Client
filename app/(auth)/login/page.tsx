"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"
import { toast } from "sonner"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { DEMO_ACCOUNTS } from "@/lib/demo-auth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const redirectByRole = (role: "customer" | "admin") => {
    router.push(role === "admin" ? "/admin" : "/")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const user = login(email, password)
      toast.success(`Welcome back, ${user.email}`)
      redirectByRole(user.role)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in")
      setSubmitting(false)
    }
  }

  const handleDemo = (demoEmail: string, demoPassword: string) => {
    setSubmitting(true)
    try {
      const user = login(demoEmail, demoPassword)
      toast.success(`Signed in as ${user.email}`)
      redirectByRole(user.role)
    } catch {
      toast.error("Demo sign-in failed")
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-primary/10 blur-3xl" />

      <GlassCard className="w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">
            SupplyNest
          </span>
        </Link>

        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Enter your details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">
            or try a demo account
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              className="w-full justify-between"
              disabled={submitting}
              onClick={() => handleDemo(account.email, account.password)}
            >
              <span>{account.label}</span>
              <span className="text-xs text-muted-foreground">
                {account.email}
              </span>
            </Button>
          ))}
        </div>
      </GlassCard>
    </main>
  )
}
