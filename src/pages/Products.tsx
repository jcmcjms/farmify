import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/shared/ProductCard'
import { PageHeader, ErrorBanner, EmptyState, Pagination } from '@/components/shared'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { productsApi } from '@/lib/api'
import type { Product } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Login01Icon, PackageIcon, Search01Icon } from '@hugeicons/core-free-icons'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'grains', label: 'Grains & Rice' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'seeds', label: 'Seeds & Seedlings' },
  { value: 'fertilizers', label: 'Fertilizers' },
  { value: 'tools', label: 'Farm Tools' },
  { value: 'other', label: 'Other' },
]

/**
 * Marketplace page with search, filter, and product grid.
 */
export default function Products() {
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchParams] = useSearchParams()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { page: String(page), limit: '12' }
      if (search.trim()) params.search = search.trim()
      if (category) params.category = category
      const res = await productsApi.getAll(params)
      if (res.data) {
        setProducts(res.data)
        setTotalPages(res.pagination.totalPages || 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=marketplace')
      return
    }
    try {
      await addToCart(product)
    } catch {
      // Error is handled silently
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    // fetchProducts will be re-called by the useEffect when page state updates
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <PageHeader title="Marketplace" description="Browse fresh produce and farm supplies from local farmers." />

      {/* Auth hint for unauthenticated users */}
      {!isAuthenticated && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <HugeiconsIcon icon={Login01Icon} className="size-4 shrink-0" />
          <span>
            <strong>Sign in</strong> to add items to your cart and purchase products.{' '}
            <button
              onClick={() => navigate('/login?redirect=marketplace')}
              className="underline font-medium hover:text-blue-900"
            >
              Login here
            </button>
          </span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <div className="w-full sm:w-48">
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            options={categoryOptions}
            placeholder="All Categories"
          />
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={fetchProducts} />}

      {/* Loading — skeleton grid */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            search || category
              ? 'Try a different search term or category.'
              : 'No products available yet. Check back soon!'
          }
          action={
            search || category
              ? { label: 'Clear Filters', onClick: () => { setSearch(''); setCategory(''); setPage(1) } }
              : undefined
          }
        />
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            variant="full"
          />
        </>
      )}
    </div>
  )
}
