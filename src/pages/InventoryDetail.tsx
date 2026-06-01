import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageSpinner } from '@/components/ui/spinner'
import { inventoryApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { InventoryItem, InventoryTransaction } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, CheckmarkCircle01Icon, Clock01Icon, DangerIcon, MinusSignIcon, PackageIcon, PlusSignIcon, RotateLeft01Icon } from '@hugeicons/core-free-icons'

const transactionTypeOptions = [
  { value: 'in', label: 'Stock In' },
  { value: 'out', label: 'Stock Out' },
  { value: 'adjustment', label: 'Adjustment' },
]

/**
 * Inventory detail — item info, stock level, transaction history, add transaction.
 */
export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Transaction form
  const [showForm, setShowForm] = useState(false)
  const [txType, setTxType] = useState('in')
  const [txQuantity, setTxQuantity] = useState('')
  const [txNotes, setTxNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [txError, setTxError] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [itemRes, txRes] = await Promise.all([
          inventoryApi.getById(Number(id)),
          inventoryApi.getTransactions(Number(id)),
        ])
        if (itemRes.data) setItem(itemRes.data)
        if (txRes.data) setTransactions(txRes.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory item')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const getStockStatus = () => {
    if (!item) return { label: '', color: 'default' as const, icon: CheckmarkCircle01Icon }
    const ratio = item.quantity / Math.max(item.min_quantity, 1)
    if (ratio <= 0) return { label: 'Out of Stock', color: 'danger' as const, icon: DangerIcon }
    if (ratio <= 0.5) return { label: 'Critical', color: 'danger' as const, icon: DangerIcon }
    if (ratio <= 1) return { label: 'Low Stock', color: 'warning' as const, icon: Clock01Icon }
    return { label: 'In Stock', color: 'success' as const, icon: CheckmarkCircle01Icon }
  }

  const handleAddTransaction = async () => {
    if (!item || !txQuantity || Number(txQuantity) <= 0) {
      setTxError('Please enter a valid quantity')
      return
    }

    setSubmitting(true)
    setTxError('')
    try {
      await inventoryApi.addTransaction(item.id, {
        type: txType as InventoryTransaction['type'],
        quantity: Number(txQuantity),
        notes: txNotes || undefined,
      })

      // Refresh data
      const [itemRes, txRes] = await Promise.all([
        inventoryApi.getById(item.id),
        inventoryApi.getTransactions(item.id),
      ])
      if (itemRes.data) setItem(itemRes.data)
      if (txRes.data) setTransactions(txRes.data)

      // Reset form
      setTxQuantity('')
      setTxNotes('')
      setShowForm(false)
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner text="Loading inventory item..." />

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <HugeiconsIcon icon={PackageIcon} className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Item Not Found</h2>
        <p className="text-muted-foreground mt-1">{error || 'This inventory item does not exist.'}</p>
        <Button className="mt-4" onClick={() => navigate('/inventory')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Back to Inventory
        </Button>
      </div>
    )
  }

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon
  const totalValue = item.quantity * item.unit_cost

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/inventory')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Inventory
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Item Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {item.category}
                  </p>
                </div>
                <Badge variant={stockStatus.color} className="gap-1">
                  <StatusIcon className="size-3" />
                  {stockStatus.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className={`text-2xl font-bold ${item.quantity <= item.min_quantity ? 'text-destructive' : ''}`}>
                    {item.quantity}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min Quantity</p>
                  <p className="text-2xl font-bold">{item.min_quantity} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.unit_cost)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                {item.supplier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier</span>
                    <span className="font-medium">{item.supplier}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added on</span>
                  <span className="font-medium">{formatDate(item.created_at)}</span>
                </div>
              </div>

              {item.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm font-medium mt-0.5">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : <><HugeiconsIcon icon={PlusSignIcon} className="size-4" /> Add Transaction</>}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Add transaction form */}
              {showForm && (
                <div className="mb-6 rounded-lg border border-border p-4 space-y-4">
                  <h4 className="font-medium text-sm">New Transaction</h4>
                  {txError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                      {txError}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      options={transactionTypeOptions}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(e.target.value)}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={txNotes}
                      onChange={(e) => setTxNotes(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddTransaction} disabled={submitting} size="sm">
                    {submitting ? 'Adding...' : 'Record Transaction'}
                  </Button>
                </div>
              )}

              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === 'in' && <HugeiconsIcon icon={PlusSignIcon} className="size-4 text-green-600" />}
                        {tx.type === 'out' && <HugeiconsIcon icon={MinusSignIcon} className="size-4 text-red-600" />}
                        {tx.type === 'adjustment' && <HugeiconsIcon icon={RotateLeft01Icon} className="size-4 text-amber-600" />}
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === 'in' ? 'text-green-600' : tx.type === 'out' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : '±'}{tx.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — stock indicator */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Stock Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="relative mx-auto mb-4 flex size-28 items-center justify-center rounded-full border-4 border-muted">
                  <span className={`text-3xl font-bold ${
                    stockStatus.color === 'danger' ? 'text-destructive' :
                    stockStatus.color === 'warning' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {Math.round((item.quantity / Math.max(item.min_quantity, 1)) * 100)}%
                  </span>
                </div>
                <Badge variant={stockStatus.color} className="gap-1">
                  <StatusIcon className="size-3" />
                  {stockStatus.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-medium">{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum</span>
                  <span className="font-medium">{item.min_quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Needed to restock</span>
                  <span className="font-medium">
                    {Math.max(0, item.min_quantity - item.quantity)} {item.unit}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
