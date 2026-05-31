import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { InventoryTable } from '@/components/shared/InventoryTable'
import { inventoryApi } from '@/lib/api'
import type { InventoryItem } from '@/types'
import { Plus, Warehouse, Search, AlertCircle } from 'lucide-react'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizers', label: 'Fertilizers' },
  { value: 'pesticides', label: 'Pesticides' },
  { value: 'tools', label: 'Tools & Equipment' },
  { value: 'feed', label: 'Animal Feed' },
  { value: 'supplies', label: 'Farm Supplies' },
  { value: 'other', label: 'Other' },
]

/**
 * Inventory management page — view, search, and filter inventory items.
 */
export default function Inventory() {
  const navigate = useNavigate()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' }
      if (search.trim()) params.search = search.trim()
      if (category) params.category = category
      const res = await inventoryApi.getAll(params)
      if (res.data) {
        setItems(res.data)
        setTotalPages(res.pagination?.totalPages || 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchItems()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Warehouse className="size-7" />
            Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your farm supplies, seeds, fertilizers, and equipment.
          </p>
        </div>
        <Button onClick={() => navigate('/inventory/new')}>
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
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

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchItems}>
            Retry
          </Button>
        </div>
      )}

      {loading && <PageSpinner text="Loading inventory..." />}

      {!loading && !error && (
        <>
          <InventoryTable items={items} />

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Warehouse className="size-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No inventory items</h3>
              <p className="text-muted-foreground mt-1">
                Start adding your farm supplies and materials.
              </p>
              <Button className="mt-4" onClick={() => navigate('/inventory/new')}>
                <Plus className="size-4" />
                Add First Item
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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
