import { useNavigate } from 'react-router-dom'
import type { InventoryItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon, Clock01Icon, DangerIcon } from '@hugeicons/core-free-icons'

interface InventoryTableProps {
  items: InventoryItem[]
  onDelete?: (id: number) => void
}

/**
 * Helper to determine stock level status.
 */
function getStockStatus(item: InventoryItem): { label: string; color: 'success' | 'warning' | 'danger'; icon: typeof CheckCircle } {
  const ratio = item.quantity / item.min_quantity
  if (ratio <= 0) return { label: 'Out of Stock', color: 'danger', icon: DangerIcon }
  if (ratio <= 0.5) return { label: 'Critical', color: 'danger', icon: DangerIcon }
  if (ratio <= 1) return { label: 'Low Stock', color: 'warning', icon: Clock01Icon }
  return { label: 'In Stock', color: 'success', icon: CheckmarkCircle01Icon }
}

/**
 * Inventory table for farmers to view and manage inventory items.
 */
export function InventoryTable({ items }: InventoryTableProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HugeiconsIcon icon={DangerIcon} className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">No inventory items found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantity</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Unit Cost</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const status = getStockStatus(item)
            const StatusIcon = status.icon
            return (
              <tr
                key={item.id}
                onClick={() => navigate(`/inventory/${item.id}`)}
                className="bg-white transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{item.category}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${item.quantity <= item.min_quantity ? 'text-destructive' : ''}`}>
                    {item.quantity}
                  </span>
                  <span className="text-muted-foreground ml-1">{item.unit}</span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatCurrency(item.unit_cost)}/{item.unit}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={status.color} className="gap-1">
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(item.quantity * item.unit_cost)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
