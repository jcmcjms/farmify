import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageSpinner } from '@/components/ui/spinner'
import { ordersApi, deliveriesApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { Order, Delivery } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  PackageIcon,
  DeliveryTruck01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'

const statusUpdateOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const deliveryStatusLabels: Record<string, string> = {
  waiting_assignment: 'Waiting for Driver',
  assigned: 'Driver Assigned',
  accepted: 'Driver Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

/**
 * Order detail — view order info, items, and delivery tracking.
 */
export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isFarmer = user?.role === 'farmer'
  const isBuyer = user?.role === 'buyer'

  const [order, setOrder] = useState<Order | null>(null)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
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

          // Also fetch delivery if order is past confirmed
          const orderStatus = res.data.status
          if (['ready_for_pickup', 'picked_up', 'in_transit', 'delivered'].includes(orderStatus)) {
            try {
              const delRes = await deliveriesApi.getByOrder(res.data.id)
              if (delRes.data) {
                setDelivery(delRes.data)
              }
            } catch {
              // Delivery might not exist yet — that's ok
            }
          }
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

        // If just marked ready_for_pickup, try to load delivery
        if (newStatus === 'ready_for_pickup') {
          try {
            const delRes = await deliveriesApi.getByOrder(res.data.id)
            if (delRes.data) {
              setDelivery(delRes.data)
            }
          } catch {
            // Will appear once auto-assign runs
          }
        }
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
          {statusLabels[order.status] || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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

      {/* Delivery Tracking (Buyer View) */}
      {isBuyer && delivery && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DeliveryTruck01Icon className="size-5 text-primary" />
              Delivery Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Driver Info */}
            <div className="rounded-md bg-muted/50 p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Driver</span>
                  <p className="font-medium">{delivery.driver_name || 'Assigning...'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicle</span>
                  <p className="font-medium">{delivery.driver_vehicle || '—'}</p>
                </div>
                {delivery.driver_phone && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Contact</span>
                    <p className="font-medium">{delivery.driver_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-primary/10 text-primary border border-primary/20">
                {deliveryStatusLabels[delivery.status] || delivery.status}
              </Badge>
            </div>

            {/* Timeline Steps */}
            <div className="flex items-center justify-between pt-2">
              {['accepted', 'picked_up', 'in_transit', 'delivered'].map((step, i) => {
                const stepOrder = ['accepted', 'picked_up', 'in_transit', 'delivered']
                const currentIdx = stepOrder.indexOf(delivery.status)
                const stepIdx = stepOrder.indexOf(step)
                const completed = stepIdx <= currentIdx

                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs
                        ${completed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {completed ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-[10px] ${completed ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step === 'accepted' ? 'Accepted'
                        : step === 'picked_up' ? 'Picked Up'
                        : step === 'in_transit' ? 'In Transit'
                        : 'Delivered'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Tracking (Farmer View) */}
      {isFarmer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DeliveryTruck01Icon className="size-5 text-primary" />
              Delivery Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {delivery ? (
              <>
                {/* Driver Info */}
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Driver</span>
                      <p className="font-medium">{delivery.driver_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vehicle</span>
                      <p className="font-medium">{delivery.driver_vehicle || '—'}</p>
                    </div>
                    {delivery.driver_phone && (
                      <div>
                        <span className="text-muted-foreground">Contact</span>
                        <p className="font-medium">{delivery.driver_phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className="font-medium">{deliveryStatusLabels[delivery.status] || delivery.status}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Timeline */}
                {delivery.status !== 'waiting_assignment' && (
                  <div className="flex items-center justify-between pt-1">
                    {['accepted', 'picked_up', 'in_transit', 'delivered'].map((step) => {
                      const stepOrder = ['accepted', 'picked_up', 'in_transit', 'delivered']
                      const currentIdx = stepOrder.indexOf(delivery.status)
                      const stepIdx = stepOrder.indexOf(step)
                      const completed = stepIdx <= currentIdx

                      return (
                        <div key={step} className="flex flex-col items-center gap-1">
                          <div
                            className={`size-6 rounded-full flex items-center justify-center text-[10px]
                              ${completed
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {completed ? '✓' : stepIdx + 1}
                          </div>
                          <span className={`text-[10px] ${completed ? 'font-medium' : 'text-muted-foreground'}`}>
                            {step === 'accepted' ? 'Accept'
                              : step === 'picked_up' ? 'Pickup'
                              : step === 'in_transit' ? 'Transit'
                              : 'Deliver'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              /* No delivery yet — farmer can mark ready */
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No driver assigned yet. Auto-assign will find a driver when you mark the order as ready for pickup.
                </p>

                {/* Status Update Controls */}
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
              </div>
            )}

            {/* Show status select even when delivery exists for manual override */}
            {delivery && (
              <div className="flex items-center gap-4 pt-2 border-t">
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
