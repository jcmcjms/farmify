import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageSpinner } from '@/components/ui/spinner'
import { ordersApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { Order } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, PackageIcon } from '@hugeicons/core-free-icons'

const statusUpdateOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

/**
 * Order detail — view order info, items, and update status (farmer only).
 */
export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isFarmer = user?.role === 'farmer'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await ordersApi.getById(Number(id))
        if (res.data) {
          setOrder(res.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!order || !newStatus || newStatus === order.status) return

    setUpdating(true)
    try {
      const res = await ordersApi.updateStatus(order.id, {
        status: newStatus as Order['status'],
      })
      if (res.data) {
        setOrder(res.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <PageSpinner text="Loading order..." />

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <HugeiconsIcon icon={PackageIcon} className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Order Not Found</h2>
        <p className="text-muted-foreground mt-1">{error || 'This order does not exist.'}</p>
        <Button className="mt-4" onClick={() => navigate('/orders')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/orders')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Orders
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
          <p className="text-muted-foreground mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.product_name || `Product #${item.product_id}`}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items details available.</p>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatCurrency(order.total_amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Shipping Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Address</span>
              <p className="font-medium">{order.shipping_address || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Method</span>
              <p className="font-medium capitalize">{order.payment_method || 'Not specified'}</p>
            </div>
          </div>
          {order.notes && (
            <div>
              <span className="text-muted-foreground">Notes</span>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update (Farmer only) */}
      {isFarmer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={statusUpdateOptions}
                />
              </div>
              {updating && (
                <span className="text-sm text-muted-foreground animate-pulse">Updating...</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
