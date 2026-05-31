import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { inventoryApi } from '@/lib/api'
import { ArrowLeft, Warehouse } from 'lucide-react'

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

  const [form, setForm] = useState({
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
  const [validation, setValidation] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (validation[field]) {
      setValidation((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Item name is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.quantity || Number(form.quantity) < 0) errs.quantity = 'Valid quantity is required'
    if (!form.unit_cost || Number(form.unit_cost) < 0) errs.unit_cost = 'Valid unit cost is required'
    setValidation(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

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
        <ArrowLeft className="size-4" />
        Back to Inventory
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Warehouse className="size-5" />
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
              onChange={(e) => updateField('name', e.target.value)}
              error={validation.name}
            />

            <Select
              label="Category *"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              options={categoryOptions}
              placeholder="Select category"
              error={validation.category}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Quantity *"
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                error={validation.quantity}
              />
              <Input
                label="Unit"
                placeholder="pcs, kg, sacks, liters"
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minimum Quantity *"
                type="number"
                placeholder="5"
                value={form.min_quantity}
                onChange={(e) => updateField('min_quantity', e.target.value)}
              />
              <Input
                label="Unit Cost (₱) *"
                type="number"
                placeholder="0.00"
                value={form.unit_cost}
                onChange={(e) => updateField('unit_cost', e.target.value)}
                error={validation.unit_cost}
              />
            </div>

            <Input
              label="Supplier (optional)"
              placeholder="e.g., AgriSupply Co."
              value={form.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Any additional notes about this item..."
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
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
