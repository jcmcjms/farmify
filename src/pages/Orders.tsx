import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { PageHeader, ErrorBanner, EmptyState, Pagination } from '@/components/shared'
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
      <PageHeader
        title={isFarmer ? 'Orders Received' : 'My Orders'}
        description={isFarmer ? 'Orders placed for your products.' : 'Track your purchases.'}
      >
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
      </PageHeader>

      {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

      {loading && <PageSpinner text="Loading orders..." />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={Package}
          title="No orders found"
          description={
            statusFilter
              ? 'No orders with this status.'
              : isFarmer
                ? "You haven't received any orders yet."
                : "You haven't placed any orders yet."
          }
          action={
            !isFarmer
              ? { label: 'Browse Marketplace', onClick: () => navigate('/marketplace') }
              : undefined
          }
        />
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

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            variant="simple"
          />
        </div>
      )}
    </div>
  )
}
