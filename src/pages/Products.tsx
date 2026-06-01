import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/shared/ProductCard'
import { PageHeader, ErrorBanner, EmptyState, Pagination } from '@/components/shared'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { productsApi } from '@/lib/api'
import type { Product } from '@/types'
import { Search, Package } from 'lucide-react'

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
    // fetchProducts will be re-called by the useEffect when page state updates
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <PageHeader title="Marketplace" description="Browse fresh produce and farm supplies from local farmers." />

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
      {error && <ErrorBanner message={error} onRetry={fetchProducts} />}

      {/* Loading */}
      {loading && <PageSpinner text="Loading products..." />}

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
