"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, SearchX, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { ProductCard } from "@/components/product/product-card"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"
import {
  ProductFilters,
  type CatalogFilterState,
} from "@/components/product/product-filters"
import {
  getCategories,
  getMaterials,
  getProducts,
  getUseCases,
  type ProductFilters as ApiProductFilters,
} from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"

type SortValue = NonNullable<ApiProductFilters["sort"]>

interface CatalogState extends CatalogFilterState {
  search: string
  sort: SortValue | ""
}

const PAGE_SIZE = 12
const SORT_NONE = "relevance"

const SORT_LABELS: Record<SortValue, string> = {
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
}

const numberParam = (value: string | null): number | undefined => {
  if (value == null || value.trim() === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseState(params: URLSearchParams): CatalogState {
  const rawSort = params.get("sort")
  const sort = rawSort && rawSort in SORT_LABELS ? (rawSort as SortValue) : ""
  return {
    search: params.get("search") ?? "",
    category: numberParam(params.get("category")),
    material: numberParam(params.get("material")),
    useCase: numberParam(params.get("use_case")),
    minPrice: numberParam(params.get("min")),
    maxPrice: numberParam(params.get("max")),
    inStock: params.get("in_stock") === "true",
    sort,
  }
}

function serializeState(state: CatalogState): string {
  const params = new URLSearchParams()
  if (state.search) params.set("search", state.search)
  if (state.category != null) params.set("category", String(state.category))
  if (state.material != null) params.set("material", String(state.material))
  if (state.useCase != null) params.set("use_case", String(state.useCase))
  if (state.minPrice != null) params.set("min", String(state.minPrice))
  if (state.maxPrice != null) params.set("max", String(state.maxPrice))
  if (state.inStock) params.set("in_stock", "true")
  if (state.sort) params.set("sort", state.sort)
  return params.toString()
}

function toApiFilters(state: CatalogState): ApiProductFilters {
  return {
    search: state.search || undefined,
    category: state.category,
    material: state.material,
    useCase: state.useCase,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock || undefined,
    sort: state.sort || undefined,
  }
}

function CatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [state, setState] = React.useState<CatalogState>(() =>
    parseState(new URLSearchParams(searchParams.toString()))
  )
  const [searchInput, setSearchInput] = React.useState(state.search)
  const [visible, setVisible] = React.useState(PAGE_SIZE)

  const serialized = serializeState(state)

  // Push filter state into the URL so reload / share preserves it.
  React.useEffect(() => {
    const current = searchParams.toString()
    if (current !== serialized) {
      router.replace(serialized ? `/catalog?${serialized}` : "/catalog")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized])

  // Reset pagination whenever the query changes.
  React.useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [serialized])

  const categories = useMockApi(() => getCategories(), [])
  const materials = useMockApi(() => getMaterials(), [])
  const useCases = useMockApi(() => getUseCases(), [])
  const products = useMockApi(
    () => getProducts(toApiFilters(state)),
    [serialized]
  )

  const patchFilters = (patch: Partial<CatalogFilterState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  const resetFilters = () =>
    setState((prev) => ({
      search: prev.search,
      sort: prev.sort,
      inStock: false,
    }))

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setState((prev) => ({ ...prev, search: searchInput.trim() }))
  }

  const filterProps = {
    categories: categories.data ?? [],
    materials: materials.data ?? [],
    useCases: useCases.data ?? [],
    value: state,
    onChange: patchFilters,
    onReset: resetFilters,
  }

  const items = products.data ?? []
  const shown = items.slice(0, visible)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Catalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse packaging and drinkware for your business.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <GlassCard className="sticky top-20 p-5">
            <ProductFilters {...filterProps} />
          </GlassCard>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={submitSearch} className="flex flex-1 gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2">
              {/* Mobile filter trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetTitle className="mb-4">Filters</SheetTitle>
                  <ProductFilters {...filterProps} />
                </SheetContent>
              </Sheet>

              <Select
                value={state.sort || SORT_NONE}
                onValueChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    sort: v === SORT_NONE ? "" : (v as SortValue),
                  }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SORT_NONE}>Relevance</SelectItem>
                  {(Object.keys(SORT_LABELS) as SortValue[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {products.loading ? (
            <ProductGridSkeleton />
          ) : products.error ? (
            <ErrorState onRetry={products.refetch} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No products found"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "product" : "products"}
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {visible < items.length && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    <Filter className="size-4" />
                    Load more ({items.length - visible} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <React.Suspense fallback={<ProductGridSkeleton />}>
      <CatalogContent />
    </React.Suspense>
  )
}
