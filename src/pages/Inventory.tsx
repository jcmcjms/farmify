import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { InventoryTable } from '@/components/shared/InventoryTable'
import { PageHeader, ErrorBanner, EmptyState, Pagination } from '@/components/shared'
import { inventoryApi } from '@/lib/api'
import type { InventoryItem } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Search01Icon, WarehouseIcon } from '@hugeicons/core-free-icons'

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
      <PageHeader title="Inventory" description="Track your farm supplies, seeds, fertilizers, and equipment.">
        <Button onClick={() => navigate('/inventory/new')}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Item
        </Button>
      </PageHeader>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

      {error && <ErrorBanner message={error} onRetry={fetchItems} />}

      {loading && <PageSpinner text="Loading inventory..." />}

      {!loading && !error && (
        <>
          <InventoryTable items={items} />

          {items.length === 0 && (
            <EmptyState
              icon={Warehouse}
              title="No inventory items"
              description="Start adding your farm supplies and materials."
              action={{ label: 'Add First Item', onClick: () => navigate('/inventory/new') }}
            />
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} variant="simple" />
        </>
      )}
    </div>
  )
}
