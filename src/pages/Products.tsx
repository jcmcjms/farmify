import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { productsApi } from '@/lib/api'
import type { Product } from '@/types'
import { Search, Package, AlertCircle } from 'lucide-react'

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
      navigate('/login')
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
    fetchProducts()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
        <p className="mt-1 text-muted-foreground">
          Browse fresh produce and farm supplies from local farmers.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchProducts}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && <PageSpinner text="Loading products..." />}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No products found</h3>
          <p className="text-muted-foreground mt-1">
            {search || category
              ? 'Try a different search term or category.'
              : 'No products available yet. Check back soon!'}
          </p>
          {(search || category) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setCategory('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
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
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
