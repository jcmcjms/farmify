import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@/hooks/useForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { inventoryApi } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, WarehouseIcon } from '@hugeicons/core-free-icons'

const categoryOptions = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizers', label: 'Fertilizers' },
  { value: 'pesticides', label: 'Pesticides' },
  { value: 'tools', label: 'Tools & Equipment' },
  { value: 'feed', label: 'Animal Feed' },
  { value: 'supplies', label: 'Farm Supplies' },
  { value: 'other', label: 'Other' },
]

/**
 * New inventory item form.
 */
export default function NewInventoryItem() {
  const navigate = useNavigate()

  const { form, errors, setField, validate } = useForm({
    name: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    min_quantity: '5',
    unit_cost: '',
    supplier: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate({
      name: (v) => !v.trim() ? 'Item name is required' : undefined,
      category: (v) => !v ? 'Category is required' : undefined,
      quantity: (v) => (!v || Number(v) < 0) ? 'Valid quantity is required' : undefined,
      unit_cost: (v) => (!v || Number(v) < 0) ? 'Valid unit cost is required' : undefined,
    })) return

    setSubmitting(true)
    try {
      await inventoryApi.create({
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        min_quantity: Number(form.min_quantity),
        unit_cost: Number(form.unit_cost),
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
      })
      navigate('/inventory')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/inventory')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Inventory
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HugeiconsIcon icon={WarehouseIcon} className="size-5" />
            Add Inventory Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Input
              label="Item Name *"
              placeholder="e.g., Organic Rice Seeds"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
            />

            <Select
              label="Category *"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              options={categoryOptions}
              placeholder="Select category"
              error={errors.category}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Quantity *"
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
                error={errors.quantity}
              />
              <Input
                label="Unit"
                placeholder="pcs, kg, sacks, liters"
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minimum Quantity *"
                type="number"
                placeholder="5"
                value={form.min_quantity}
                onChange={(e) => setField('min_quantity', e.target.value)}
              />
              <Input
                label="Unit Cost (₱) *"
                type="number"
                placeholder="0.00"
                value={form.unit_cost}
                onChange={(e) => setField('unit_cost', e.target.value)}
                error={errors.unit_cost}
              />
            </div>

            <Input
              label="Supplier (optional)"
              placeholder="e.g., AgriSupply Co."
              value={form.supplier}
              onChange={(e) => setField('supplier', e.target.value)}
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Any additional notes about this item..."
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Item'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/inventory')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
