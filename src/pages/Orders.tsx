import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { ordersApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { Order } from '@/types'
import { ShoppingBag, Package } from 'lucide-react'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

/**
 * Orders page — list of orders with status filter.
 */
export default function Orders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isFarmer = user?.role === 'farmer'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' }
      if (statusFilter) params.status = statusFilter
      const res = await ordersApi.getAll(params)
      if (res.data) {
        setOrders(res.data)
        setTotalPages(res.pagination?.totalPages || 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isFarmer ? 'Orders Received' : 'My Orders'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFarmer ? 'Orders placed for your products.' : 'Track your purchases.'}
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <PageSpinner text="Loading orders..." />}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No orders found</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter
              ? 'No orders with this status.'
              : isFarmer
                ? 'You haven\'t received any orders yet.'
                : 'You haven\'t placed any orders yet.'}
          </p>
          {!isFarmer && (
            <Button className="mt-4" onClick={() => navigate('/marketplace')}>
              Browse Marketplace
            </Button>
          )}
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <ShoppingBag className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.created_at)}
                          {order.buyer_name && ` — by ${order.buyer_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.total_amount)}</p>
                      <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
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
        </div>
      )}
    </div>
  )
}
