"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Search, Sparkles, Truck } from "lucide-react"

import { GlassCard } from "@/components/glassmorphic/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product/product-card"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"
import { ErrorState } from "@/components/shared/error-state"
import {
  getCategories,
  getFeaturedProducts,
  getActivePromotions,
} from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

// Fade-up on scroll into view, disabled under reduced-motion preference.
function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = React.useState("")

  const featured = useMockApi(() => getFeaturedProducts(), [])
  const promos = useMockApi(() => getActivePromotions(), [])
  const categories = useMockApi(() => getCategories(), [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    router.push(q ? `/catalog?search=${encodeURIComponent(q)}` : "/catalog")
  }

  const activePromo = promos.data?.[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-16 size-80 rounded-full bg-primary/10 blur-3xl" />

        <GlassCard className="relative px-6 py-14 text-center sm:px-12 lg:py-20">
          <FadeUp>
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Sustainable packaging, delivered across Ghana
            </Badge>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Packaging and drinkware that keeps your business moving
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
              Cups, containers, tumblers and bags in bulk — sourced responsibly
              and delivered to your door.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-md items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="h-11 rounded-xl bg-background/80 pl-9"
                />
              </div>
              <Button type="submit" size="lg" className="h-11">
                Search
              </Button>
            </form>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/catalog">
                  Browse the catalog
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Truck className="size-4" />
                Nationwide delivery
              </span>
            </div>
          </FadeUp>
        </GlassCard>
      </section>

      {/* Promo banner */}
      {!promos.loading && activePromo && (
        <FadeUp className="mt-8">
          <Link href="/catalog" className="block">
            <GlassCard className="flex flex-col items-start justify-between gap-3 border-primary/30 bg-primary/10 px-6 py-5 transition-colors hover:bg-primary/15 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <Badge className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  {activePromo.promotion_type === "discount"
                    ? "Limited offer"
                    : "Promotion"}
                </Badge>
                <p className="font-heading text-lg font-semibold">
                  {activePromo.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activePromo.description}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                Shop now
                <ArrowRight className="size-4" />
              </span>
            </GlassCard>
          </Link>
        </FadeUp>
      )}

      {/* Featured products */}
      <section className="mt-14">
        <FadeUp>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Featured products
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Popular picks from across the catalog.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/catalog">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </FadeUp>

        {featured.loading ? (
          <ProductGridSkeleton count={4} />
        ) : featured.error ? (
          <ErrorState onRetry={featured.refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.data?.map((product, i) => (
              <FadeUp key={product.id} delay={Math.min(i * 0.05, 0.2)}>
                <ProductCard product={product} />
              </FadeUp>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="mt-16">
        <FadeUp>
          <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight">
            Shop by category
          </h2>
        </FadeUp>

        {categories.loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} className="h-28 animate-pulse" />
            ))}
          </div>
        ) : categories.error ? (
          <ErrorState onRetry={categories.refetch} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {categories.data?.map((category, i) => (
              <FadeUp key={category.id} delay={Math.min(i * 0.05, 0.2)}>
                <Link
                  href={`/catalog?category=${category.id}`}
                  className="group block h-full"
                >
                  <GlassCard
                    className={cn(
                      "flex h-full flex-col justify-between gap-4 p-5",
                      "transition-shadow hover:shadow-xl"
                    )}
                  >
                    <div>
                      <p className="font-heading text-lg font-semibold">
                        {category.name}
                      </p>
                      {category.children && category.children.length > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {category.children.map((c) => c.name).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      Explore
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </GlassCard>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
